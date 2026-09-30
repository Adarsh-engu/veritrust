"use client";

import React from "react";
import { RunResult, Claim } from "@/types/contracts";
import { computeTrackedDiff } from "@/lib/diff";

interface DocumentReviewProps {
  runResult: RunResult;
  viewMode: "reviewer" | "customer";
  onSelectClaim: (refId: string) => void;
  selectedClaimId: string | null;
}

/** Map a claim id to a stable ref string used for cross-linking. */
const claimRefId = (id: number) => `claim-${id}`;

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  runResult,
  viewMode,
  onSelectClaim,
  selectedClaimId,
}) => {
  const isCorrected = runResult.final_status === "CORRECTED";
  const isAbstained = runResult.final_status === "ABSTAINED";
  const isDelivered = runResult.final_status === "DELIVERED";

  // Build a map from char offset -> claim for inline rendering
  const claimsByStart = React.useMemo(() => {
    const m = new Map<number, Claim>();
    for (const c of runResult.claims) {
      m.set(c.start, c);
    }
    return m;
  }, [runResult.claims]);

  // For customer view: use final_claims if delivered/corrected
  const displayClaims = isCorrected ? runResult.final_claims : runResult.claims;
  const firstEvidence = displayClaims?.find(c => c.evidence?.length > 0)?.evidence[0];
  const primarySource = firstEvidence?.source || Object.keys(runResult.policy_versions)[0] || "refund_policy.md";
  const primaryVersion = firstEvidence?.version || Object.values(runResult.policy_versions)[0] || "v1";

  // Compute word-level diff for tracked changes
  const diffSegments = React.useMemo(() => {
    if (!isCorrected) return [];
    return computeTrackedDiff(runResult.draft, runResult.final_draft);
  }, [runResult.draft, runResult.final_draft, isCorrected]);

  // Render claim-annotated text for delivered case (inline spans per claim)
  const renderClaimAnnotatedText = (text: string, claims: Claim[]) => {
    if (!claims || claims.length === 0) return <span>{text}</span>;

    // Sort claims by start offset
    const sorted = [...claims].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const claim of sorted) {
      const { start, end, id, status } = claim;
      // Guard: skip malformed spans
      if (start < cursor || end > text.length || start >= end) continue;

      // Text before this claim
      if (start > cursor) {
        parts.push(<span key={`pre-${id}`}>{text.slice(cursor, start)}</span>);
      }

      const refId = claimRefId(id);
      const isSelected = selectedClaimId === refId;
      const claimText = text.slice(start, end);

      if (status === "CONTRADICTED") {
        parts.push(
          <del
            key={refId}
            onClick={() => onSelectClaim(refId)}
            className={`line-through text-rose-700 px-1 py-0.5 rounded border cursor-pointer mx-0.5 transition-colors ${
              isSelected
                ? "bg-rose-100 border-rose-400 ring-1 ring-rose-400"
                : "bg-rose-50 border-rose-200"
            }`}
            title="Contradicted claim — click to view evidence"
          >
            {claimText}
          </del>
        );
      } else if (status === "UNSUPPORTED") {
        parts.push(
          <span
            key={refId}
            onClick={() => onSelectClaim(refId)}
            className={`underline decoration-amber-400 decoration-2 underline-offset-2 cursor-pointer px-0.5 rounded transition-colors ${
              isSelected ? "bg-amber-50" : ""
            }`}
            title="Unsupported claim — click to view evidence"
          >
            {claimText}
          </span>
        );
      } else {
        // SUPPORTED
        parts.push(
          <span
            key={refId}
            onClick={() => onSelectClaim(refId)}
            className={`cursor-pointer rounded px-0.5 transition-colors ${
              isSelected ? "bg-emerald-50 ring-1 ring-emerald-300" : ""
            }`}
            title="Verified claim"
          >
            {claimText}
          </span>
        );
      }

      cursor = end;
    }

    // Remaining text
    if (cursor < text.length) {
      parts.push(<span key="tail">{text.slice(cursor)}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* AI answer presented as a clean editorial document page */}
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
                  {runResult.retries} CORRECTION{runResult.retries !== 1 ? "S" : ""} APPLIED
                </span>
              )}
              {isDelivered && (
                <span className="text-accent-green bg-emerald-50 px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-emerald-200">
                  VERIFIED CLEAN
                </span>
              )}
              {isAbstained && (
                <span className="text-accent-rose bg-accent-rose-bg px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-accent-rose-border">
                  ABSTAINED ({runResult.abstain_reason || "UNSUPPORTED"})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Document Text Area */}
        <div className="font-editorial text-[1.125rem] text-on-surface leading-[1.85]">
          {viewMode === "customer" ? (
            /* Customer View: Pristine, clean final answer */
            <div className="space-y-4">
              <p>{runResult.final_answer}</p>
            </div>
          ) : (
            /* Reviewer View: Tracked redline changes */
            <div className="space-y-4">
              {isAbstained ? (
                <div className="space-y-3">
                  <p className="line-through text-rose-700 bg-rose-50 px-2 py-1.5 rounded border border-rose-200">
                    {renderClaimAnnotatedText(runResult.draft, runResult.claims)}
                  </p>
                  <div className="font-sans text-[13px] bg-surface-muted p-3.5 rounded border border-outline-dim text-on-surface-variant mt-2">
                    <span className="font-mono text-[11px] font-semibold uppercase text-accent-rose block mb-0.5">
                      Safe Refusal Enforced ({runResult.abstain_reason || "UNSUPPORTED"}):
                    </span>
                    {runResult.final_answer}
                  </div>
                </div>
              ) : isCorrected ? (
                /* Word-level diff: deletions from draft + insertions from final */
                <p>
                  {diffSegments.map((segment, idx) => {
                    if (segment.type === "delete") {
                      return (
                        <del
                          key={idx}
                          className="line-through text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 mx-0.5"
                          title="Contradicted text — removed by correction"
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
                          title="Corrected text — verified against evidence"
                        >
                          {segment.text}
                        </ins>
                      );
                    }
                    return <span key={idx}>{segment.text}</span>;
                  })}
                </p>
              ) : (
                /* Delivered clean — show claim annotations inline */
                <p>
                  {renderClaimAnnotatedText(runResult.draft, runResult.claims)}
                </p>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Verification badge */}
      {!isAbstained && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              const firstSupportedClaim = displayClaims?.find(c => c.status === "SUPPORTED");
              if (firstSupportedClaim) onSelectClaim(claimRefId(firstSupportedClaim.id));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-dim border border-outline-dim font-mono text-[11px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="text-accent-green font-semibold">✓</span>
            <span>
              Verified against <code className="text-on-surface font-medium">{primarySource}</code> ·{" "}
              {primaryVersion}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
