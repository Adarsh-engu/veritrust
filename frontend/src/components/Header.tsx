"use client";

import React from "react";
import Link from "next/link";
import { ScenarioKey } from "@/lib/mockEvents";

interface HeaderProps {
  activeTab?: "review" | "ledger" | "policies";
  viewMode?: "reviewer" | "customer";
  onViewModeChange?: (mode: "reviewer" | "customer") => void;
  chaosActive?: boolean;
  onChaosToggle?: () => void;
  currentScenario?: ScenarioKey;
  onScenarioChange?: (scenario: ScenarioKey) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = "review",
  viewMode = "reviewer",
  onViewModeChange,
  chaosActive = false,
  onChaosToggle,
  currentScenario = "corrected",
  onScenarioChange,
}) => {
  return (
    <header className="h-13 py-2.5 px-6 border-b border-outline-dim bg-[#fff8f0]/95 backdrop-blur-sm shrink-0 flex items-center justify-between z-20">
      <div className="flex items-center gap-7">
        <Link href="/" className="flex items-center gap-1.5 select-none hover:opacity-90 transition-opacity">
          <span className="font-editorial text-[1.35rem] font-semibold tracking-tight text-on-surface">
            VeriTrust
          </span>
          <span className="font-mono text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-surface-muted text-on-surface-variant border border-outline-dim">
            AI
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-[12px] uppercase tracking-wider font-medium">
          {activeTab === "review" ? (
            <span className="text-on-surface font-semibold border-b-2 border-on-surface pb-1 -mb-[5px] cursor-default">
              Review
            </span>
          ) : (
            <Link
              href="/"
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
            >
              Review
            </Link>
          )}

          {activeTab === "ledger" ? (
            <span className="text-on-surface font-semibold border-b-2 border-on-surface pb-1 -mb-[5px] cursor-default">
              Ledger
            </span>
          ) : (
            <Link
              href="/ledger"
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
            >
              Ledger
            </Link>
          )}

          {activeTab === "policies" ? (
            <span className="text-on-surface font-semibold border-b-2 border-on-surface pb-1 -mb-[5px] cursor-default">
              Policies
            </span>
          ) : (
            <Link
              href="/policies"
              className="text-on-surface-variant hover:text-on-surface pb-1 transition-colors"
            >
              Policies
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Scenario Selector: available when onScenarioChange is provided */}
        {onScenarioChange && (
          <>
            <div className="flex items-center gap-1 bg-surface-muted/70 px-2 py-0.5 rounded border border-outline-dim text-[11px] font-mono">
              <span className="text-outline text-[10px] uppercase tracking-wider mr-1">Case:</span>
              {(["corrected", "delivered", "abstained"] as ScenarioKey[]).map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => onScenarioChange(scenario)}
                  className={`px-2 py-0.5 rounded transition-all capitalize text-[10px] ${
                    currentScenario === scenario
                      ? "bg-white text-on-surface font-semibold shadow-xs border border-outline-dim"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {scenario}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-outline-dim"></div>
          </>
        )}

        {/* Mode toggle: Customer / Reviewer */}
        {onViewModeChange && (
          <>
            <div className="flex items-center bg-surface-muted p-0.5 rounded border border-outline-dim text-[11px]">
              <button
                type="button"
                onClick={() => onViewModeChange("reviewer")}
                className={`px-3 py-1 font-medium rounded transition-all ${
                  viewMode === "reviewer"
                    ? "bg-white text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Reviewer
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("customer")}
                className={`px-3 py-1 font-medium rounded transition-all ${
                  viewMode === "customer"
                    ? "bg-white text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Customer
              </button>
            </div>
            <div className="h-4 w-px bg-outline-dim"></div>
          </>
        )}

        {/* Simulated failure chaos mode button */}
        {onChaosToggle ? (
          <button
            type="button"
            onClick={onChaosToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              chaosActive
                ? "bg-accent-rose-bg border-accent-rose text-accent-rose"
                : "bg-white border-outline-mid text-on-surface-variant hover:border-accent-rose hover:text-accent-rose"
            }`}
            title="Toggle Chaos Mode simulation (PRD Section 7.2)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-rose"></span>
            <span>{chaosActive ? "Simulated failure (Active)" : "Simulated failure"}</span>
          </button>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-outline-mid text-[11px] font-mono text-on-surface-variant bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
            <span>Simulated failure</span>
          </div>
        )}

        <div className="h-4 w-px bg-outline-dim"></div>

        {/* Engine live status indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
          <span className="text-accent-ochre">●</span>
          <span>Verification service · Connected</span>
        </div>
      </div>
    </header>
  );
};

