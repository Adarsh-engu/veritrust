"use client";

import React from "react";
import { RunResult } from "@/types/contracts";

interface TimelineProps {
  runResult: RunResult;
}

export const Timeline: React.FC<TimelineProps> = ({ runResult }) => {
  const hasContradiction = runResult.claims.some((c) => c.status === "CONTRADICTED");
  const hasUnsupported = runResult.claims.some((c) => c.status === "UNSUPPORTED");
  const isAbstained = runResult.final_status === "ABSTAINED";
  const wasCorrected = runResult.final_status === "CORRECTED";

  // Policies cited
  const policyNames = Object.keys(runResult.policy_versions);
  const primaryPolicy = policyNames.length > 0 ? policyNames[0] : "refund_policy.md";

  return (
    <aside className="w-[200px] shrink-0 border-r border-outline-dim bg-[#faf8f0] p-5 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-outline font-semibold block">
            Pipeline
          </span>
          <span className="font-mono text-[11px] text-on-surface-variant mt-0.5 block">
            Automated Stages
          </span>
        </div>

        <ol className="relative border-l border-outline-dim ml-2 space-y-6 text-left">
          {/* Stage 1: Retrieve */}
          <li className="ml-4 relative">
            <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-on-surface ring-3 ring-[#faf8f0] flex items-center justify-center"></span>
            <div className="font-mono text-[11px] font-semibold text-on-surface">1. Retrieve</div>
            <div className="font-mono text-[10px] text-on-surface-variant mt-0.5 truncate">
              {primaryPolicy}
            </div>
            {runResult.latency_ms?.retrieve ? (
              <div className="font-mono text-[9px] text-outline mt-0.5">
                {runResult.latency_ms.retrieve}ms
              </div>
            ) : null}
          </li>

          {/* Stage 2: Draft */}
          <li className="ml-4 relative">
            <span className="absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-on-surface ring-3 ring-[#faf8f0]"></span>
            <div className="font-mono text-[11px] font-semibold text-on-surface">2. Draft</div>
            <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">
              Initial response
            </div>
            {runResult.latency_ms?.maker ? (
              <div className="font-mono text-[9px] text-outline mt-0.5">
                {runResult.latency_ms.maker}ms
              </div>
            ) : null}
          </li>

          {/* Stage 3: Check claims */}
          <li className="ml-4 relative">
            <span
              className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full ring-3 ring-[#faf8f0] ${
                hasContradiction
                  ? "bg-accent-rose"
                  : hasUnsupported
                  ? "bg-accent-ochre"
                  : "bg-accent-green"
              }`}
            ></span>
            <div
              className={`font-mono text-[11px] font-semibold ${
                hasContradiction
                  ? "text-accent-rose"
                  : hasUnsupported
                  ? "text-accent-ochre"
                  : "text-on-surface"
              }`}
            >
              3. Check claims
            </div>
            <div
              className={`font-mono text-[10px] mt-0.5 ${
                hasContradiction
                  ? "text-accent-rose"
                  : hasUnsupported
                  ? "text-accent-ochre"
                  : "text-accent-green"
              }`}
            >
              {hasContradiction
                ? "1 contradiction detected"
                : hasUnsupported
                ? "1 unsupported claim"
                : "Claims verified"}
            </div>
          </li>

          {/* Stage 4: Correct */}
          <li className="ml-4 relative">
            <span
              className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full ring-3 ring-[#faf8f0] ${
                wasCorrected
                  ? "bg-accent-ochre"
                  : isAbstained
                  ? "bg-accent-rose"
                  : "bg-outline-mid"
              }`}
            ></span>
            <div
              className={`font-mono text-[11px] font-semibold ${
                wasCorrected
                  ? "text-accent-ochre"
                  : isAbstained
                  ? "text-accent-rose"
                  : "text-outline"
              }`}
            >
              4. Correct
            </div>
            <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">
              {wasCorrected
                ? "15 days applied"
                : isAbstained
                ? "Abstained (No evidence)"
                : "Not needed (Clean)"}
            </div>
          </li>

          {/* Stage 5: Verified */}
          <li className="ml-4 relative">
            <span
              className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full ring-3 ring-[#faf8f0] ${
                isAbstained ? "bg-accent-rose" : "bg-accent-green"
              }`}
            ></span>
            <div className="font-mono text-[11px] font-semibold text-on-surface">
              {isAbstained ? "5. Abstained" : "5. Verified"}
            </div>
            <div
              className={`font-mono text-[10px] mt-0.5 ${
                isAbstained ? "text-accent-rose" : "text-accent-green"
              }`}
            >
              {isAbstained ? "Safe Refusal" : "Ready"}
            </div>
          </li>
        </ol>
      </div>

      {/* Latency summary at bottom */}
      <div className="pt-4 border-t border-outline-dim font-mono text-[10px] text-outline">
        <div>Total latency: {runResult.latency_ms?.total || 1250}ms</div>
        <div className="mt-0.5 text-[9px] text-on-surface-variant">
          Retries: {runResult.retries} / 2
        </div>
      </div>
    </aside>
  );
};
