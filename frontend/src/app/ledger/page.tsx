"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CleanRateChart } from "@/components/CleanRateChart";
import { RunLogTable } from "@/components/RunLogTable";
import { MOCK_LEDGER_RUNS, MOCK_LEDGER_SUMMARY } from "@/lib/mockLedger";

export default function LedgerPage() {
  const [isGauntletRunning, setIsGauntletRunning] = useState<boolean>(false);
  const [gauntletStatus, setGauntletStatus] = useState<string | null>(null);

  // Frontend mock interaction for "Run the gauntlet" (PRD Section 14 & MVP constraint 3)
  const handleRunGauntlet = () => {
    if (isGauntletRunning) return;
    setIsGauntletRunning(true);
    setGauntletStatus("Streaming benchmark evaluation: 40 cases across normal & chaos modes...");

    setTimeout(() => {
      setGauntletStatus("Evaluating policy assertions and numeric boundaries (0/40)...");
    }, 600);

    setTimeout(() => {
      setGauntletStatus("Evaluating policy assertions and numeric boundaries (24/40)...");
    }, 1300);

    setTimeout(() => {
      setIsGauntletRunning(false);
      setGauntletStatus("Gauntlet complete: 40/40 passed. Detection: 91.3% · False-approval: 0% · Accuracy: 95.0%");
    }, 2200);
  };

  // Support ⌘G / Ctrl+G keyboard shortcut matching Stitch design
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        handleRunGauntlet();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGauntletRunning]);

  return (
    <div className="bg-[#faf8f0] text-on-surface antialiased font-sans min-h-screen flex flex-col">
      {/* Reusable Header with Ledger active */}
      <Header activeTab="ledger" />

      {/* Main Content Workspace */}
      <main className="w-full flex-1 bg-[#fff8f0] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Editorial Summary Header */}
          <div className="w-full flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-12">
            <div className="max-w-3xl">
              <h1 className="font-editorial text-[2.25rem] text-on-surface leading-tight tracking-tight font-medium">
                {MOCK_LEDGER_SUMMARY.totalChecked} answers checked. {MOCK_LEDGER_SUMMARY.wrongDrafts} were wrong.{" "}
                <span className="inline-block text-[#ac3400] underline decoration-[#ac3400]/30 decoration-2 underline-offset-4">
                  {MOCK_LEDGER_SUMMARY.fixedCount} were fixed
                </span>
                ,{" "}
                <span className="inline-block text-[#ba1a1a] underline decoration-[#ba1a1a]/30 decoration-2 underline-offset-4">
                  {MOCK_LEDGER_SUMMARY.refusedCount} were refused
                </span>
                .
              </h1>
              <p className="font-mono text-[12px] text-on-surface-variant mt-3 tracking-tight">
                {MOCK_LEDGER_SUMMARY.caption}
              </p>

              {/* Gauntlet Status Feedback Box (Front-end mock interaction) */}
              {gauntletStatus && (
                <div className="mt-4 p-3 rounded bg-surface-muted border border-outline-dim font-mono text-[11px] text-on-surface flex items-center justify-between transition-all">
                  <div className="flex items-center gap-2">
                    {isGauntletRunning ? (
                      <span className="w-2 h-2 rounded-full bg-accent-ochre animate-pulse"></span>
                    ) : (
                      <span className="text-accent-green font-bold">✓</span>
                    )}
                    <span>{gauntletStatus}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGauntletStatus(null)}
                    className="text-outline hover:text-on-surface text-[10px] ml-3 px-1.5 py-0.5 rounded hover:bg-surface-dim"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Run the Gauntlet Action Button */}
            <div className="flex items-center lg:pt-1 self-start">
              <button
                type="button"
                onClick={handleRunGauntlet}
                disabled={isGauntletRunning}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-black text-white font-sans text-[13px] font-medium hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:opacity-70"
                title="Run benchmark gauntlet test suite (⌘G)"
              >
                <span className="material-symbols-outlined text-[17px] leading-none">
                  {isGauntletRunning ? "hourglass_top" : "terminal"}
                </span>
                <span>{isGauntletRunning ? "Evaluating..." : "Run the gauntlet"}</span>
                <span className="font-mono text-[10px] text-white/60 pl-1 border-l border-white/20">
                  ⌘G
                </span>
              </button>
            </div>
          </div>

          {/* First-Pass Clean Rate Rolling Line Chart */}
          <CleanRateChart />

          {/* Chronological Run Log Section */}
          <RunLogTable runs={MOCK_LEDGER_RUNS} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#faf8f0] border-t border-outline-dim py-5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-mono text-[11px] text-on-surface-variant">
            VeriTrust · Automated AI Verification Ledger · Verified against policy specifications
          </p>
          <div className="font-mono text-[10px] text-outline">
            Audit Ledger v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
