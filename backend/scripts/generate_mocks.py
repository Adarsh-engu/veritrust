import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.contracts import (
    Evidence, ClaimSpan, Claim, RunResult, 
    RunStartedEvent, RetrievedEvent, DraftEvent, ClaimsEvent, 
    ClaimCheckedEvent, CorrectingEvent, CorrectedDraftEvent, 
    FinalEvent, RunFinishedEvent, format_sse_event, ABSTAIN_MESSAGE
)

def get_span(text: str, substring: str) -> tuple[int, int]:
    start = text.find(substring)
    if start == -1:
        raise ValueError(f"Substring '{substring}' not found in text '{text}'")
    return start, start + len(substring)

def make_scenario_corrected():
    question = "Can I return my opened headphones after 20 days?"
    chaos = True
    draft = "Opened electronics can be returned within 30 days."
    
    e1 = Evidence(
        source="refund_policy.md",
        version="v2",
        text="Opened electronics can be returned within 15 days.",
        chunk_id="refund_policy.md#2"
    )
    
    claims_text = [
        "Opened electronics can be returned within 30 days."
    ]
    
    claims = []
    for i, ct in enumerate(claims_text):
        st, en = get_span(draft, ct)
        c = Claim(
            id=i, text=ct, start=st, end=en,
            status="CONTRADICTED",
            checked_by="deterministic",
            reason="Policy says 15 days.",
            evidence=[e1]
        )
        claims.append(c)
        
    final_draft = "Opened electronics can be returned within 15 days, so a 20-day-old purchase is outside the return window."
    
    # We treat final_draft as a single claim for this mock
    final_claims_text = [
        "Opened electronics can be returned within 15 days, so a 20-day-old purchase is outside the return window."
    ]
    final_claims = []
    for i, ct in enumerate(final_claims_text):
        st, en = get_span(final_draft, ct)
        c = Claim(
            id=i, text=ct, start=st, end=en,
            status="SUPPORTED",
            checked_by="deterministic",
            reason="Matches policy exactly and restates customer quantity.",
            evidence=[e1]
        )
        final_claims.append(c)

    run_id = "run-1234"
    result = RunResult(
        run_id=run_id,
        question=question,
        chaos=chaos,
        draft=draft,
        claims=claims,
        final_draft=final_draft,
        final_claims=final_claims,
        final_answer=final_draft,
        final_status="CORRECTED",
        abstain_reason=None,
        retries=1,
        latency_ms={"retrieve": 100, "maker": 500, "check": 50, "judge": 0, "correct": 600, "total": 1250},
        tokens={"maker": 100, "judge": 0},
        policy_versions={"refund_policy.md": "v2"},
        created_at="2026-09-29T12:00:00Z"
    )

    events = [
        {"event": "run_started", "data": RunStartedEvent(run_id=run_id, question=question, chaos=chaos).model_dump()},
        {"event": "retrieved", "data": RetrievedEvent(evidence=[e1]).model_dump()},
        {"event": "draft", "data": DraftEvent(text=draft).model_dump()},
        {"event": "claims", "data": ClaimsEvent(attempt=0, claims=[ClaimSpan(**c.model_dump()) for c in claims]).model_dump()}
    ]
    for c in claims:
        events.append({"event": "claim_checked", "data": ClaimCheckedEvent(attempt=0, claim=c).model_dump()})
        
    events.extend([
        {"event": "correcting", "data": CorrectingEvent(attempt=1, feedback="Claim 1 contradicted. Use 15 days instead.").model_dump()},
        {"event": "corrected_draft", "data": CorrectedDraftEvent(attempt=1, text=final_draft).model_dump()},
        {"event": "claims", "data": ClaimsEvent(attempt=1, claims=[ClaimSpan(**c.model_dump()) for c in final_claims]).model_dump()}
    ])
    
    for c in final_claims:
        events.append({"event": "claim_checked", "data": ClaimCheckedEvent(attempt=1, claim=c).model_dump()})

    events.extend([
        {"event": "final", "data": FinalEvent(answer=final_draft, status="CORRECTED", abstain_reason=None).model_dump()},
        {"event": "run_finished", "data": RunFinishedEvent(result=result).model_dump()}
    ])
    return events

def make_scenario_delivered():
    question = "Can I get a refund?"
    chaos = False
    draft = "Refunds are allowed within 15 days of purchase."
    e1 = Evidence(
        source="refund_policy.md",
        version="v2",
        text="Refunds are allowed within 15 days of purchase.",
        chunk_id="refund_policy.md#1"
    )
    st, en = get_span(draft, draft)
    c = Claim(
        id=0, text=draft, start=st, end=en,
        status="SUPPORTED", checked_by="deterministic", reason="Matches exactly.", evidence=[e1]
    )
    run_id = "run-1235"
    result = RunResult(
        run_id=run_id, question=question, chaos=chaos, draft=draft,
        claims=[c], final_draft=draft, final_claims=[c], final_answer=draft,
        final_status="DELIVERED", abstain_reason=None, retries=0,
        latency_ms={"retrieve": 100, "maker": 500, "check": 50, "judge": 0, "correct": 0, "total": 650},
        tokens={"maker": 50, "judge": 0}, policy_versions={"refund_policy.md": "v2"}, created_at="2026-09-29T12:05:00Z"
    )
    events = [
        {"event": "run_started", "data": RunStartedEvent(run_id=run_id, question=question, chaos=chaos).model_dump()},
        {"event": "retrieved", "data": RetrievedEvent(evidence=[e1]).model_dump()},
        {"event": "draft", "data": DraftEvent(text=draft).model_dump()},
        {"event": "claims", "data": ClaimsEvent(attempt=0, claims=[ClaimSpan(**c.model_dump())]).model_dump()},
        {"event": "claim_checked", "data": ClaimCheckedEvent(attempt=0, claim=c).model_dump()},
        {"event": "final", "data": FinalEvent(answer=draft, status="DELIVERED", abstain_reason=None).model_dump()},
        {"event": "run_finished", "data": RunFinishedEvent(result=result).model_dump()}
    ]
    return events

def make_scenario_abstained():
    question = "Do you offer drone delivery?"
    chaos = False
    draft = "Yes, we offer drone delivery in select areas."
    
    # 4 irrelevant chunks
    e1 = Evidence(source="shipping_policy.md", version="v1", text="Standard shipping takes 3-5 business days.", chunk_id="shipping_policy.md#1")
    e2 = Evidence(source="shipping_policy.md", version="v1", text="Express shipping is available for an extra fee.", chunk_id="shipping_policy.md#2")
    e3 = Evidence(source="payments_policy.md", version="v1", text="We accept all major credit cards.", chunk_id="payments_policy.md#1")
    e4 = Evidence(source="payments_policy.md", version="v1", text="Cash on delivery is not supported.", chunk_id="payments_policy.md#2")

    st, en = get_span(draft, draft)
    c = Claim(
        id=0, text=draft, start=st, end=en,
        status="UNSUPPORTED", checked_by="llm", reason="No mention of drone delivery.", evidence=[]
    )
    run_id = "run-1236"
    result = RunResult(
        run_id=run_id, question=question, chaos=chaos, draft=draft,
        claims=[c], final_draft=draft, final_claims=[c], final_answer=ABSTAIN_MESSAGE,
        final_status="ABSTAINED", abstain_reason="UNSUPPORTED", retries=0,
        latency_ms={"retrieve": 100, "maker": 500, "check": 50, "judge": 400, "correct": 0, "total": 1050},
        tokens={"maker": 50, "judge": 100}, policy_versions={}, created_at="2026-09-29T12:10:00Z"
    )
    events = [
        {"event": "run_started", "data": RunStartedEvent(run_id=run_id, question=question, chaos=chaos).model_dump()},
        {"event": "retrieved", "data": RetrievedEvent(evidence=[e1, e2, e3, e4]).model_dump()},
        {"event": "draft", "data": DraftEvent(text=draft).model_dump()},
        {"event": "claims", "data": ClaimsEvent(attempt=0, claims=[ClaimSpan(**c.model_dump())]).model_dump()},
        {"event": "claim_checked", "data": ClaimCheckedEvent(attempt=0, claim=c).model_dump()},
        {"event": "final", "data": FinalEvent(answer=ABSTAIN_MESSAGE, status="ABSTAINED", abstain_reason="UNSUPPORTED").model_dump()},
        {"event": "run_finished", "data": RunFinishedEvent(result=result).model_dump()}
    ]
    return events

scenarios = {
    "corrected": make_scenario_corrected(),
    "delivered": make_scenario_delivered(),
    "abstained": make_scenario_abstained()
}

out_data = {"scenarios": scenarios}
out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "mocks", "events.json")

# Ensure dir exists if not
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w") as f:
    json.dump(out_data, f, indent=2)

print(f"Generated {out_path} successfully!")
