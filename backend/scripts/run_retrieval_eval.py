"""
backend/scripts/run_retrieval_eval.py
-------------------------------------
Phase 2 retrieval evaluation script.

Loads questions from eval/retrieval_questions.json and checks that the
PRIMARY retrieval node returns the expected source file AND expected chunk_id
at rank 1 for every question.

Usage (from repo root):
    python -m backend.scripts.run_retrieval_eval

Exit code 0 if >= 9/10 correct, else 1.
"""

import json
import sys
from pathlib import Path

from backend.retrieval.retriever import retrieve


def load_questions(json_path: Path) -> list[dict]:
    """Loads the eval question list from eval/retrieval_questions.json."""
    with json_path.open(encoding="utf-8-sig") as fh:
        data = json.load(fh)
    return data["questions"]


def run_eval() -> None:
    """Runs rank-1 retrieval evaluation and prints PASS/FAIL per question."""
    repo_root = Path(__file__).resolve().parents[2]
    questions_path = repo_root / "eval" / "retrieval_questions.json"

    if not questions_path.exists():
        print(f"ERROR: eval file not found: {questions_path}", file=sys.stderr)
        sys.exit(1)

    questions = load_questions(questions_path)
    total = len(questions)
    correct = 0

    print(f"Phase 2 Retrieval Evaluation — {total} questions\n")
    print(f"{'ID':<5} {'CAT':<12} {'RESULT':<6}  rank-1 source / chunk_id")
    print("-" * 72)

    for q in questions:
        qid = q["id"]
        category = q["category"]
        question = q["question"]
        exp_source = q["expected_source"]
        exp_chunk = q["expected_chunk_id"]

        results = retrieve(question, k=4)

        if not results:
            print(f"{qid:<5} {category:<12} {'FAIL':<6}  (no results)")
            print(f"       question : {question}")
            print(f"       expected : {exp_source}  {exp_chunk}")
            continue

        rank1 = results[0]
        got_source = rank1.source
        got_chunk = rank1.chunk_id

        # Both source and chunk_id must match rank 1.
        passed = (got_source == exp_source) and (got_chunk == exp_chunk)

        if passed:
            correct += 1
            verdict = "PASS"
        else:
            verdict = "FAIL"

        print(f"{qid:<5} {category:<12} {verdict:<6}  {got_source}  {got_chunk}")
        if not passed:
            print(f"       question : {question}")
            print(f"       expected : {exp_source}  {exp_chunk}")

    print("-" * 72)
    print(f"\nResult: {correct}/{total} correct rank-1 retrievals.")

    if correct >= 9:
        print("PASS  (>= 9/10 target achieved)")
        sys.exit(0)
    else:
        print("FAIL  (target is 9/10)")
        sys.exit(1)


if __name__ == "__main__":
    run_eval()
