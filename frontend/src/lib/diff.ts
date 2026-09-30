// Word-level and semantic diff utility using diff-match-patch for Tracked Changes
import DiffMatchPatch from "diff-match-patch";

export type DiffType = "equal" | "delete" | "insert";

export interface DiffSegment {
  type: DiffType;
  text: string;
}

export function computeTrackedDiff(oldText: string, newText: string): DiffSegment[] {
  if (!oldText && !newText) return [];
  if (!oldText) return [{ type: "insert", text: newText }];
  if (!newText) return [{ type: "delete", text: oldText }];
  if (oldText === newText) return [{ type: "equal", text: oldText }];

  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, text]) => {
    let type: DiffType = "equal";
    if (op === -1) type = "delete";
    else if (op === 1) type = "insert";
    return { type, text };
  });
}
