import pytest
from unittest.mock import patch
from backend.contracts import Evidence
from backend.retrieval.retriever import retrieve, retrieve_for_draft
from backend.retrieval.vector_store import reindex_policy, get_policy_collection


def test_retrieve_refund_policy():
    """retrieve('How long do I have to return a product?', k=4) returns 4 Evidence objects from refund_policy.md"""
    results = retrieve("How long do I have to return a product?", k=4)
    assert len(results) == 4
    assert any(r.source == "refund_policy.md" for r in results)
    for r in results:
        assert isinstance(r, Evidence)
        assert r.source and r.version and r.text and r.chunk_id


def test_retrieve_shipping_policy():
    """retrieve('How long does standard shipping take?', k=4) returns 4 Evidence objects from shipping_policy.md"""
    results = retrieve("How long does standard shipping take?", k=4)
    assert len(results) == 4
    assert any(r.source == "shipping_policy.md" for r in results)
    for r in results:
        assert isinstance(r, Evidence)
        assert r.source and r.version and r.text and r.chunk_id


def test_retrieve_warranty_policy():
    """retrieve('What is the warranty period for laptops?', k=4) returns 4 Evidence objects from warranty_policy.md"""
    results = retrieve("What is the warranty period for laptops?", k=4)
    assert len(results) == 4
    assert any(r.source == "warranty_policy.md" for r in results)
    for r in results:
        assert isinstance(r, Evidence)
        assert r.source and r.version and r.text and r.chunk_id


def test_retrieve_payments_policy():
    """retrieve('What payment methods do you accept?', k=4) returns 4 Evidence objects from payments_policy.md"""
    results = retrieve("What payment methods do you accept?", k=4)
    assert len(results) == 4
    assert any(r.source == "payments_policy.md" for r in results)
    for r in results:
        assert isinstance(r, Evidence)
        assert r.source and r.version and r.text and r.chunk_id


def test_retrieve_for_draft():
    """retrieve_for_draft preserves initial evidence, deduplicates, caps at 6, and does not mutate input"""
    initial = retrieve("How long do I have to return a product?", k=4)
    assert len(initial) == 4
    initial_ids = [e.chunk_id for e in initial]

    draft = "Customers have 30 days to return opened electronics."
    merged = retrieve_for_draft(draft, initial, k=4)

    # Initial evidence is preserved first
    assert len(merged) >= len(initial)
    assert [e.chunk_id for e in merged[:len(initial)]] == initial_ids

    # Duplicate chunk IDs are removed
    merged_ids = [e.chunk_id for e in merged]
    assert len(merged_ids) == len(set(merged_ids))

    # Returns no more than 6 chunks
    assert len(merged) <= 6

    # Initial evidence list is not mutated
    assert [e.chunk_id for e in initial] == initial_ids
    assert len(initial) == 4


def test_evidence_fields_integrity():
    """Every returned object is an Evidence instance with non-empty source, version, text, and chunk_id"""
    queries = [
        "How long do I have to return a product?",
        "How long does standard shipping take?",
        "What is the warranty period for laptops?",
        "What payment methods do you accept?",
    ]
    for q in queries:
        results = retrieve(q, k=4)
        assert len(results) == 4
        for r in results:
            assert isinstance(r, Evidence)
            assert isinstance(r.source, str) and len(r.source.strip()) > 0
            assert isinstance(r.version, str) and len(r.version.strip()) > 0
            assert isinstance(r.text, str) and len(r.text.strip()) > 0
            assert isinstance(r.chunk_id, str) and "#" in r.chunk_id


def test_retrieve_for_draft_disabled():
    """When DRAFT_RETRIEVAL=False, retrieve_for_draft returns only question chunks without querying ChromaDB."""
    initial = retrieve("How long do I have to return a product?", k=4)
    assert len(initial) == 4
    initial_ids = [e.chunk_id for e in initial]

    draft = "Customers have 30 days to return opened electronics."

    import backend.config as config
    with patch.object(config, "DRAFT_RETRIEVAL", False):
        result = retrieve_for_draft(draft, initial, k=4)

    # Must return exactly the initial evidence in the same order, no extras.
    result_ids = [e.chunk_id for e in result]
    assert result_ids == initial_ids, (
        f"Expected initial chunk IDs only: {initial_ids}, got: {result_ids}"
    )
    # No mutation
    assert [e.chunk_id for e in initial] == initial_ids


def test_reindex_policy():
    """reindex_policy deletes existing chunks and re-upserts from disk; chunk count matches bullet count."""
    collection = get_policy_collection()

    # First index must have produced some warranty chunks.
    before = collection.get(where={"source": "warranty_policy.md"}, include=[])
    assert len(before["ids"]) > 0, "warranty_policy.md must be indexed before this test"

    # Re-index and verify the returned count matches ChromaDB state afterwards.
    chunk_count = reindex_policy("warranty_policy.md", collection=collection)
    assert chunk_count > 0

    after = collection.get(where={"source": "warranty_policy.md"}, include=[])
    assert len(after["ids"]) == chunk_count, (
        f"ChromaDB has {len(after['ids'])} chunks but reindex_policy returned {chunk_count}"
    )

    # All returned ids must start with "warranty_policy.md#"
    for chunk_id in after["ids"]:
        assert chunk_id.startswith("warranty_policy.md#"), (
            f"Unexpected chunk_id after reindex: {chunk_id}"
        )

    # Without .md suffix — must work the same way.
    chunk_count2 = reindex_policy("warranty_policy", collection=collection)
    assert chunk_count2 == chunk_count
