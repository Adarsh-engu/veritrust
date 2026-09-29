import pytest
from backend.contracts import Evidence
from backend.graph.state import GraphState
from backend.graph.nodes import retrieve_node
from backend.retrieval.retriever import retrieve


def test_retrieve_node_updates_state():
    """retrieve_node receives question from state and returns dict with evidence list"""
    question = "How long do I have to return a product?"
    state: GraphState = {"question": question}

    state_update = retrieve_node(state)

    assert "evidence" in state_update
    evidence = state_update["evidence"]
    assert len(evidence) == 4
    assert all(isinstance(e, Evidence) for e in evidence)


def test_retrieve_node_preserves_order_and_content():
    """retrieve_node output exactly matches direct retrieve() call order and content"""
    question = "Can I cancel my order after it has shipped?"
    state: GraphState = {"question": question}

    expected_evidence = retrieve(question, k=4)
    state_update = retrieve_node(state)

    actual_evidence = state_update["evidence"]
    assert len(actual_evidence) == len(expected_evidence)

    for actual, expected in zip(actual_evidence, expected_evidence):
        assert actual.chunk_id == expected.chunk_id
        assert actual.source == expected.source
        assert actual.version == expected.version
        assert actual.text == expected.text


def test_retrieve_node_empty_question():
    """retrieve_node handles empty or missing question gracefully returning empty evidence list"""
    state_empty: GraphState = {"question": ""}
    update_empty = retrieve_node(state_empty)
    assert update_empty == {"evidence": []}

    state_missing: GraphState = {}
    update_missing = retrieve_node(state_missing)
    assert update_missing == {"evidence": []}
