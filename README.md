# VeriTrust

**Evidence-first AI guardrail for customer service.** VeriTrust intercepts every AI-generated answer, checks each factual claim against your policy documents, corrects contradictions, and abstains when it cannot verify — before the customer sees anything.

```
Customer question
      │
      ▼
  Retrieval  ──→  Maker (LLM)  ──→  Claim Splitter
                                          │
                          ┌───────────────┘
                          ▼
              Deterministic Checker  ──→  LLM Judge
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
           Correct               Abstain / Deliver
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.10 + | [python.org](https://python.org) |
| Node.js | 18 + | [nodejs.org](https://nodejs.org) |
| Ollama | latest | [ollama.com](https://ollama.com) |

### Pull the required models (do this once)

```bash
ollama pull llama3.1:8b        # Maker  (3B fallback: llama3.2:3b)
ollama pull qwen2.5:7b         # Judge  (3B fallback: qwen2.5:3b)
ollama pull nomic-embed-text   # Embeddings (always required)
```

> **Low-RAM machines (< 12 GB free)?** Use the 3B pair — change `MAKER_MODEL` and `JUDGE_MODEL` in `.env` accordingly. Under ~8 tokens/sec, 3B is the better choice.

---

## Installation

### 1. Clone and enter the repo

```bash
git clone https://github.com/shivapriya-sheelam/veritrust.git
cd veritrust
```

### 2. Set up the Python environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env — at minimum set MAKER_MODEL and JUDGE_MODEL to match what you pulled
```

### 4. Index the policy documents (builds ChromaDB)

```bash
python -m backend.db.reset --policies
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running

Open **two terminals**:

**Terminal 1 — Backend**
```bash
# activate venv first
python -m uvicorn backend.api.main:app --port 8000 --env-file .env
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Try these questions

### 1. Chaos mode — contradiction caught and corrected
Toggle **"Simulated failure"** ON in the header, then ask:

> *"Can I return opened headphones after 20 days?"*

**Expected:** The Maker states a wrong number (e.g. 30 days). The system detects the contradiction, corrects to **15 days**, and delivers a **CORRECTED** answer with tracked changes visible in the document.

---

### 2. Unanswerable — safe abstain
Turn Chaos OFF, then ask:

> *"Do you offer drone delivery?"*

**Expected:** No policy covers drone delivery, so the system **abstains** — the draft is struck through and the safe refusal message is shown. Status: `ABSTAINED (UNSUPPORTED)`.

---

### 3. False premise — wrong number corrected
Turn Chaos OFF, then ask:

> *"Is the restocking fee for opened electronics ₹500?"*

**Expected:** The policy states **₹250**. The system flags the claim as CONTRADICTED, corrects it to ₹250, and delivers `CORRECTED`.

---

## Benchmark (40 cases)

Go to **Ledger → "Run the gauntlet"** to stream all 40 benchmark cases and see detection rate, false-approval rate, and VeriTrust accuracy vs baseline.

Or run from the CLI:

```bash
python -m eval.run_benchmark --limit 8
```

---

## Project structure

```
veritrust/
├── backend/
│   ├── agents/          # Maker, splitter, deterministic checker, LLM judge
│   ├── api/             # FastAPI app + SSE endpoint
│   ├── db/              # SQLite store + policy indexer
│   ├── graph/           # LangGraph pipeline
│   ├── retrieval/       # ChromaDB retriever
│   └── tests/           # pytest suite (87 tests)
├── data/
│   ├── policies/        # Source policy markdown files
│   └── benchmark.json   # 40-case benchmark
├── eval/                # Benchmark runner + validator
├── frontend/            # Next.js 14 App Router (TypeScript + Tailwind)
└── .env.example         # All config variables with defaults
```

---

## Configuration

All settings live in `.env` (copy from `.env.example`). No API keys required — everything runs locally via Ollama.

| Variable | Default | Description |
|---|---|---|
| `MAKER_MODEL` | `llama3.1:8b` | Model that drafts answers |
| `JUDGE_MODEL` | `qwen2.5:7b` | Model that judges claims |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model for retrieval |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `RETRIEVAL_K` | `6` | Number of chunks retrieved per query |
| `MAX_CORRECTIONS` | `2` | Max correction retries before abstain |
| `CHROMA_DIR` | `./.chroma` | ChromaDB storage path |
| `DB_PATH` | `./veritrust.db` | SQLite database path |

---

## Resetting to seed data

Before a demo or fresh benchmark run:

```bash
python -m backend.db.reset --policies
```

This restores all policy files to their original versions and clears the ChromaDB index.

---

## Running tests

```bash
python -m pytest backend/tests/ -q
```

87 tests, no external calls required (mock Ollama/ChromaDB fixtures included).
