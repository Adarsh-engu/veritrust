import os
import json
import pytest
from pydantic import ValidationError

from backend.contracts import (
    RunResult, Claim, ClaimSpan, Evidence,
    RunStartedEvent, RetrievedEvent, DraftEvent, ClaimsEvent,
    ClaimCheckedEvent, CorrectingEvent, CorrectedDraftEvent,
    FinalEvent, RunFinishedEvent, ErrorEvent, format_sse_event,
    ABSTAIN_MESSAGE
)

def test_events_json_validates():
    """every event in events.json validates against its model"""
    mocks_path = os.path.join(os.path.dirname(__file__), "../../frontend/mocks/events.json")
    with open(mocks_path, "r") as f:
        data = json.load(f)
    
    scenarios = data.get("scenarios", {})
    assert "corrected" in scenarios, "Expected 'corrected' scenario in events.json"
    
    event_models = {
        "run_started": RunStartedEvent,
        "retrieved": RetrievedEvent,
        "draft": DraftEvent,
        "claims": ClaimsEvent,
        "claim_checked": ClaimCheckedEvent,
        "correcting": CorrectingEvent,
        "corrected_draft": CorrectedDraftEvent,
        "final": FinalEvent,
        "run_finished": RunFinishedEvent,
        "error": ErrorEvent
    }
    
    for scenario_name, events in scenarios.items():
        for item in events:
            event_name = item["event"]
            event_data = item["data"]
            model = event_models[event_name]
            instance = model(**event_data)
            assert instance is not None
            
            # Additional test: run_started requires run_id
            if event_name == "run_started":
                assert hasattr(instance, "run_id") and instance.run_id is not None

def test_events_json_scenario_structure():
    """the corrected scenario has claims and claim_checked with attempt 1 before final; every scenario ends with exactly one final and run_finished last"""
    mocks_path = os.path.join(os.path.dirname(__file__), "../../frontend/mocks/events.json")
    with open(mocks_path, "r") as f:
        data = json.load(f)
        
    for scenario_name, events in data["scenarios"].items():
        event_names = [e["event"] for e in events]
        assert event_names[-2] == "final"
        assert event_names[-1] == "run_finished"
        assert event_names.count("final") == 1
        
        if scenario_name == "corrected":
            # Find index of final
            final_idx = event_names.index("final")
            
            # Check for claims and claim_checked with attempt 1 before final
            found_claims_attempt_1 = False
            found_claim_checked_attempt_1 = False
            
            for e in events[:final_idx]:
                if e["event"] == "claims" and e["data"]["attempt"] == 1:
                    found_claims_attempt_1 = True
                if e["event"] == "claim_checked" and e["data"]["attempt"] == 1:
                    found_claim_checked_attempt_1 = True
                    
            assert found_claims_attempt_1
            assert found_claim_checked_attempt_1

def test_claim_text_matches_draft_span():
    """Claim.text == draft[start:end] for every claim in the RunResult"""
    mocks_path = os.path.join(os.path.dirname(__file__), "../../frontend/mocks/events.json")
    with open(mocks_path, "r") as f:
        data = json.load(f)
        
    for scenario_name, events in data["scenarios"].items():
        for item in events:
            if item["event"] == "run_finished":
                run_result_data = item["data"]["result"]
                run_result = RunResult(**run_result_data)
                
                for claim in run_result.claims:
                    assert claim.text == run_result.draft[claim.start:claim.end]
                    
                for claim in run_result.final_claims:
                    assert claim.text == run_result.final_draft[claim.start:claim.end]

def test_bad_span_is_rejected():
    """a deliberately bad span is rejected"""
    draft = "This is a test draft."
    claims = [
        Claim(
            id=0,
            text="This is a test",
            start=0,
            end=10, # Deliberately wrong end index (should be 14)
            status="SUPPORTED",
            checked_by="deterministic",
            reason="Good",
            evidence=[]
        )
    ]
    
    with pytest.raises(ValidationError, match="span mismatch"):
        RunResult(
            run_id="test",
            question="q",
            chaos=False,
            draft=draft,
            claims=claims,
            final_draft=draft,
            final_claims=claims,
            final_answer=draft,
            final_status="DELIVERED",
            abstain_reason=None,
            retries=0,
            latency_ms={"retrieve": 0, "maker": 0, "check": 0, "judge": 0, "correct": 0, "total": 0},
            tokens={"maker": 0, "judge": 0},
            policy_versions={},
            created_at="now"
        )

def test_invalid_status_value_is_rejected():
    """an invalid status value is rejected"""
    with pytest.raises(ValidationError):
        Claim(
            id=0,
            text="text",
            start=0,
            end=4,
            status="SUPER_SUPPORTED", # Invalid status
            checked_by="deterministic",
            reason="Good",
            evidence=[]
        )
