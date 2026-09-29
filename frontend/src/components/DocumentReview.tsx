"use client";

import React from "react";
import { RunResult } from "@/types/contracts";
import { computeTrackedDiff } from "@/lib/diff";

interface DocumentReviewProps {
  runResult: RunResult;
  viewMode: "reviewer" | "customer";
  onSelectClaim: (refId: string) => void;
  selectedClaimId: string | null;
}

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  runResult,
  viewMode,
  onSelectClaim,
  selectedClaimId,
}) => {
  const isCorrected = runResult.final_status === "CORRECTED";
  const isAbstained = runResult.final_status === "ABSTAINED";
  const isDelivered = runResult.final_status === "DELIVERED";

  // Policies cited
  const policyEntries = Object.entries(runResult.policy_versions);
  const primarySource = policyEntries.length > 0 ? policyEntries[0][0] : "refund_policy.md";
  const primaryVersion = policyEntries.length > 0 ? policyEntries[0][1] : "v1";

  // Compute word-level diff for tracked changes
  const diffSegments = React.useMemo(() => {
    if (!isCorrected) return [];
    return computeTrackedDiff(runResult.draft, runResult.final_draft);
  }, [runResult.draft, runResult.final_draft, isCorrected]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 2. AI answer presented as a clean editorial document page */}
      <article className="bg-white p-9 sm:p-11 rounded border border-outline-dim shadow-xs relative transition-all">
        {/* Document Header */}
        <div className="flex items-center justify-between border-b border-outline-dim pb-3.5 mb-6 text-[11px] font-mono text-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] leading-none">article</span>
            <span className="uppercase tracking-wider font-semibold text-on-surface-variant">
              Response Draft
            </span>
          </div>

          {viewMode === "reviewer" && (
            <div>
              {isCorrected && (
                <span className="text-accent-ochre bg-accent-ochre-bg px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-accent-ochre-border">
                  {runResult.retries} CORRECTION APPLIED
                </span>
              )}
              {isDelivered && (
                <span className="text-accent-green bg-emerald-50 px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-emerald-200">
                  VERIFIED CLEAN
                </span>
              )}
              {isAbstained && (
                <span className="text-accent-rose bg-accent-rose-bg px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-accent-rose-border">
                  ABSTAINED (REFUSAL)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Document Text Area */}
        <div className="font-editorial text-[1.125rem] text-on-surface leading-[1.85]">
          {viewMode === "customer" ? (
            /* Customer View: Pristine, clean text */
            <div className="space-y-4">
              <p>{runResult.final_answer}</p>
            </div>
          ) : (
            /* Reviewer View: Tracked redline changes */
            <div className="space-y-4">
              {isAbstained ? (
                <div className="space-y-3">
                  <p className="line-through text-rose-700 bg-rose-50 px-2 py-1.5 rounded border border-rose-200">
                    {runResult.draft}
                  </p>
                  <div className="font-sans text-[13px] bg-surface-muted p-3.5 rounded border border-outline-dim text-on-surface-variant mt-2">
                    <span className="font-mono text-[11px] font-semibold uppercase text-accent-rose block mb-0.5">
                      Safe Refusal Enforced:
                    </span>
                    {runResult.final_answer}
                  </div>
                </div>
              ) : isCorrected ? (
                <p>
                  {diffSegments.map((segment, idx) => {
                    if (segment.type === "delete") {
                      return (
                        <del
                          key={idx}
                          onClick={() => onSelectClaim("ref-01")}
                          className="line-through text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 cursor-pointer mx-0.5"
                          title="Contradicted claim (Click to view evidence)"
                        >
                          {segment.text}
                        </del>
                      );
                    }
                    if (segment.type === "insert") {
                      return (
                        <ins
                          key={idx}
                          className="no-underline text-emerald-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 font-medium mx-0.5"
                          title="Verified corrected text"
                        >
                          {segment.text}
                        </ins>
                      );
                    }
                    return <span key={idx}>{segment.text}</span>;
                  })}
                  <button
                    type="button"
                    onClick={() => onSelectClaim("ref-01")}
                    className={`font-mono text-[11px] text-accent-ochre font-semibold hover:underline align-baseline cursor-pointer ml-1.5 px-1 py-0.5 rounded ${
                      selectedClaimId === "ref-01" ? "bg-accent-ochre-bg ring-1 ring-accent-ochre" : ""
                    }`}
                    title="Inspect ground truth reference"
                  >
                    [ref_01]
                  </button>
                  .
                </p>
              ) : (
                /* Delivered clean */
                <p>
                  <span>{runResult.draft}</span>
                  <button
                    type="button"
                    onClick={() => onSelectClaim("ref-01")}
                    className="font-mono text-[11px] text-accent-green font-semibold hover:underline align-baseline cursor-pointer ml-1.5 px-1 py-0.5 rounded"
                    title="Inspect ground truth reference"
                  >
                    [ref_01]
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </article>

      {/* 3. Subtle, clickable verification badge below document */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onSelectClaim("ref-01")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-dim border border-outline-dim font-mono text-[11px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <span className="text-accent-green font-semibold">✓</span>
          <span>
            Verified against <code className="text-on-surface font-medium">{primarySource}</code> ·{" "}
            {primaryVersion}
          </span>
        </button>
      </div>
    </div>
  );
};
