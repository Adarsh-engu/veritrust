"""
backend/agents/judge.py
"""

import json
from concurrent.futures import ThreadPoolExecutor
from typing import Any
import pydantic
import ollama

from backend import config
from backend.contracts import Claim, ClaimSpan, Evidence, JudgeOutput
from backend.agents.checker import extract_quantities

_JUDGE_SYSTEM = """\
You are a strict factual judge. Review the claim against the provided evidence.
Output ONLY valid JSON matching the JudgeOutput schema:
{"status": "SUPPORTED" | "CONTRADICTED" | "UNSUPPORTED", "reason": "...", "evidence_ids": ["..."]}

Status MUST be exactly one of: "SUPPORTED", "CONTRADICTED", or "UNSUPPORTED". Do not use "UNKNOWN".
You MUST ALWAYS include the "evidence_ids" key. If there are no cited chunks, use an empty list: []
If the claim goes beyond or is not found in the evidence, use "UNSUPPORTED".
If the claim is directly contradicted by the evidence, use "CONTRADICTED".
"""

_JUDGE_PROMPT = """\
Claim: {claim}

Evidence:
{context}
"""

_CACHE: dict[tuple, Any] = {}

def format_evidence_for_judge(evidence: list[Evidence]) -> str:
    lines = []
    for ev in evidence:
        lines.append(f'[{ev.chunk_id}]: "{ev.text}"')
    return "\n".join(lines) if lines else "(no evidence)"

def _run_judge_ollama(client, model, prompt, timeout_s, keep_alive, retry=1):
    for attempt in range(retry + 1):
        try:
            resp = client.generate(
                model=model,
                system=_JUDGE_SYSTEM,
                prompt=prompt,
                stream=False,
                keep_alive=keep_alive,
                format="json",
                options={"temperature": 0.0},
            )
            text = (resp.response or "").strip()
            # Try to parse
            try:
                parsed = json.loads(text)
                output = JudgeOutput(**parsed)
                tokens = (resp.prompt_eval_count or 0) + (resp.eval_count or 0)
                eval_ns = getattr(resp, "eval_duration", None) or 0
                eval_duration_ms = eval_ns // 1_000_000
                return output, tokens, eval_duration_ms, attempt == 0
            except (json.JSONDecodeError, pydantic.ValidationError) as e:
                print(f"DEBUG: Parse error {e} on text: {text}")
                if attempt == retry:
                    return None, 0, 0, False
        except Exception as e:
            print(f"DEBUG: Exception: {e}")
            if attempt == retry:
                return None, 0, 0, False
    return None, 0, 0, False

def judge_claim(claim: ClaimSpan, evidence: list[Evidence], question: str) -> tuple[Claim, dict]:
    model = config.JUDGE_MODEL
    host = config.OLLAMA_HOST
    timeout_s = config.OLLAMA_TIMEOUT_S
    keep_alive = config.OLLAMA_KEEP_ALIVE
    
    sorted_chunk_ids = tuple(sorted(e.chunk_id for e in evidence))
    versions = tuple(sorted(set(e.version for e in evidence if e.version)))
    cache_key = (claim.text, sorted_chunk_ids, versions, model)
    
    if cache_key in _CACHE:
        cached_claim, cached_tokens = _CACHE[cache_key]
        return cached_claim, cached_tokens

    context = format_evidence_for_judge(evidence)
    prompt = _JUDGE_PROMPT.format(claim=claim.text, context=context)
    
    import time
    t0 = time.time()
    client = ollama.Client(host=host)
    output, tokens, eval_duration_ms, valid_json_first_try = _run_judge_ollama(client, model, prompt, timeout_s, keep_alive)
    latency_ms = int((time.time() - t0) * 1000)
    
    status = "UNSUPPORTED"
    reason = "Invalid JSON or timeout"
    evidence_ids = []
    
    if output:
        status = output.status
        evidence_ids = output.evidence_ids
        
        reason = (output.reason or "").strip()
        if not reason:
            if status == "SUPPORTED":
                reason = "Claim is supported by evidence."
            elif status == "CONTRADICTED":
                reason = "Claim contradicts the evidence."
            else:
                reason = "Claim is not supported by the evidence."
                
        # Guards
        if status == "SUPPORTED":
            valid_ids = {e.chunk_id for e in evidence}
            has_valid_id = any(eid in valid_ids for eid in evidence_ids)
            if not has_valid_id:
                status = "UNSUPPORTED"
                reason = "Downgraded: cited chunk not in evidence"
            else:
                c_quants = extract_quantities(claim.text)
                q_quants = extract_quantities(question)
                q_vals = {(q['kind'], q['family'], q['value']) for q in q_quants}
                non_echo_c_quants = [cq for cq in c_quants if (cq['kind'], cq['family'], cq['value']) not in q_vals]
                
                if non_echo_c_quants:
                    has_comparable = False
                    cited_chunks = [e for e in evidence if e.chunk_id in evidence_ids]
                    for cq in non_echo_c_quants:
                        match_found = False
                        for e in cited_chunks:
                            e_quants = extract_quantities(e.text)
                            for eq in e_quants:
                                if eq['kind'] == cq['kind'] and eq['family'] == cq['family'] and eq['value'] == cq['value']:
                                    match_found = True
                                    break
                            if match_found:
                                break
                        if not match_found:
                            has_comparable = False
                            break
                        has_comparable = True
                        
                    if not has_comparable:
                        status = "UNSUPPORTED"
                        reason = "Downgraded: cited chunk lacks comparable equal value"

    # Evidence mapping
    matched_evidence = [e for e in evidence if e.chunk_id in evidence_ids]

    final_claim = Claim(
        id=claim.id,
        text=claim.text,
        start=claim.start,
        end=claim.end,
        status=status,
        checked_by="llm",
        reason=reason,
        evidence=matched_evidence
    )
    
    stats = {
        "tokens": tokens,
        "valid_json_first_try": valid_json_first_try,
        "latency_ms": latency_ms,
        "eval_duration_ms": eval_duration_ms
    }
    
    _CACHE[cache_key] = (final_claim, stats)
    return final_claim, stats

def judge_claims(claims: list[ClaimSpan], evidence: list[Evidence], question: str) -> list[tuple[Claim, dict]]:
    results = []
    with ThreadPoolExecutor(max_workers=config.JUDGE_CONCURRENCY) as executor:
        futures = [executor.submit(judge_claim, c, evidence, question) for c in claims]
        for f in futures:
            results.append(f.result())
    return results
