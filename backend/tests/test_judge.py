import pytest
from unittest.mock import patch, MagicMock
from backend.agents.judge import judge_claim, judge_claims, _CACHE
from backend.contracts import ClaimSpan, Evidence
import json
import ollama

@pytest.fixture(autouse=True)
def clear_cache():
    _CACHE.clear()

def test_judge_valid_json():
    c = ClaimSpan(id=1, text="Opened electronics can be returned within 15 days.", start=0, end=50)
    ev = Evidence(source="test", version="v1", chunk_id="c1", text="Opened electronics can be returned within 15 days.")
    
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "SUPPORTED", "reason": "ok", "evidence_ids": ["c1"]}),
            prompt_eval_count=10, eval_count=5
        )
        
        claim, stats = judge_claim(c, [ev], "question")
        assert claim.status == "SUPPORTED"
        assert claim.checked_by == "llm"
        assert stats["valid_json_first_try"] is True
        assert stats["tokens"] == 15

def test_judge_invalid_json_then_retry():
    c = ClaimSpan(id=1, text="test", start=0, end=4)
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.side_effect = [
            MagicMock(response="not json", prompt_eval_count=1, eval_count=1),
            MagicMock(response=json.dumps({"status": "SUPPORTED", "reason": "ok", "evidence_ids": []}), prompt_eval_count=1, eval_count=1)
        ]
        
        claim, stats = judge_claim(c, [], "q")
        assert stats["valid_json_first_try"] is False
        assert claim.status == "UNSUPPORTED" 

def test_judge_timeout():
    c = ClaimSpan(id=1, text="test", start=0, end=4)
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.side_effect = Exception("timeout")
        
        claim, stats = judge_claim(c, [], "q")
        assert claim.status == "UNSUPPORTED"
        assert "invalid json" in claim.reason.lower() or "timeout" in claim.reason.lower()

def test_judge_downgrade_made_up_chunk_id():
    c = ClaimSpan(id=1, text="test", start=0, end=4)
    ev = Evidence(source="test", version="v1", chunk_id="c1", text="evidence")
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "SUPPORTED", "reason": "ok", "evidence_ids": ["made_up"]})
        )
        claim, stats = judge_claim(c, [ev], "q")
        assert claim.status == "UNSUPPORTED"
        assert "not in evidence" in claim.reason.lower()

def test_judge_downgrade_number_no_match():
    c = ClaimSpan(id=1, text="Costs Rs.100.", start=0, end=13)
    ev = Evidence(source="test", version="v1", chunk_id="c1", text="Costs Rs.200.")
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "SUPPORTED", "reason": "ok", "evidence_ids": ["c1"]})
        )
        claim, stats = judge_claim(c, [ev], "q")
        assert claim.status == "UNSUPPORTED"
        assert "lacks comparable equal value" in claim.reason.lower()

def test_judge_echo_number_not_downgraded():
    c = ClaimSpan(id=1, text="Costs Rs.100.", start=0, end=13)
    ev = Evidence(source="test", version="v1", chunk_id="c1", text="Costs Rs.200.")
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "SUPPORTED", "reason": "ok", "evidence_ids": ["c1"]})
        )
        # Rs. 100 is in the question
        claim, stats = judge_claim(c, [ev], "How about Rs.100?")
        assert claim.status == "SUPPORTED"

def test_judge_cache_hit():
    c = ClaimSpan(id="1", text="cache test", start=0, end=10)
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "CONTRADICTED", "reason": "ok", "evidence_ids": []})
        )
        claim1, stats1 = judge_claim(c, [], "q")
        claim2, stats2 = judge_claim(c, [], "q")
        assert mock_client.generate.call_count == 1
        assert claim1.status == claim2.status == "CONTRADICTED"

def test_judge_empty_reason_fallback():
    c = ClaimSpan(id=3, text="empty reason", start=0, end=12)
    ev = Evidence(source="test", version="v1", chunk_id="c1", text="some text")
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "SUPPORTED", "reason": "", "evidence_ids": ["c1"]})
        )
        claim, stats = judge_claim(c, [ev], "q")
        assert claim.status == "SUPPORTED"
        assert claim.reason == "Claim is supported by evidence."

def test_judge_unsupported_empty_evidence():
    c = ClaimSpan(id=4, text="unsupported", start=0, end=11)
    ev = Evidence(source="test", version="v1", chunk_id="c1", text="some text")
    with patch("ollama.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.generate.return_value = MagicMock(
            response=json.dumps({"status": "UNSUPPORTED", "reason": "not found", "evidence_ids": ["c2"]}) # invalid chunk
        )
        claim, stats = judge_claim(c, [ev], "q")
        assert claim.status == "UNSUPPORTED"
        assert claim.evidence == []
