# VeriTrust AI — Team Guide (read this first)

Files to read, in order: this guide → `PRD.md` (the spec) → `AGENT_RULES.md` (rules for the coding agent, goes in `.agent/rules/veritrust.md`).

## 1. What we are building (30 seconds)

A customer-support AI guardrail for a fictional company, VeriCorp. A **Maker** drafts an answer from company policies. A **Judge** checks every claim against those policies (numbers checked in code first, LLM only for the rest). Wrong claims are struck through and corrected. If there is no evidence, we refuse to answer. The UI works like "Track Changes" in a document, not a dashboard.

Constraints: **Ollama local models only, no paid APIs.** Vibe coding with the Antigravity agent. About 40 hours total.

## 2. Roles

| Role | Owner | Phases | Owns |
|---|---|---|---|
| Agent (A) | ______ | 4, 5, 6, 12 | `backend/agents/`: Maker, claim splitting, deterministic checker, LLM judge, correction, prompt tuning |
| Chaining (C) | ______ | 1, 7, 9 | `backend/contracts.py`, `backend/graph/`, `backend/api/`, `backend/db/`, SSE |
| Frontend (F) | ______ | 3, 8, 11 | everything in `frontend/` |
| Data (D) | ______ | 2, 10 | `data/`, `backend/retrieval/`, `eval/`; also records the fallback video and demo script in phase 12 |

Rule: only edit your own area. If you need a change in someone else's area, message them.

## 3. Phase map

| # | Phase | Owner | Depends on |
|---|---|---|---|
| 1 | Repo, contracts, mock events | C | none (do first, everyone waits ~1 h) |
| 2 | Policies and retrieval | D | 1 |
| 3 | Frontend scaffold and customer chat (mock data) | F | 1 |
| 4 | Maker agent, model choice, Chaos mode | A | 1 |
| 5 | Claim splitting and deterministic checker | A | 2 (for evidence format) |
| 6 | LLM judge and correction | A | 5 |
| 7 | LangGraph pipeline and SQLite logging | C | 2, 4, 5, 6 |
| 8 | Review screen with tracked changes (mock data) | F | 3 |
| 9 | FastAPI, SSE, ledger and policy endpoints | C | 7 |
| 10 | Benchmark (40 cases) and runner | D | 7 |
| 11 | Ledger, policies screen, gauntlet, switch to live API | F | 8, 9 |
| 12 | Tuning, regression, fallback video | A, everyone | all |

Parallel waves: (1) → (2, 3, 4) → (5, 8) → (6, 7) → (9, 10) → (11) → (12).

## 4. Setup (everyone, first 20 minutes)

```
ollama pull llama3.1:8b
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
# weak laptop (<16 GB RAM or no GPU): use llama3.2:3b and qwen2.5:3b instead
ollama run llama3.1:8b "In one sentence, what is a refund policy?" --verbose
```

Note your `eval rate` (tokens/sec). Under about 8 tokens/sec → use 3B models. Post the number in the team chat. The demo runs on the fastest machine.

Repo layout:
```
veritrust/
  PRD.md
  .agent/rules/veritrust.md      (AGENT_RULES.md)
  .env.example
  backend/{agents,graph,api,db,retrieval}/  + contracts.py
  data/policies/  data/benchmark.json
  eval/
  frontend/
```

## 5. Working rules

1. **Contracts are frozen after Phase 1.** Any change goes into `PRD.md` first, announced in the team chat, then code on both sides.
2. **One phase, one commit series.** Commit only after the phase is verified. Message: `phase-N: short description`.
3. **Branches:** one branch per role (`agent`, `chain`, `frontend`, `data`). Merge to `main` at each checkpoint. Pull before you push.
4. **Never commit** `.env`, model files or the vector store.
5. **Verify, don't trust.** The agent must report `DONE / FILES / EVIDENCE / KNOWN ISSUES / NOT DONE`. You personally run the code and read the output. Agents have claimed things worked when they didn't. Check numbers against a real SQLite query.
6. **Start a fresh agent session per phase**, and begin every prompt with: "Read PRD.md and the rules file first."
7. **Say so early** if you are blocked or behind. A 10-minute message beats a 3-hour surprise.

## 6. Checkpoints

| When | What must be true |
|---|---|
| Hour ~2 | Contracts merged, policies written, models running and speed measured, frontend scaffold up |
| Hour ~8 | Maker, checker and judge callable from scripts; retrieval verified; Review screen renders mock events |
| Hour ~12 | Full pipeline runs end to end from CLI; API streaming real events |
| Hour ~16 | Benchmark runs and gives real numbers; frontend on the live API |
| Final block | 5 clean end-to-end runs, fallback video recorded, demo script rehearsed |

## 7. Role sheets and starter prompts

Paste these to the agent (adjust as needed). Each one assumes you start with: *"Read PRD.md and .agent/rules/veritrust.md fully."*

### Chaining (C)

**Phase 1:** "Task: Phase 1 only. Create backend/contracts.py with the Pydantic v2 models from PRD sections 8 and 9 exactly. Create .env.example from section 15. Create frontend/mocks/events.json with one full realistic SSE event sequence for the headphone example (wrong 30-day claim, contradicted, corrected, CORRECTED final). Add pytest tests validating the mock against the models and checking Claim.text == draft[start:end]. Nothing else."

**Phase 7:** "Task: Phase 7 only. Build the LangGraph pipeline in backend/graph/ per PRD section 7: retrieve → maker → split_claims → deterministic_check → llm_judge → route → correct/abstain/deliver → log. Use the functions from backend/agents/ and backend/retrieval/ as they are. Max 2 correction retries then abstain. Log every run to SQLite (PRD section 11). Add a CLI script `python -m backend.graph.run "question" --chaos`. Add a test with a forced always-contradicted case proving exactly 2 retries then abstain."

**Phase 9:** "Task: Phase 9 only. Build FastAPI endpoints from PRD section 10, streaming SSE events exactly as in section 9. Metrics endpoint computes everything from SQLite. PUT /api/policies/{name} bumps the version, re-indexes ChromaDB and returns stale run ids."

### Agent (A)

**Phase 4:** "Task: Phase 4 only. Implement `make_draft(question, context, chaos)` in backend/agents/maker.py using the Ollama client and env-configured model. chaos=True must instruct the model to confidently state plausible wrong numbers or ignore the context. Add a script that runs 10 questions in normal and chaos modes and prints latency and outputs."

**Phase 5:** "Task: Phase 5 only. Implement sentence-based claim splitting with exact char spans, and a deterministic checker that extracts and normalizes numbers, durations and prices and compares them to evidence text. Return per-claim status and reason. Add at least 10 hand-written test drafts covering right, wrong and unresolved cases."

**Phase 6:** "Task: Phase 6 only. Implement the LLM judge (one claim + evidence per call, JSON format, Pydantic validation, one retry, fallback UNSUPPORTED) and `correct(draft, feedback, evidence)`. Report JSON validity rate over 20 calls."

### Frontend (F)

**Phase 3:** "Task: Phase 3 only. Scaffold Next.js (App Router, TypeScript, Tailwind). Build the customer chat page and one API client module that reads events from frontend/mocks/events.json when NEXT_PUBLIC_USE_MOCKS=true, else from the live SSE endpoint. Style per PRD section 14 (warm off-white, serif answer text, mono evidence). No KPI cards."

**Phase 8:** "Task: Phase 8 only. Build the Review screen: answer as a document with tracked changes (use diff-match-patch for the strikethrough and insert), right-margin comments with evidence and source/version, left vertical live timeline, Customer/Reviewer toggle and Chaos toggle. Use mock events."

**Phase 11:** "Task: Phase 11 only. Build the Ledger (one large summary sentence, one line chart, clickable log list with replay), the Policies screen (textarea editor, stale-run banner) and the 'Run the gauntlet' button streaming benchmark rows. Switch to the live API."

### Data (D)

**Phase 2:** "Task: Phase 2 only. Using the policy markdown files in data/policies/ (I wrote them), implement chunking (one fact or short paragraph per chunk), ChromaDB indexing with nomic-embed-text, and `retrieve(query, k=4)` returning Evidence objects per contracts.py. Add a script that asks 10 questions and prints the top source per question."

**Phase 10:** "Task: Phase 10 only. Build the benchmark runner over data/benchmark.json (40 cases: 10 direct, 8 paraphrased, 6 multi-part, 8 false-premise, 8 unanswerable), run in normal and chaos mode, compute detection rate, false-approval rate, correct-abstention rate and correction success rate per PRD section 12, output results JSON and stream per-case results."

## 8. Data owner's guide: writing the knowledge base and benchmark

Write the policy facts yourself. The agent formats, you decide.

- 5 to 6 files: refund, warranty, shipping, cancellation, payments, support.
- 10 to 15 crisp facts per file. Include numbers, durations and prices ("Refunds within 15 days", "Express shipping costs ₹199", "Laptop warranty is 2 years").
- Front-matter on each file: `name`, `version: v1`, `effective_date`.
- Avoid ambiguity and overlapping facts at first (e.g. don't state two different return windows in one file).
- Benchmark cases: write ground truth from the facts. For false-premise cases, phrase the question with a wrong claim ("Confirm your 90-day refund policy"). For unanswerable, ask about things no policy covers (drone delivery, free installation).
- Store each case as: `id, category, question, ground_truth, expected_behavior (ANSWER|ABSTAIN), expected_facts[]`.

## 9. Demo (3 minutes) and fallback

Script is in PRD section 18. The data owner records a 60 to 90 second **fallback video** of the full flow before the presentation, and the team rehearses at least 3 times with a timer. Do not touch code in the last hour except for bug fixes.

## 10. Definition of done

Use the acceptance checklist in PRD section 16. If a box isn't ticked, it isn't done.
