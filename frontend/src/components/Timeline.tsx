"use client";

import React from "react";
import { RunResult } from "@/types/contracts";
import { PipelineStage, StageStatus } from "@/hooks/useAsk";

interface TimelineProps {
  runResult: RunResult | null;
  stageStatuses?: Record<PipelineStage, StageStatus>;
  currentStage?: PipelineStage | null;
}

const stageList: { key: PipelineStage; label: string; sub: (r: RunResult | null) => string }[] = [
  {
    key: "retrieve",
    label: "1. Retrieve",
    sub: (r) => {
      if (!r) return "Fetching policy chunks…";
      const names = Object.keys(r.policy_versions);
      return names.length > 0 ? names[0] : "refund_policy.md";
    },
  },
  {
    key: "maker",
    label: "2. Draft",
    sub: () => "Initial response",
  },
  {
    key: "check",
    label: "3. Check claims",
    sub: (r) => {
      if (!r) return "Analysing claims…";
      const hasC = r.claims.some((c) => c.status === "CONTRADICTED");
      const hasU = r.claims.some((c) => c.status === "UNSUPPORTED");
      if (hasC) return `${r.claims.filter(c => c.status === "CONTRADICTED").length} contradiction(s)`;
      if (hasU) return `${r.claims.filter(c => c.status === "UNSUPPORTED").length} unsupported`;
      return r.claims.length > 0 ? "All claims verified" : "Checking…";
    },
  },
  {
    key: "correct",
    label: "4. Correct",
    sub: (r) => {
      if (!r) return "";
      if (r.final_status === "CORRECTED") return `${r.retries} retry applied`;
      if (r.final_status === "ABSTAINED") return "Abstained (no evidence)";
      return "Not needed (clean)";
    },
  },
  {
    key: "verified",
    label: "5. Verified",
    sub: (r) => {
      if (!r) return "";
      if (r.final_status === "ABSTAINED") return "Safe refusal";
      if (r.final_status === "CORRECTED") return "Correction verified";
      return "Ready";
    },
  },
];

const latencyKey: Record<PipelineStage, keyof RunResult["latency_ms"] | null> = {
  retrieve: "retrieve",
  maker: "maker",
  check: "check",
  correct: "correct",
  verified: "total",
};

const dotColor: Record<StageStatus, string> = {
  pending: "bg-outline-mid",
  active: "bg-accent-ochre animate-pulse",
  completed: "bg-on-surface",
  error: "bg-accent-rose",
  skipped: "bg-outline-mid opacity-50",
};

const labelColor: Record<StageStatus, string> = {
  pending: "text-outline",
  active: "text-accent-ochre font-semibold",
  completed: "text-on-surface font-semibold",
  error: "text-accent-rose font-semibold",
  skipped: "text-outline opacity-60",
};

export const Timeline: React.FC<TimelineProps> = ({
  runResult,
  stageStatuses,
  currentStage,
}) => {
  // Fallback: derive statuses from a completed runResult when stageStatuses not provided
  const effectiveStatuses = React.useMemo((): Record<PipelineStage, StageStatus> => {
    if (stageStatuses) return stageStatuses;
    if (!runResult) {
      return { retrieve: "pending", maker: "pending", check: "pending", correct: "pending", verified: "pending" };
    }
    const wasCorrected = runResult.final_status === "CORRECTED";
    return {
      retrieve: "completed",
      maker: "completed",
      check: "completed",
      correct: wasCorrected ? "completed" : "skipped",
      verified: "completed",
    };
  }, [stageStatuses, runResult]);

  const policyNames = runResult ? Object.keys(runResult.policy_versions) : [];
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
          {stageList.map((stage) => {
            const status = effectiveStatuses[stage.key] ?? "pending";
            const isActive = currentStage === stage.key;
            const latK = latencyKey[stage.key];
            const latMs = runResult && latK ? runResult.latency_ms?.[latK] : null;

            // Override check dot colour for contradiction/unsupported
            let dotCls = dotColor[status];
            let labelCls = labelColor[status];
            if (stage.key === "check" && status === "completed" && runResult) {
              const hasC = runResult.claims.some(c => c.status === "CONTRADICTED");
              const hasU = runResult.claims.some(c => c.status === "UNSUPPORTED");
              if (hasC) {
                dotCls = "bg-accent-rose";
                labelCls = "text-accent-rose font-semibold";
              } else if (hasU) {
                dotCls = "bg-accent-ochre";
                labelCls = "text-accent-ochre font-semibold";
              }
            }
            if (stage.key === "verified" && status === "completed" && runResult) {
              if (runResult.final_status === "ABSTAINED") {
                dotCls = "bg-accent-rose";
                labelCls = "text-accent-rose font-semibold";
              } else {
                dotCls = "bg-accent-green";
                labelCls = "text-accent-green font-semibold";
              }
            }

            return (
              <li key={stage.key} className="ml-4 relative">
                <span
                  className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full ring-3 ring-[#faf8f0] ${dotCls} ${
                    isActive ? "ring-accent-ochre" : ""
                  }`}
                />
                <div className={`font-mono text-[11px] ${labelCls}`}>{stage.label}</div>
                <div className="font-mono text-[10px] text-on-surface-variant mt-0.5 truncate">
                  {stage.key === "retrieve" && status !== "pending"
                    ? primaryPolicy
                    : stage.sub(runResult)}
                </div>
                {latMs != null && latMs > 0 && status === "completed" && (
                  <div className="font-mono text-[9px] text-outline mt-0.5">{latMs}ms</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Latency + retries summary */}
      <div className="pt-4 border-t border-outline-dim font-mono text-[10px] text-outline">
        <div>
          Total:{" "}
          {runResult?.latency_ms?.total
            ? `${runResult.latency_ms.total}ms`
            : currentStage
            ? "Running…"
            : "—"}
        </div>
        <div className="mt-0.5 text-[9px] text-on-surface-variant">
          Retries: {runResult?.retries ?? 0} / 2
        </div>
      </div>
    </aside>
  );
};
