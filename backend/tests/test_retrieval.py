import pytest
from backend.contracts import Evidence
from backend.retrieval.retriever import retrieve, retrieve_for_draft


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
