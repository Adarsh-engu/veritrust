"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Timeline } from "@/components/Timeline";
import { CustomerQuestion } from "@/components/CustomerQuestion";
import { DocumentReview } from "@/components/DocumentReview";
import { EvidenceRail } from "@/components/EvidenceRail";
import { getScenarioRunResult, ScenarioKey } from "@/lib/mockEvents";
import { useAsk } from "@/hooks/useAsk";
import { AskBar } from "@/components/AskBar";

export default function ReviewPage() {
  const [currentScenario, setCurrentScenario] = useState<ScenarioKey>("corrected");
  const [viewMode, setViewMode] = useState<"reviewer" | "customer">("reviewer");
  const [chaosActive, setChaosActive] = useState<boolean>(true);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Load the current scenario run result from frozen mocks/events.json
  const mockResult = React.useMemo(() => {
    return getScenarioRunResult(currentScenario);
  }, [currentScenario]);

  const { run, status, error, ask, currentStage, stageStatuses } = useAsk();

  // Use live run if available, else mock
  const runResult = run || mockResult;

  const handleScenarioChange = (scenario: ScenarioKey) => {
    setCurrentScenario(scenario);
    setChaosActive(scenario === "corrected");
    setSelectedClaimId(null);
  };

  const handleChaosToggle = () => {
    setChaosActive((prev) => !prev);
  };

  const handleSelectClaim = (id: string) => {
    setSelectedClaimId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-[#faf8f0] text-on-surface antialiased font-sans h-screen flex flex-col overflow-hidden">
      {/* Top navigation bar */}
      <Header
        activeTab="review"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        chaosActive={chaosActive}
        onChaosToggle={handleChaosToggle}
        currentScenario={currentScenario}
        onScenarioChange={handleScenarioChange}
      />

      {/* Main three-column workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Column 1: Left live timeline */}
        <Timeline
          runResult={runResult}
          stageStatuses={status === "running" || status === "done" ? stageStatuses : undefined}
          currentStage={currentStage}
        />

        {/* Column 2: Central document */}
        <section className="flex-1 overflow-y-auto px-8 py-8 flex flex-col items-center bg-[#fff8f0]">
          <div className="w-full max-w-[720px] flex flex-col gap-6">
            <AskBar
              status={status}
              error={error}
              onAsk={(q) => {
                setSelectedClaimId(null);
                ask(q, chaosActive, currentScenario);
              }}
            />

            {runResult && (
              <>
                <CustomerQuestion
                  question={runResult.question}
                  isChaos={runResult.chaos ?? chaosActive}
                />

                <DocumentReview
                  runResult={runResult}
                  viewMode={viewMode}
                  onSelectClaim={handleSelectClaim}
                  selectedClaimId={selectedClaimId}
                />
              </>
            )}
          </div>
        </section>

        {/* Column 3: Right evidence & claims rail */}
        <EvidenceRail
          runResult={runResult}
          selectedClaimId={selectedClaimId}
          onCardClick={handleSelectClaim}
        />
      </main>
    </div>
  );
}
