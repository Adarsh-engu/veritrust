"""
State definitions for the VeriTrust LangGraph pipeline.
Conforms to frozen contracts in backend/contracts.py.
"""

from typing import TypedDict
from backend.contracts import Evidence


class GraphState(TypedDict, total=False):
    """
    Pipeline state passed between nodes in the LangGraph workflow.
    Fields mirror contracts in backend/contracts.py.
    """
    question: str
    evidence: list[Evidence]
