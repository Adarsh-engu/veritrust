"use client";

import React, { useState } from "react";
import { PolicyDocument } from "@/types/policy";

interface PolicyEditorProps {
  policy: PolicyDocument;
  onSaveDraft: (newContent: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  policy,
  onSaveDraft,
  onCancel,
  isSaving,
}) => {
  const [content, setContent] = useState(policy.markdownContent);

  const lines = content.split("\n");
  const lineCount = lines.length;
  const charCount = content.length;

  // Compute simulated next version: e.g. v1.4 -> v1.5
  const versionParts = policy.version.replace("v", "").split(".");
  const nextMinor = versionParts.length > 1 ? parseInt(versionParts[1], 10) + 1 : 1;
  const nextVersion = `v${versionParts[0]}.${nextMinor}`;

  return (
    <div className="bg-white p-6 rounded-lg border border-outline-dim shadow-xs flex flex-col gap-4">
      {/* Editor Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-surface-dim">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase text-accent-ochre font-semibold">
            Markdown Editor
          </span>
          <span className="text-outline">·</span>
          <span className="font-mono text-[10px] text-outline">
            Auto-Chunking Strategy: RecursiveCharacter (chunk_size: 512, overlap: 64)
          </span>
        </div>

        <div className="font-mono text-[10px] text-outline">
          {charCount.toLocaleString()} characters · {lineCount} lines
        </div>
      </div>

      {/* Code Editor Box with Line Numbers */}
      <div className="w-full flex rounded bg-surface-muted/50 border border-outline-dim overflow-hidden font-mono text-[12px]">
        {/* Line Numbers gutter */}
        <div className="select-none py-3 px-2 bg-surface-muted text-right font-mono text-[11px] text-outline/60 flex flex-col gap-0 leading-6 w-11 border-r border-outline-dim">
          {Array.from({ length: Math.max(lineCount, 15) }, (_, i) => (
            <span key={i}>{String(i + 1).padStart(2, "0")}</span>
          ))}
        </div>

        {/* Textarea editor */}
        <textarea
          rows={Math.max(lineCount, 20)}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="w-full p-3 bg-transparent text-on-surface focus:outline-none resize-none leading-6 font-mono text-[12px]"
        />
      </div>

      {/* Editor Action Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <span className="font-sans text-[12px] text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-accent-ochre leading-none">
            info
          </span>
          Modifying policy clauses creates a new revision draft ({nextVersion}) and flags dependent reviews.
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded font-sans text-[12px] font-medium bg-surface-muted text-on-surface hover:bg-surface-dim border border-outline-dim transition-colors cursor-pointer"
          >
            Discard Edits
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSaveDraft(content)}
            className="px-4 py-1.5 rounded font-sans text-[12px] font-medium bg-black text-white hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              {isSaving ? "sync" : "publish"}
            </span>
            <span>{isSaving ? "Publishing..." : `Publish ${nextVersion} Baseline`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
