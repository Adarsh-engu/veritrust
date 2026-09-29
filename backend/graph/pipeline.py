"""
LangGraph pipeline definition for VeriTrust guardrail.
Connects retrieve_node in a minimal StateGraph: START -> retrieve -> END.
"""

from typing import Any
from langgraph.graph import StateGraph, START, END

from backend.graph.state import GraphState
from backend.graph.nodes import retrieve_node


def build_pipeline() -> Any:
    """
    Builds and compiles the minimal LangGraph workflow for question retrieval.
    Graph flow: START -> retrieve -> END.
    """
    workflow = StateGraph(GraphState)

    # Add single retrieve node
    workflow.add_node("retrieve", retrieve_node)

    # Define edges: START -> retrieve -> END
    workflow.add_edge(START, "retrieve")
    workflow.add_edge("retrieve", END)

    return workflow.compile()


# Expose compiled graph instance
pipeline = build_pipeline()
