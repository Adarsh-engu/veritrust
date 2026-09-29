"""
LangGraph nodes for the VeriTrust guardrail pipeline.
Implements the initial question-retrieval node.
"""

from backend.contracts import Evidence
from backend.graph.state import GraphState
from backend.retrieval.retriever import retrieve


def retrieve_node(state: GraphState) -> dict[str, list[Evidence]]:
    """
    Initial question-retrieval node for the LangGraph workflow.

    Receives the user's question from state, calls retrieve(question, k=4),
    and returns a state update containing the retrieved Evidence list.
    Preserves the exact order and content returned by retrieve().

    Args:
        state: Current GraphState containing 'question'.

    Returns:
        dict[str, list[Evidence]]: Updated state field {'evidence': list[Evidence]}.
    """
    question = state.get("question", "")
    evidence = retrieve(query=question, k=4)
    return {"evidence": evidence}
