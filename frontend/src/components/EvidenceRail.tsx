"use client";

import React, { useEffect, useRef } from "react";
import { RunResult } from "@/types/contracts";

interface EvidenceRailProps {
  runResult: RunResult;
  selectedClaimId: string | null;
  onCardClick?: (id: string) => void;
}

export const EvidenceRail: React.FC<EvidenceRailProps> = ({
  runResult,
  selectedClaimId,
  onCardClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedClaimId === "ref-01" && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedClaimId]);

  const contradictedClaim = runResult.claims.find((c) => c.status === "CONTRADICTED");
  const unsupportedClaim = runResult.claims.find((c) => c.status === "UNSUPPORTED");
  const supportedClaim = runResult.final_claims.find((c) => c.status === "SUPPORTED");

  // Determine primary policy
  const policyNames = Object.keys(runResult.policy_versions);
  const primaryPolicy = policyNames.length > 0 ? policyNames[0] : "refund_policy.md";

  return (
    <aside className="w-[340px] shrink-0 border-l border-outline-dim bg-[#faf8f0] p-5 overflow-y-auto flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-outline-dim pb-2.5">
        <span className="font-mono text-[10px] tracking-widest uppercase text-outline font-semibold">
          Evidence &amp; Claims
        </span>
        <span className="font-mono text-[10px] text-outline truncate max-w-[150px]">
          {primaryPolicy}
        </span>
      </div>

      {/* CARD 1: CONTRADICTED CLAIM (linked to [ref_01]) */}
      {contradictedClaim && (
        <div
          id="ref-01"
          ref={cardRef}
          onClick={() => onCardClick?.("ref-01")}
          className={`bg-white p-4 rounded border-2 shadow-xs flex flex-col gap-3 transition-all relative cursor-pointer ${
            selectedClaimId === "ref-01"
              ? "border-accent-rose ring-2 ring-accent-rose/30"
              : "border-accent-rose-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-rose-bg text-accent-rose border border-accent-rose-border">
              Contradicted Claim
            </span>
            <span className="font-mono text-[10px] text-accent-rose font-semibold">
              Claim #{String(contradictedClaim.id + 1).padStart(2, "0")}
            </span>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
              Claim:
            </span>
            <p className="font-mono text-[11px] text-accent-rose bg-rose-50 p-2 rounded border border-rose-200 line-through">
              &ldquo;{contradictedClaim.text}&rdquo;
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-0.5">
              Reason:
            </span>
            <p className="font-sans text-[12px] text-on-surface leading-normal">
              {contradictedClaim.reason || "Policy states refunds are allowed within 15 days of purchase."}
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
              Evidence Quote:
            </span>
            <blockquote className="font-editorial text-[13px] italic text-on-surface bg-[#faf8f0] p-2.5 rounded border-l-2 border-accent-rose border-y border-r border-outline-dim leading-snug">
              &ldquo;
              {contradictedClaim.evidence?.[0]?.text ||
                "Refunds are allowed within 15 days of purchase."}
              &rdquo;
            </blockquote>
          </div>

          <div className="pt-2 border-t border-outline-dim flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
            <span>
              Source:{" "}
              <strong className="text-on-surface">
                {contradictedClaim.evidence?.[0]?.source || primaryPolicy}
              </strong>
            </span>
            <span>
              {contradictedClaim.evidence?.[0]?.version || "v1"} · Chunk #
              {contradictedClaim.evidence?.[0]?.chunk_id?.split("#")[1] || "3"}
            </span>
          </div>
        </div>
      )}

      {/* CARD 2: UNSUPPORTED CLAIM (for abstained cases) */}
      {unsupportedClaim && !contradictedClaim && (
        <div
          id="ref-01"
          ref={cardRef}
          className="bg-white p-4 rounded border-2 border-accent-rose-border shadow-xs flex flex-col gap-3 transition-all relative"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-rose-bg text-accent-rose border border-accent-rose-border">
              Unsupported Claim
            </span>
            <span className="font-mono text-[10px] text-accent-rose font-semibold">
              Claim #{String(unsupportedClaim.id + 1).padStart(2, "0")}
            </span>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
              Claim:
            </span>
            <p className="font-mono text-[11px] text-accent-rose bg-rose-50 p-2 rounded border border-rose-200 line-through">
              &ldquo;{unsupportedClaim.text}&rdquo;
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-0.5">
              Reason:
            </span>
            <p className="font-sans text-[12px] text-on-surface leading-normal">
              {unsupportedClaim.reason || "No evidence mentions this statement in corporate policies."}
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
              Verification Result:
            </span>
            <div className="font-sans text-[12px] text-on-surface bg-[#faf8f0] p-2.5 rounded border border-outline-dim leading-snug">
              No matching facts found in retrieved documents. Safe refusal triggered.
            </div>
          </div>

          <div className="pt-2 border-t border-outline-dim flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
            <span>Result: <strong className="text-accent-rose">ABSTAINED</strong></span>
            <span>Reason: UNSUPPORTED</span>
          </div>
        </div>
      )}

      {/* CARD 3: SUPPORTED CLAIM (for clean delivered cases) */}
      {supportedClaim && !contradictedClaim && !unsupportedClaim && (
        <div
          id="ref-01"
          ref={cardRef}
          className="bg-white p-4 rounded border-2 border-emerald-300 shadow-xs flex flex-col gap-3 transition-all relative"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-accent-green border border-emerald-200">
              Supported Claim
            </span>
            <span className="font-mono text-[10px] text-accent-green font-semibold">
              Claim #{String(supportedClaim.id + 1).padStart(2, "0")}
            </span>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
              Claim:
            </span>
            <p className="font-mono text-[11px] text-accent-green bg-emerald-50/50 p-2 rounded border border-emerald-200">
              &ldquo;{supportedClaim.text}&rdquo;
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-0.5">
              Reason:
            </span>
            <p className="font-sans text-[12px] text-on-surface leading-normal">
              {supportedClaim.reason || "Matches policy exactly."}
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
              Evidence Quote:
            </span>
            <blockquote className="font-editorial text-[13px] italic text-on-surface bg-[#faf8f0] p-2.5 rounded border-l-2 border-accent-green border-y border-r border-outline-dim leading-snug">
              &ldquo;
              {supportedClaim.evidence?.[0]?.text ||
                "Refunds are allowed within 15 days of purchase."}
              &rdquo;
            </blockquote>
          </div>

          <div className="pt-2 border-t border-outline-dim flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
            <span>
              Source:{" "}
              <strong className="text-on-surface">
                {supportedClaim.evidence?.[0]?.source || primaryPolicy}
              </strong>
            </span>
            <span>
              {supportedClaim.evidence?.[0]?.version || "v1"} · Chunk #
              {supportedClaim.evidence?.[0]?.chunk_id?.split("#")[1] || "1"}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
