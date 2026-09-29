import pytest
from backend.contracts import Evidence
from backend.graph.pipeline import pipeline, build_pipeline


def test_compiled_graph_invocation():
    """Invokes compiled LangGraph pipeline and verifies completion and returned state"""
    question = "How long do I have to return a product?"
    
    # 1. Graph completes successfully
    result = pipeline.invoke({"question": question})
    assert result is not None

    # 2. Returned state contains original question
    assert "question" in result
    assert result["question"] == question

    # 3. Evidence exists
    assert "evidence" in result
    evidence = result["evidence"]
    assert len(evidence) == 4

    # 4. Evidence contains Evidence objects
    assert all(isinstance(e, Evidence) for e in evidence)

    # 5. At least one relevant refund_policy.md chunk is returned
    refund_chunks = [e for e in evidence if e.source == "refund_policy.md"]
    assert len(refund_chunks) > 0
    assert any("refund" in e.text.lower() or "return" in e.text.lower() for e in refund_chunks)


def test_build_pipeline_factory():
    """Verifies that build_pipeline returns a fresh, working compiled graph"""
    fresh_pipeline = build_pipeline()
    result = fresh_pipeline.invoke({"question": "How long does standard shipping take?"})
    assert result["question"] == "How long does standard shipping take?"
    assert len(result["evidence"]) == 4
    assert any(e.source == "shipping_policy.md" for e in result["evidence"])
