"""
backend/tests/test_pipeline.py
------------------------------
Tests for the LangGraph pipeline (Phase 7).
All tests use injected fakes — no live Ollama required.
"""

from __future__ import annotations

import os
import sqlite3
import tempfile
from typing import Any
from unittest import mock

import pytest

from backend.contracts import (
    ABSTAIN_MESSAGE,
    Claim,
    ClaimSpan,
    Evidence,
    RunResult,
)

# ── Fake fixtures ─────────────────────────────────────────────────────────────

FAKE_EVIDENCE = [
    Evidence(
        source="refund_policy.md",
        version="v1",
        text="Opened electronics can be returned within 15 days.",
        chunk_id="refund_policy.md#2",
    ),
    Evidence(
        source="refund_policy.md",
        version="v1",
        text="Refunds are processed within 5 business days.",
        chunk_id="refund_policy.md#3",
    ),
]


def _fake_retrieve(query, k=None):
    return list(FAKE_EVIDENCE)


def _fake_retrieve_for_draft(draft, initial_evidence, k=None):
    return list(initial_evidence)


def _fake_make_draft_clean(question, context, chaos=False, **kw):
    return (
        "Opened electronics can be returned within 15 days.",
        {"maker": 50, "eval_count": 25, "eval_duration_ms": 100},
    )


def _fake_make_draft_wrong(question, context, chaos=False, **kw):
    return (
        "Opened electronics can be returned within 30 days.",
        {"maker": 50, "eval_count": 25, "eval_duration_ms": 100},
    )


def _fake_correct_draft_fixes(question, draft, failing_claims, evidence, **kw):
    return (
        "Opened electronics can be returned within 15 days.",
        {"maker": 30, "eval_count": 15, "eval_duration_ms": 50},
    )


def _fake_correct_draft_still_wrong(question, draft, failing_claims, evidence, **kw):
    return (
        "Opened electronics can be returned within 30 days.",
        {"maker": 30, "eval_count": 15, "eval_duration_ms": 50},
    )


def _fake_judge_supported(claim, evidence, question):
    return (
        Claim(
            id=claim.id, text=claim.text, start=claim.start, end=claim.end,
            status="SUPPORTED", checked_by="llm",
            reason="Supported by evidence", evidence=evidence[:1],
        ),
        {"tokens": 20, "latency_ms": 50, "eval_duration_ms": 30, "valid_json_first_try": True},
    )


def _fake_judge_unsupported(claim, evidence, question):
    return (
        Claim(
            id=claim.id, text=claim.text, start=claim.start, end=claim.end,
            status="UNSUPPORTED", checked_by="llm",
            reason="Not found in evidence", evidence=[],
        ),
        {"tokens": 20, "latency_ms": 50, "eval_duration_ms": 30, "valid_json_first_try": True},
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

# Patches target the module attributes that the pipeline node functions call through
_RETRIEVER = "backend.agents.retriever"
_SPLITTER = "backend.agents.splitter"
_CHECKER = "backend.agents.checker"
_JUDGE = "backend.agents.judge"
_MAKER = "backend.agents.maker"


def _run_with_patches(question, chaos, patches):
    """Run the pipeline with mock patches, collecting events."""
    events = []

    def _cb(name, data):
        events.append((name, data))

    import backend.graph.pipeline as mod
    mod._compiled_graph = None

    with mock.patch.object(mod._retriever_mod, "retrieve", patches["retrieve"]), \
         mock.patch.object(mod._retriever_mod, "retrieve_for_draft", patches["retrieve_for_draft"]), \
         mock.patch.object(mod._maker_mod, "make_draft", patches["make_draft"]), \
         mock.patch.object(mod._maker_mod, "correct_draft", patches["correct_draft"]), \
         mock.patch.object(mod._judge_mod, "judge_claim", patches["judge_claim"]):

        result = mod.run_pipeline(question=question, chaos=chaos, callback=_cb)

    mod._compiled_graph = None
    return result, events


CLEAN_PATCHES = {
    "retrieve": _fake_retrieve,
    "retrieve_for_draft": _fake_retrieve_for_draft,
    "make_draft": _fake_make_draft_clean,
    "correct_draft": _fake_correct_draft_fixes,
    "judge_claim": _fake_judge_supported,
}

WRONG_PATCHES = {
    "retrieve": _fake_retrieve,
    "retrieve_for_draft": _fake_retrieve_for_draft,
    "make_draft": _fake_make_draft_wrong,
    "correct_draft": _fake_correct_draft_fixes,
    "judge_claim": _fake_judge_supported,
}


def _check_event_order(events):
    """Validate PRD section 9 event ordering invariants."""
    names = [e[0] for e in events]
    assert names[0] == "run_started", f"First event was {names[0]}"
    assert names[-1] == "run_finished", f"Last event was {names[-1]}"
    assert names.count("run_finished") == 1
    finals = [n for n in names if n == "final"]
    assert len(finals) == 1, f"Expected 1 final event, got {len(finals)}"


# ── Tests ─────────────────────────────────────────────────────────────────────


class TestCleanDelivered:
    """(b) Clean run → DELIVERED, retries 0."""

    def test_delivered(self):
        result, events = _run_with_patches("Can I return opened headphones?", False, CLEAN_PATCHES)
        assert result.final_status == "DELIVERED"
        assert result.retries == 0
        assert result.final_answer == result.draft
        assert result.abstain_reason is None
        RunResult.model_validate(result.model_dump())

    def test_events(self):
        _, events = _run_with_patches("Can I return opened headphones?", False, CLEAN_PATCHES)
        _check_event_order(events)
        names = [e[0] for e in events]
        assert "retrieved" in names
        assert "draft" in names
        assert "claims" in names


class TestCorrectedOnce:
    """(c) One wrong claim then fixed → CORRECTED, retries 1."""

    def test_corrected(self):
        result, events = _run_with_patches("Can I return opened headphones?", True, WRONG_PATCHES)
        assert result.final_status == "CORRECTED"
        assert result.retries == 1
        assert result.final_answer != result.draft
        assert result.abstain_reason is None
        RunResult.model_validate(result.model_dump())

    def test_events(self):
        _, events = _run_with_patches("Can I return opened headphones?", True, WRONG_PATCHES)
        _check_event_order(events)
        names = [e[0] for e in events]
        assert "correcting" in names
        assert "corrected_draft" in names


class TestAlwaysContradicted:
    """(a) Always-CONTRADICTED → ABSTAINED/RETRY_CAP after exactly 2 retries."""

    def test_retry_cap(self):
        patches = {
            "retrieve": _fake_retrieve,
            "retrieve_for_draft": _fake_retrieve_for_draft,
            "make_draft": _fake_make_draft_wrong,
            "correct_draft": _fake_correct_draft_still_wrong,
            "judge_claim": _fake_judge_supported,
        }
        result, events = _run_with_patches("Can I return opened headphones?", True, patches)
        assert result.final_status == "ABSTAINED"
        assert result.abstain_reason == "RETRY_CAP"
        assert result.retries == 2
        assert result.final_answer == ABSTAIN_MESSAGE
        RunResult.model_validate(result.model_dump())

    def test_events(self):
        patches = {
            "retrieve": _fake_retrieve,
            "retrieve_for_draft": _fake_retrieve_for_draft,
            "make_draft": _fake_make_draft_wrong,
            "correct_draft": _fake_correct_draft_still_wrong,
            "judge_claim": _fake_judge_supported,
        }
        _, events = _run_with_patches("Can I return opened headphones?", True, patches)
        _check_event_order(events)


class TestUnsupported:
    """(d) Unsupported-only → ABSTAINED/UNSUPPORTED."""

    def test_unsupported_abstain(self):
        def _fake_make_no_numbers(question, context, chaos=False, **kw):
            return ("We offer free drone delivery worldwide.", {"maker": 40, "eval_count": 20, "eval_duration_ms": 80})

        patches = {
            "retrieve": _fake_retrieve,
            "retrieve_for_draft": _fake_retrieve_for_draft,
            "make_draft": _fake_make_no_numbers,
            "correct_draft": _fake_correct_draft_fixes,
            "judge_claim": _fake_judge_unsupported,
        }
        result, events = _run_with_patches("Do you offer drone delivery?", False, patches)
        assert result.final_status == "ABSTAINED"
        assert result.abstain_reason == "UNSUPPORTED"
        assert result.final_answer == ABSTAIN_MESSAGE
        RunResult.model_validate(result.model_dump())
        _check_event_order(events)

    def test_empty_claims_abstain(self):
        def _fake_make_empty(question, context, chaos=False, **kw):
            return ("   ", {"maker": 10, "eval_count": 0, "eval_duration_ms": 10})

        patches = {
            "retrieve": _fake_retrieve,
            "retrieve_for_draft": _fake_retrieve_for_draft,
            "make_draft": _fake_make_empty,
            "correct_draft": _fake_correct_draft_fixes,
            "judge_claim": _fake_judge_unsupported,
        }
        result, events = _run_with_patches("Empty?", False, patches)
        assert result.final_status == "ABSTAINED"
        assert result.abstain_reason == "UNSUPPORTED"
        assert len(result.claims) == 0
        assert result.final_answer == ABSTAIN_MESSAGE
        RunResult.model_validate(result.model_dump())


class TestOllamaError:
    """(e) Ollama error → error event, final SYSTEM_ERROR, run_finished last."""

    def test_ollama_error(self):
        from backend.agents.maker import MakerError

        def _fake_make_error(question, context, chaos=False, **kw):
            raise MakerError("Connection refused")

        patches = {
            "retrieve": _fake_retrieve,
            "retrieve_for_draft": _fake_retrieve_for_draft,
            "make_draft": _fake_make_error,
            "correct_draft": _fake_correct_draft_fixes,
            "judge_claim": _fake_judge_supported,
        }
        result, events = _run_with_patches("Anything?", False, patches)
        assert result.final_status == "ABSTAINED"
        assert result.abstain_reason == "SYSTEM_ERROR"

        names = [e[0] for e in events]
        assert "error" in names
        _check_event_order(events)
        RunResult.model_validate(result.model_dump())


class TestSQLiteStorage:
    """(g) Each RunResult validates and is stored in SQLite."""

    def test_save_and_query(self):
        fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)

        with mock.patch("backend.config.DB_PATH", db_path):
            from backend.db.store import init_db, save_run

            init_db()

            result, _ = _run_with_patches("Return headphones?", False, CLEAN_PATCHES)
            save_run(result)

            conn = sqlite3.connect(db_path)
            row = conn.execute(
                "SELECT run_id, final_status FROM runs WHERE run_id = ?",
                (result.run_id,),
            ).fetchone()
            assert row is not None
            assert row[0] == result.run_id
            assert row[1] == "DELIVERED"

            claim_count = conn.execute(
                "SELECT count(*) FROM claims WHERE run_id = ?",
                (result.run_id,),
            ).fetchone()[0]
            assert claim_count == len(result.claims)
            conn.close()

        # Windows: ignore file lock cleanup errors
        try:
            os.unlink(db_path)
        except PermissionError:
            pass


class TestLatency:
    def test_latency_is_measured(self):
        import time

        def _slow_fake_retrieve(query, k=None):
            time.sleep(0.01)
            return list(FAKE_EVIDENCE)

        def _slow_fake_maker(question, context, chaos=False, **kw):
            time.sleep(0.01)
            return ("Opened electronics can be returned within 15 days.", {})

        patches = dict(CLEAN_PATCHES)
        patches["retrieve"] = _slow_fake_retrieve
        patches["make_draft"] = _slow_fake_maker

        result, _ = _run_with_patches("test", False, patches)
        assert result.latency_ms["retrieve"] > 0, "Retrieve latency should be > 0"
        assert result.latency_ms["maker"] > 0, "Maker latency should be > 0"

