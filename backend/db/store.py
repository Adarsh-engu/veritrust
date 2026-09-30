"""
backend/db/store.py
-------------------
SQLite storage for VeriTrust runs and claims.
PRD section 11: WAL mode, 5 tables (only runs + claims written in Phase 7).
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from backend import config
from backend.contracts import RunResult


def _get_conn() -> sqlite3.Connection:
    """Open a WAL-mode connection to the DB."""
    db_path = config.DB_PATH
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """Create all 5 tables if they don't exist (PRD section 11)."""
    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS runs (
                run_id TEXT PRIMARY KEY,
                result_json TEXT NOT NULL,
                final_status TEXT NOT NULL,
                chaos INTEGER NOT NULL DEFAULT 0,
                source TEXT NOT NULL DEFAULT 'live',
                created_at TEXT NOT NULL,
                total_ms INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                claim_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                checked_by TEXT NOT NULL,
                text TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            );

            CREATE TABLE IF NOT EXISTS policy_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                text TEXT NOT NULL,
                effective_date TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS benchmark_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                modes TEXT NOT NULL,
                summary_json TEXT
            );

            CREATE TABLE IF NOT EXISTS benchmark_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                benchmark_run_id INTEGER NOT NULL,
                case_id TEXT NOT NULL,
                mode TEXT NOT NULL,
                run_id TEXT,
                draft_good INTEGER,
                final_good INTEGER,
                outcome TEXT,
                FOREIGN KEY (benchmark_run_id) REFERENCES benchmark_runs(id)
            );
        """)
        conn.commit()
    finally:
        conn.close()


def save_run(result: RunResult, source: str = "live") -> None:
    """Write a RunResult to the runs and claims tables."""
    init_db()
    conn = _get_conn()
    try:
        conn.execute(
            """INSERT OR REPLACE INTO runs
               (run_id, result_json, final_status, chaos, source, created_at, total_ms)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                result.run_id,
                result.model_dump_json(),
                result.final_status,
                1 if result.chaos else 0,
                source,
                result.created_at,
                result.latency_ms.get("total", 0),
            ),
        )
        # Write first-draft claims
        for claim in result.claims:
            conn.execute(
                """INSERT INTO claims (run_id, claim_id, status, checked_by, text)
                   VALUES (?, ?, ?, ?, ?)""",
                (result.run_id, claim.id, claim.status, claim.checked_by, claim.text),
            )
        conn.commit()
    finally:
        conn.close()


def reset_runs() -> None:
    """Clear the runs and claims tables."""
    init_db()
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM claims")
        conn.execute("DELETE FROM runs")
        conn.commit()
    finally:
        conn.close()
