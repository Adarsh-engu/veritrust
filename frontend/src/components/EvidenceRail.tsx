"use client";

import React, { useEffect, useRef } from "react";
import { RunResult, Claim } from "@/types/contracts";

interface EvidenceRailProps {
  runResult: RunResult;
  selectedClaimId: string | null;
  onCardClick?: (id: string) => void;
}

const claimRefId = (id: number) => `claim-${id}`;

const statusColors = {
  CONTRADICTED: {
    border: "border-accent-rose",
    ring: "ring-accent-rose/30",
    badge: "bg-accent-rose-bg text-accent-rose border-accent-rose-border",
    label: "Contradicted",
    quoteBar: "border-accent-rose",
  },
  UNSUPPORTED: {
    border: "border-amber-300",
    ring: "ring-amber-300/30",
    badge: "bg-amber-50 text-amber-700 border-amber-300",
    label: "Unsupported",
    quoteBar: "border-amber-400",
  },
  SUPPORTED: {
    border: "border-emerald-300",
    ring: "ring-emerald-300/30",
    badge: "bg-emerald-50 text-accent-green border-emerald-200",
    label: "Supported",
    quoteBar: "border-accent-green",
  },
};

interface ClaimCardProps {
  claim: Claim;
  selectedClaimId: string | null;
  onCardClick?: (id: string) => void;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ claim, selectedClaimId, onCardClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const refId = claimRefId(claim.id);
  const isSelected = selectedClaimId === refId;
  const colors = statusColors[claim.status];

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  return (
    <div
      id={refId}
      ref={cardRef}
      onClick={() => onCardClick?.(refId)}
      className={`bg-white p-4 rounded border-2 shadow-xs flex flex-col gap-3 transition-all relative cursor-pointer ${colors.border} ${
        isSelected ? `ring-2 ${colors.ring}` : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colors.badge}`}
        >
          {colors.label}
        </span>
        <span className={`font-mono text-[10px] font-semibold ${colors.badge.split(" ")[1]}`}>
          Claim #{String(claim.id + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Claim text */}
      <div>
        <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
          Claim:
        </span>
        <p
          className={`font-mono text-[11px] p-2 rounded border leading-snug ${
            claim.status === "SUPPORTED"
              ? "text-accent-green bg-emerald-50/50 border-emerald-200"
              : "text-accent-rose bg-rose-50 border-rose-200 line-through"
          }`}
        >
          &ldquo;{claim.text}&rdquo;
        </p>
      </div>

      {/* Reason */}
      <div>
        <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-0.5">
          Reason:
        </span>
        <p className="font-sans text-[12px] text-on-surface leading-normal">{claim.reason}</p>
      </div>

      {/* Evidence quote (if any) */}
      {claim.evidence && claim.evidence.length > 0 ? (
        <div>
          <span className="font-mono text-[10px] text-outline uppercase tracking-wider block mb-1">
            Evidence:
          </span>
          <blockquote
            className={`font-editorial text-[13px] italic text-on-surface bg-[#faf8f0] p-2.5 rounded border-l-2 border-y border-r border-outline-dim leading-snug ${colors.quoteBar}`}
          >
            &ldquo;{claim.evidence[0].text}&rdquo;
          </blockquote>
        </div>
      ) : claim.status === "UNSUPPORTED" ? (
        <div className="font-sans text-[12px] text-on-surface bg-[#faf8f0] p-2.5 rounded border border-outline-dim leading-snug">
          No matching facts found in retrieved documents.
        </div>
      ) : null}

      {/* Footer: source + version */}
      <div className="pt-2 border-t border-outline-dim flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
        {claim.evidence && claim.evidence.length > 0 ? (
          <>
            <span>
              Source:{" "}
              <strong className="text-on-surface">{claim.evidence[0].source}</strong>
            </span>
            <span>
              {claim.evidence[0].version} · Chunk #
              {claim.evidence[0].chunk_id?.split("#")[1] ?? "?"}
            </span>
          </>
        ) : claim.status === "UNSUPPORTED" ? (
          <>
            <span>Result: <strong className="text-accent-rose">ABSTAINED</strong></span>
            <span>No evidence</span>
          </>
        ) : (
          <span className="text-accent-green">✓ Verified</span>
        )}
      </div>
    </div>
  );
};

export const EvidenceRail: React.FC<EvidenceRailProps> = ({
  runResult,
  selectedClaimId,
  onCardClick,
}) => {
  // Show final_claims for delivered/corrected, else first-draft claims
  const isCorrected = runResult.final_status === "CORRECTED";
  const claims = isCorrected ? runResult.final_claims : runResult.claims;

  // Show first-draft claims as "Original" section if corrected
  const originalClaims = isCorrected ? runResult.claims : [];

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

      {/* If corrected: first show original contradicted claims */}
      {isCorrected && originalClaims.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-outline border-b border-outline-dim pb-1">
            Original Draft Claims
          </span>
          {originalClaims.map((claim) => (
            <ClaimCard
              key={`orig-${claim.id}`}
              claim={claim}
              selectedClaimId={selectedClaimId}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}

      {/* Final claims (or only claims for delivered/abstained) */}
      {claims && claims.length > 0 && (
        <div className="flex flex-col gap-3">
          {isCorrected && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-outline border-b border-outline-dim pb-1">
              Final Verified Claims
            </span>
          )}
          {claims.map((claim) => (
            <ClaimCard
              key={`final-${claim.id}`}
              claim={claim}
              selectedClaimId={selectedClaimId}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {(!claims || claims.length === 0) && (!originalClaims || originalClaims.length === 0) && (
        <div className="font-mono text-[11px] text-outline text-center py-8">
          No claims checked yet
        </div>
      )}
    </aside>
  );
};
