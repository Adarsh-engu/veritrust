"""
Retrieval module for VeriTrust guardrail.
Provides primary question retrieval and secondary draft-based retrieval
with deduplication and capping per PRD specifications.
"""

import os
from backend.contracts import Evidence
from backend.retrieval.vector_store import query_collection

DEFAULT_K = int(os.getenv("RETRIEVAL_K", "4"))
MAX_DRAFT_EVIDENCE = 6


def retrieve(query: str, k: int = DEFAULT_K) -> list[Evidence]:
    """
    Retrieves top-k Evidence chunks from ChromaDB for the given query text.

    Args:
        query: User question or search query string.
        k: Number of chunks to retrieve (default: 4, from RETRIEVAL_K).

    Returns:
        list[Evidence]: Top-k retrieved Evidence objects.
    """
    if not query or not query.strip():
        return []

    return query_collection(query_text=query.strip(), n_results=k)


def retrieve_for_draft(
    draft: str,
    initial_evidence: list[Evidence],
    k: int = DEFAULT_K,
) -> list[Evidence]:
    """
    Performs secondary retrieval using the draft text to catch Maker claims
    not covered by the initial question retrieval.

    Merges draft chunks with initial_evidence:
    - Initial question chunks are preserved first.
    - Chunks are deduplicated by chunk_id.
    - Total result is capped at 6 chunks (PRD §7.3).
    - The input initial_evidence list is never mutated.

    Args:
        draft: Generated draft answer text from Maker agent.
        initial_evidence: Evidence list obtained during question retrieval.
        k: Number of additional chunks to query for the draft (default: 4).

    Returns:
        list[Evidence]: Deduplicated, merged Evidence chunks capped at 6.
    """
    merged: list[Evidence] = []
    seen_chunk_ids: set[str] = set()

    # 1. Preserve initial question evidence first
    for ev in initial_evidence:
        if ev.chunk_id not in seen_chunk_ids:
            seen_chunk_ids.add(ev.chunk_id)
            merged.append(ev)

    # 2. Query vector store using the draft if non-empty
    if draft and draft.strip():
        draft_results = query_collection(query_text=draft.strip(), n_results=k)
        for ev in draft_results:
            if ev.chunk_id not in seen_chunk_ids:
                seen_chunk_ids.add(ev.chunk_id)
                merged.append(ev)

    # 3. Cap at maximum 6 chunks per PRD §7.3
    return merged[:MAX_DRAFT_EVIDENCE]
