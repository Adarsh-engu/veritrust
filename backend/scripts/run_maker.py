"""
backend/scripts/run_maker.py
----------------------------
Phase 4 verification script.

Runs 10 VeriCorp questions through the Maker in normal + chaos mode.
Reports per-call: wall-clock latency, total tokens, Ollama generation speed
(eval_count / eval_duration_ms from the Ollama response).
Runs automated checks and prints pass counts.

Usage
-----
    python -m backend.scripts.run_maker
    python -m backend.scripts.run_maker --mode normal
    python -m backend.scripts.run_maker --mode chaos
    python -m backend.scripts.run_maker --model llama3.2:3b

Automated checks
----------------
Normal  : expected fact substring present in answer AND sentence count <= 3.
Chaos   : at least one number in the answer that is NOT in the evidence numbers
          AND sentence count <= 3.
"""

from __future__ import annotations

import argparse
import re
import sys
import textwrap
import time
from typing import NamedTuple

from backend.agents.maker import MakerError, _count_sentences, make_draft

# ---------------------------------------------------------------------------
# Evidence values that are CORRECT (chaos must deviate from these)
# ---------------------------------------------------------------------------
# All numeric strings extracted from STUB_EVIDENCE below.
_EVIDENCE_NUMBERS: set[str] = {"15", "199", "2", "5", "7", "48", "9", "6"}

# ---------------------------------------------------------------------------
# 10 questions with per-question check rules
# ---------------------------------------------------------------------------
# expected_fact : substring that must appear in a correct normal-mode answer.
# (Case-insensitive substring match — same approach as PRD section 13.)
QUESTION_RULES: list[dict] = [
    {
        "question": "Can I return opened headphones after 20 days?",
        "expected_fact": "15",          # must mention 15-day window
    },
    {
        "question": "What is the warranty period for laptops?",
        "expected_fact": "2 year",
    },
    {
        "question": "How much does express shipping cost?",
        "expected_fact": "199",
    },
    {
        "question": "Can I cancel an order after it has shipped?",
        "expected_fact": "2 hours",   # correct answer: cancelable within 2 hrs only if not shipped
    },
    {
        "question": "What payment methods do you accept?",
        "expected_fact": "upi",
    },
    {
        "question": "How long does standard shipping take?",
        "expected_fact": "5",
    },
    {
        "question": "Is there a restocking fee for returned items?",
        "expected_fact": "no restocking",
    },
    {
        "question": "What should I do if my product arrives damaged?",
        "expected_fact": "48",
    },
    {
        "question": "Can I get a refund for a digital product?",
        "expected_fact": "non-refundable",
    },
    {
        "question": "How do I contact VeriCorp customer support?",
        "expected_fact": "monday",
    },
]

QUESTIONS: list[str] = [r["question"] for r in QUESTION_RULES]

# Stub evidence — correct policy values; Phase 2 retrieval not merged yet.
STUB_EVIDENCE = [
    {"text": "Refunds are allowed within 15 days of purchase.",
     "source": "refund_policy.md", "version": "v1", "chunk_id": "refund_policy.md#1"},
    {"text": "Opened electronics can be returned within 15 days.",
     "source": "refund_policy.md", "version": "v1", "chunk_id": "refund_policy.md#2"},
    {"text": "Laptop warranty covers manufacturing defects for 2 years.",
     "source": "warranty_policy.md", "version": "v1", "chunk_id": "warranty_policy.md#1"},
    {"text": "Express shipping costs Rs.199 and delivers within 2 business days.",
     "source": "shipping_policy.md", "version": "v1", "chunk_id": "shipping_policy.md#2"},
    {"text": "Standard shipping is free and takes 5-7 business days.",
     "source": "shipping_policy.md", "version": "v1", "chunk_id": "shipping_policy.md#1"},
    {"text": "Orders can be cancelled within 2 hours of placement if not yet shipped.",
     "source": "cancellation_policy.md", "version": "v1", "chunk_id": "cancellation_policy.md#1"},
    {"text": "We accept UPI, credit cards, debit cards, and net banking.",
     "source": "payments_policy.md", "version": "v1", "chunk_id": "payments_policy.md#1"},
    {"text": "There is no restocking fee for returned items.",
     "source": "refund_policy.md", "version": "v1", "chunk_id": "refund_policy.md#5"},
    {"text": "Damaged items must be reported within 48 hours of delivery with a photo.",
     "source": "support_policy.md", "version": "v1", "chunk_id": "support_policy.md#3"},
    {"text": "Digital product purchases are non-refundable once downloaded.",
     "source": "refund_policy.md", "version": "v1", "chunk_id": "refund_policy.md#8"},
    {"text": "Support is available Monday-Saturday, 9 AM to 6 PM, via chat and email.",
     "source": "support_policy.md", "version": "v1", "chunk_id": "support_policy.md#1"},
]


# ---------------------------------------------------------------------------
# Automatic checks
# ---------------------------------------------------------------------------


def _extract_numbers(text: str) -> set[str]:
    """Extract all standalone integer/decimal numbers from text."""
    return set(re.findall(r"\b\d+(?:\.\d+)?\b", text))


def check_normal(draft: str, expected_fact: str) -> tuple[bool, bool, str]:
    """
    Returns (fact_ok, sentences_ok, reason).
    fact_ok       : expected_fact found (case-insensitive).
    sentences_ok  : sentence count <= 3.
    """
    fact_ok = expected_fact.lower() in draft.lower()
    n = _count_sentences(draft)
    sentences_ok = n <= 3
    reason = []
    if not fact_ok:
        reason.append(f"missing '{expected_fact}'")
    if not sentences_ok:
        reason.append(f"{n} sentences (limit 3)")
    return fact_ok, sentences_ok, "; ".join(reason) if reason else "ok"


def check_chaos(draft: str) -> tuple[bool, bool, str]:
    """
    Returns (wrong_number_ok, sentences_ok, reason).
    wrong_number_ok : at least one number in the draft not in _EVIDENCE_NUMBERS.
    sentences_ok    : sentence count <= 3.
    """
    numbers_in_draft = _extract_numbers(draft)
    wrong_numbers = numbers_in_draft - _EVIDENCE_NUMBERS
    wrong_number_ok = len(wrong_numbers) > 0
    n = _count_sentences(draft)
    sentences_ok = n <= 3
    reason = []
    if not wrong_number_ok:
        reason.append(f"no wrong numbers (found: {numbers_in_draft or 'none'})")
    if not sentences_ok:
        reason.append(f"{n} sentences (limit 3)")
    return wrong_number_ok, sentences_ok, "; ".join(reason) if reason else "ok"


# ---------------------------------------------------------------------------
# Data type
# ---------------------------------------------------------------------------

class RunRecord(NamedTuple):
    question: str
    expected_fact: str
    mode: str
    draft: str
    total_tokens: int
    eval_count: int
    eval_duration_ms: int   # from Ollama, used for generation speed
    wall_ms: int            # total wall-clock time including network
    error: str | None


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def _run_one(rule: dict, mode: str, model: str | None, host: str | None) -> RunRecord:
    question = rule["question"]
    expected_fact = rule.get("expected_fact", "")
    chaos = (mode == "chaos")
    t0 = time.perf_counter()
    try:
        draft, tok = make_draft(question, STUB_EVIDENCE, chaos=chaos,
                                model=model, host=host)
        wall_ms = int((time.perf_counter() - t0) * 1000)
        return RunRecord(
            question=question,
            expected_fact=expected_fact,
            mode=mode,
            draft=draft,
            total_tokens=tok.get("maker", 0),
            eval_count=tok.get("eval_count", 0),
            eval_duration_ms=tok.get("eval_duration_ms", 0),
            wall_ms=wall_ms,
            error=None,
        )
    except MakerError as exc:
        wall_ms = int((time.perf_counter() - t0) * 1000)
        return RunRecord(
            question=question, expected_fact=expected_fact, mode=mode,
            draft="", total_tokens=0, eval_count=0, eval_duration_ms=0,
            wall_ms=wall_ms, error=str(exc),
        )


# ---------------------------------------------------------------------------
# Printing
# ---------------------------------------------------------------------------

def _gen_speed(eval_count: int, eval_duration_ms: int) -> str:
    """Generation speed from Ollama's own timing (not wall-clock)."""
    if eval_duration_ms <= 0 or eval_count <= 0:
        return "n/a"
    return f"{eval_count / eval_duration_ms * 1000:.1f} tok/s"


def _print_record(rec: RunRecord, idx: int, total: int) -> None:
    tag = "[CHAOS]" if rec.mode == "chaos" else "[normal]"
    speed = _gen_speed(rec.eval_count, rec.eval_duration_ms)
    print(f"\n{'-'*72}")
    print(
        f"[{idx}/{total}] {tag}"
        f"  wall={rec.wall_ms:>6}ms"
        f"  tok={rec.total_tokens:>4}"
        f"  gen={rec.eval_count:>3}tok @ {speed}"
    )
    print(f"Q: {rec.question}")
    if rec.error:
        print(f"ERROR: {rec.error}")
        return
    print(textwrap.fill(rec.draft, width=70, initial_indent="A: ", subsequent_indent="   "))

    # Inline check result
    if rec.mode == "normal":
        fact_ok, sent_ok, reason = check_normal(rec.draft, rec.expected_fact)
        status = "PASS" if (fact_ok and sent_ok) else "FAIL"
        print(f"   CHECK [{status}]: fact={fact_ok} sentences<={3}:{sent_ok}  {reason}")
    else:
        wrong_ok, sent_ok, reason = check_chaos(rec.draft)
        status = "PASS" if (wrong_ok and sent_ok) else "FAIL"
        print(f"   CHECK [{status}]: wrong_number={wrong_ok} sentences<={3}:{sent_ok}  {reason}")


def _print_summary(records: list[RunRecord]) -> None:
    normal = [r for r in records if r.mode == "normal" and not r.error]
    chaos  = [r for r in records if r.mode == "chaos"  and not r.error]
    errors = [r for r in records if r.error]

    print(f"\n{'='*72}")
    print("SUMMARY")
    print(f"{'='*72}")

    for label, group in [("Normal", normal), ("Chaos ", chaos)]:
        if not group:
            continue
        avg_wall = sum(r.wall_ms for r in group) // len(group)
        avg_tok  = sum(r.total_tokens for r in group) // len(group)
        avg_pt   = sum(r.total_tokens - r.eval_count for r in group) // len(group)
        avg_ec   = sum(r.eval_count for r in group) // len(group)
        # avg generation speed from Ollama timing
        valid_speeds = [r for r in group if r.eval_duration_ms > 0]
        if valid_speeds:
            avg_speed = sum(
                r.eval_count / r.eval_duration_ms * 1000 for r in valid_speeds
            ) / len(valid_speeds)
            speed_str = f"{avg_speed:.1f} tok/s"
        else:
            speed_str = "n/a"
        print(
            f"{label} - {len(group):>2} runs"
            f" | wall avg {avg_wall:>6}ms"
            f" | avg tok {avg_tok:>4} (prompt~{avg_pt}, gen~{avg_ec})"
            f" | gen speed {speed_str}"
        )

    # Check pass counts
    print()
    if normal:
        n_pass = sum(
            1 for r in normal
            if check_normal(r.draft, r.expected_fact)[0]   # fact_ok
            and check_normal(r.draft, r.expected_fact)[1]  # sentences_ok
        )
        print(f"Normal checks : {n_pass}/{len(normal)} PASS  (expected fact + sentences <= 3)")
    if chaos:
        c_pass = sum(
            1 for r in chaos
            if check_chaos(r.draft)[0]   # wrong_number_ok
            and check_chaos(r.draft)[1]  # sentences_ok
        )
        print(f"Chaos  checks : {c_pass}/{len(chaos)} PASS  (wrong number present + sentences <= 3)")
        if c_pass < 8:
            print("  [!] Chaos pass rate below 8/10 target — consider tuning the prompt.")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for r in errors:
            print(f"  [{r.mode}] {r.question[:55]}: {r.error}")

    # Latency guidance
    if normal:
        avg_s = sum(r.wall_ms for r in normal) / len(normal) / 1000
        print()
        if avg_s > 10:
            print(f"[!] Avg maker wall-time {avg_s:.1f}s — pipeline may exceed ~20s target.")
        else:
            print(f"[OK] Avg maker wall-time {avg_s:.1f}s — within target.")
    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def _parse() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Phase 4: run 10 questions through the Maker with auto-checks."
    )
    p.add_argument("--model", default=None)
    p.add_argument("--host",  default=None)
    p.add_argument("--mode",  choices=["both", "normal", "chaos"], default="both")
    return p.parse_args()


def main() -> None:
    args = _parse()
    from backend import config as cfg

    model = args.model or cfg.MAKER_MODEL
    host  = args.host  or cfg.OLLAMA_HOST
    modes = ["normal", "chaos"] if args.mode == "both" else [args.mode]

    print("VeriTrust - Phase 4 Maker verification")
    print(f"Model : {model}  |  Host : {host}  |  Modes : {', '.join(modes)}")

    records: list[RunRecord] = []
    total = len(QUESTION_RULES) * len(modes)

    for mode in modes:
        for i, rule in enumerate(QUESTION_RULES):
            idx = (modes.index(mode) * len(QUESTION_RULES)) + i + 1
            print(f"\rRunning {idx}/{total}...", end="", flush=True)
            rec = _run_one(rule, mode, model, host)
            records.append(rec)
            _print_record(rec, idx, total)

    _print_summary(records)
    sys.exit(1 if any(r.error for r in records) else 0)


if __name__ == "__main__":
    main()
