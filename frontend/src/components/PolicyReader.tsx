"use client";

import React from "react";
import Link from "next/link";
import { PolicyDocument } from "@/types/policy";

interface PolicyReaderProps {
  policy: PolicyDocument;
  isStale: boolean;
  previousVersion?: string;
  mode: "view" | "edit";
  onModeChange: (mode: "view" | "edit") => void;
  onReindex: () => void;
  isReindexing: boolean;
}

export const PolicyReader: React.FC<PolicyReaderProps> = ({
  policy,
  isStale,
  previousVersion = "v1.4",
  mode,
  onModeChange,
  onReindex,
  isReindexing,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Metadata Bar Container */}
      <div className="bg-white p-6 sm:p-7 rounded-lg border border-outline-dim shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
              <span className="text-accent-ochre font-semibold">Policy · {policy.name}</span>
              <span className="w-1 h-1 rounded-full bg-outline"></span>
              <span className="text-outline">
                VERSION: {policy.version} (Current runtime) · UPDATED: {policy.updatedAt}
              </span>
            </div>

            <h1 className="font-editorial text-[1.75rem] font-serif text-on-surface mt-0.5">
              {policy.name}
            </h1>

            <p className="font-editorial text-[14px] text-on-surface-variant italic">
              {policy.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {/* View / Edit Mode Toggle Tabs */}
            <div className="flex items-center p-0.5 bg-surface-muted rounded border border-outline-dim">
              <button
                type="button"
                onClick={() => onModeChange("view")}
                className={`px-3 py-1 rounded font-sans text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === "view"
                    ? "bg-white text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] leading-none">auto_stories</span>
                Annotated Document
              </button>
              <button
                type="button"
                onClick={() => onModeChange("edit")}
                className={`px-3 py-1 rounded font-sans text-[12px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === "edit"
                    ? "bg-white text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] leading-none">edit_note</span>
                Edit Policy
              </button>
            </div>

            {/* Reindex Button */}
            <button
              type="button"
              onClick={onReindex}
              disabled={isReindexing}
              title="Simulate re-indexing policy vectors (PRD Section 10)"
              className="p-1.5 rounded font-mono text-[11px] bg-surface-muted hover:bg-surface-dim border border-outline-dim text-on-surface-variant transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              <span
                className={`material-symbols-outlined text-[16px] leading-none ${
                  isReindexing ? "animate-spin text-accent-ochre" : ""
                }`}
              >
                sync
              </span>
            </button>
          </div>
        </div>

        {/* Freshness / Stale Runs Alert Banner (PRD Section 14) */}
        {isStale && (
          <div className="rounded-lg p-4 bg-accent-ochre-bg/40 border border-accent-ochre-border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-accent-ochre text-[22px] mt-0.5 leading-none">
                update
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-editorial text-[15px] font-semibold text-on-surface">
                    Policy updated to {policy.version}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-accent-ochre border border-accent-ochre-border font-semibold">
                    Draft Saved (Simulation)
                  </span>
                </div>
                <p className="font-sans text-[13px] text-on-surface-variant">
                  {policy.staleRunsCount || 18} past answers are now out of date because they were verified against {previousVersion}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center font-mono text-[11px]">
              <Link
                href="/ledger"
                className="text-accent-ochre hover:underline flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">history</span>
                View stale runs →
              </Link>
              <span className="text-outline/40">·</span>
              <Link
                href="/"
                className="text-on-surface hover:text-accent-ochre hover:underline flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">question_answer</span>
                Re-ask question →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE: Editorial Reader with Gutter Chunk Annotations */}
      {mode === "view" && (
        <div className="bg-white p-6 sm:p-9 rounded-lg border border-outline-dim shadow-xs flex flex-col gap-6">
          {/* Document Meta Header inside reader */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-dim">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
              Policy Chunk Partitioning · {policy.chunks.length} Chunks
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant bg-surface-muted px-2 py-0.5 rounded border border-outline-dim/60">
              Authoritative Runtime Clauses
            </span>
          </div>

          {/* Render Chunks with Gutter Partitioning */}
          <div className="flex flex-col gap-6 divide-y divide-surface-dim">
            {policy.chunks.map((chunk, idx) => (
              <div
                key={chunk.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-5 items-start pt-6 first:pt-0 ${
                  chunk.isGroundTruthAnchor
                    ? "p-4 rounded-lg bg-surface-muted/40 border border-accent-ochre-border/50 shadow-xs"
                    : ""
                }`}
              >
                {/* Left Gutter Chunk Spec (3 cols) */}
                <div
                  className={`md:col-span-3 flex md:flex-col justify-between md:justify-start gap-1 p-2 rounded ${
                    chunk.isGroundTruthAnchor
                      ? "bg-white border-l-2 border-accent-ochre shadow-xs"
                      : "bg-surface-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[11px] font-bold text-accent-ochre">
                      {chunk.id}
                    </span>
                    {chunk.isGroundTruthAnchor && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-ochre animate-pulse"></span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-on-surface font-medium truncate">
                    {chunk.sectionLabel}
                  </span>
                  {chunk.anchorRunRef && (
                    <span className="font-mono text-[10px] text-accent-ochre font-medium">
                      {chunk.anchorRunRef}
                    </span>
                  )}
                  {chunk.anchorClaimRef && (
                    <span className="font-mono text-[10px] text-outline">
                      {chunk.anchorClaimRef}
                    </span>
                  )}
                </div>

                {/* Chunk Text (9 cols) */}
                <div className="md:col-span-9 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-editorial text-[1.125rem] font-serif text-on-surface font-semibold">
                      {chunk.title}
                    </h3>
                    {chunk.isGroundTruthAnchor && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-accent-ochre-bg text-accent-ochre font-semibold border border-accent-ochre-border">
                        Ground Truth Anchor
                      </span>
                    )}
                  </div>

                  {chunk.isGroundTruthAnchor ? (
                    <div className="p-3.5 rounded bg-white flex flex-col gap-2 border border-accent-ochre-border/40">
                      <p className="font-editorial text-[1.0625rem] text-on-surface leading-relaxed">
                        Opened electronics, audio gear, and headphones{" "}
                        <span className="bg-accent-ochre-bg text-on-surface px-1 py-0.5 rounded font-medium border-b border-accent-ochre">
                          can be returned within 15 days of purchase
                        </span>
                        , provided all original packaging, cords, and purchase receipts are intact.
                      </p>
                      <p className="font-editorial text-[1.0625rem] text-on-surface leading-relaxed">
                        Returns initiated after this 15-day window are{" "}
                        <span className="underline decoration-accent-rose decoration-2 font-medium text-accent-rose">
                          strictly ineligible for refund
                        </span>{" "}
                        and are subject exclusively to manufacturer warranty inspection and repair procedures.
                      </p>
                    </div>
                  ) : (
                    <p className="font-editorial text-[1.0625rem] text-on-surface leading-relaxed">
                      {chunk.content}
                    </p>
                  )}

                  {chunk.footnote && (
                    <div className="flex items-center gap-1.5 text-on-surface-variant pt-1 font-mono text-[10px]">
                      <span className="material-symbols-outlined text-[15px] text-accent-green leading-none">
                        verified
                      </span>
                      <span>
                        Ground truth for redline correction (
                        <span className="text-accent-ochre font-semibold">15 days</span> vs model
                        hallucination of <span className="text-outline line-through">30 days</span>)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Audit Verification Stamp */}
          <div className="bg-surface-muted/60 p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-3 border border-outline-dim/70 mt-2">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-accent-ochre leading-none">
                fact_check
              </span>
              <span className="font-sans text-[12px] text-on-surface-variant">
                Active baseline: <strong className="text-on-surface">{policy.version}</strong> ·
                Referenced in {policy.reviewsGroundedCount} verification runs
              </span>
            </div>
            <Link
              href="/ledger"
              className="font-mono text-[11px] text-accent-ochre hover:underline flex items-center gap-1 font-semibold"
            >
              Inspect Ledger Runs <span className="material-symbols-outlined text-[13px] leading-none">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
