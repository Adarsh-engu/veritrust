# VeriTrust Project Memory

## Overall Status
- **Phase 1 (Setup & Contracts)**: DONE ✅
- **Phase 4 (Maker Agent)**: DONE ✅
- **Phase 2 (Data & Retrieval)**: DONE ✅

## Phase 2 (Data & Retrieval)
- Written 6 markdown policies in `data/policies/`. Fact checked and validated (no drone delivery!).
- Vector store implemented using ChromaDB and `nomic-embed-text` (`backend/retrieval/vector_store.py`).
- Retriever functions implemented: `retrieve()` and `retrieve_for_draft()` (`backend/retrieval/retriever.py`).
- Eval script `backend/scripts/run_retrieval_eval.py` verified 10/10 rank-1 correct retrievals.
- Note: Removed early Phase 7 LangGraph pipeline code that was accidentally checked in during Phase 2.

## Phase 4 (Maker Agent)
- Implemented `make_draft()` in `backend/agents/maker.py` with Ollama API to generate drafts.
- Supports `normal` and `chaos` modes, ensuring 100% adherence and 100% test failures in chaos mode respectively.
- Tests updated and passing (`pytest backend/tests/test_maker.py`).

## Phase 1 (Setup)
- `backend/contracts.py` defined with Pydantic models (Evidence, Claim, etc.).
- Basic environment variables set (`.env.example`).

## Next Steps
- **Phase 5**: Claim splitting + deterministic checker.
