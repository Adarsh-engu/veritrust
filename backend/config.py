"""
backend/config.py
-----------------
Single source of truth for all runtime settings.
Read from environment variables; defaults match .env.example.
Import this module — never read os.environ directly in logic code.
"""

import os


def _bool(val: str | None, default: bool) -> bool:
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes")


def _int(val: str | None, default: int) -> int:
    if val is None:
        return default
    return int(val.strip())


def _float(val: str | None, default: float) -> float:
    if val is None:
        return default
    return float(val.strip())


# ── Models ────────────────────────────────────────────────────────────────────
MAKER_MODEL: str = os.environ.get("MAKER_MODEL", "llama3.1:8b")
JUDGE_MODEL: str = os.environ.get("JUDGE_MODEL", "qwen2.5:7b")
EMBED_MODEL: str = os.environ.get("EMBED_MODEL", "nomic-embed-text")

# ── Ollama connection ─────────────────────────────────────────────────────────
OLLAMA_HOST: str = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_TIMEOUT_S: int = _int(os.environ.get("OLLAMA_TIMEOUT_S"), 60)
OLLAMA_KEEP_ALIVE: str = os.environ.get("OLLAMA_KEEP_ALIVE", "30m")

# ── Storage ───────────────────────────────────────────────────────────────────
CHROMA_DIR: str = os.environ.get("CHROMA_DIR", "./.chroma")
DB_PATH: str = os.environ.get("DB_PATH", "./veritrust.db")
POLICIES_DIR: str = os.environ.get("POLICIES_DIR", "./data/policies")

# ── Retrieval ─────────────────────────────────────────────────────────────────
RETRIEVAL_K: int = _int(os.environ.get("RETRIEVAL_K"), 4)
DRAFT_RETRIEVAL: bool = _bool(os.environ.get("DRAFT_RETRIEVAL"), True)

# ── Pipeline ──────────────────────────────────────────────────────────────────
MAX_CORRECTIONS: int = _int(os.environ.get("MAX_CORRECTIONS"), 2)
JUDGE_CONCURRENCY: int = _int(os.environ.get("JUDGE_CONCURRENCY"), 2)
DET_SUPPORT_OVERLAP: float = _float(os.environ.get("DET_SUPPORT_OVERLAP"), 0.6)

# ── API ───────────────────────────────────────────────────────────────────────
API_PORT: int = _int(os.environ.get("API_PORT"), 8000)
CORS_ORIGINS: str = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
