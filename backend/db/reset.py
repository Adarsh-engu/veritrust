"""
backend/db/reset.py
-------------------
CLI for resetting the database.
Usage: python -m backend.db.reset --runs
"""

import argparse
import sys

from backend.db.store import reset_runs, init_db


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset VeriTrust database tables")
    parser.add_argument("--runs", action="store_true", help="Clear runs and claims tables")
    args = parser.parse_args()

    init_db()

    if args.runs:
        reset_runs()
        print("Cleared runs and claims tables.")
    else:
        print("No action specified. Use --runs to clear run data.")
        sys.exit(1)


if __name__ == "__main__":
    main()
