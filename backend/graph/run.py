"""
backend/graph/run.py
--------------------
CLI to run the VeriTrust pipeline for one question.

Usage: python -m backend.graph.run "Can I return my opened headphones after 20 days?" --chaos
"""

from __future__ import annotations

import argparse
import json
import sys

from pydantic import BaseModel

from backend.db.store import init_db, save_run
from backend.graph.pipeline import run_pipeline


def _print_event(event_name: str, data: BaseModel) -> None:
    """Print each SSE event as it arrives."""
    print(f"event: {event_name}")
    print(f"data: {data.model_dump_json()}")
    print()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Run VeriTrust pipeline for one question")
    parser.add_argument("question", type=str, help="Customer question")
    parser.add_argument("--chaos", action="store_true", help="Enable chaos mode")
    args = parser.parse_args()

    init_db()

    result = run_pipeline(
        question=args.question,
        chaos=args.chaos,
        callback=_print_event,
    )

    # Save to SQLite
    save_run(result, source="live")

    # Print summary
    print("=" * 60)
    print(f"Run ID:       {result.run_id}")
    print(f"Status:       {result.final_status}")
    print(f"Retries:      {result.retries}")
    print(f"Final Answer: {result.final_answer}")
    print(f"Latency (ms):")
    for k, v in result.latency_ms.items():
        print(f"  {k:>10}: {v}")
    print(f"Tokens:")
    for k, v in result.tokens.items():
        print(f"  {k:>10}: {v}")
    print(f"Policy Versions: {json.dumps(result.policy_versions)}")
    print(f"Created At:  {result.created_at}")
    import os
    from backend.config import DB_PATH
    print(f"DB File:      {os.path.abspath(DB_PATH)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
