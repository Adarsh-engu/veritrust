import rawEvents from "../../mocks/events.json";
import { MockScenarios, RunResult } from "@/types/contracts";

export type ScenarioKey = "corrected" | "delivered" | "abstained";

const typedMockData = rawEvents as unknown as MockScenarios;

export function getAvailableScenarios(): ScenarioKey[] {
  return ["corrected", "delivered", "abstained"];
}

export function getScenarioEvents(scenario: ScenarioKey) {
  return typedMockData.scenarios[scenario] || typedMockData.scenarios.corrected;
}

export function getScenarioRunResult(scenario: ScenarioKey): RunResult {
  const events = getScenarioEvents(scenario);
  const finishedEvent = events.find((e) => e.event === "run_finished");
  if (finishedEvent && finishedEvent.data && typeof finishedEvent.data === "object" && "result" in finishedEvent.data) {
    return (finishedEvent.data as { result: RunResult }).result;
  }

  // Fallback if not found
  return {
    run_id: "run-fallback",
    question: "Can I return opened headphones after 20 days?",
    chaos: true,
    draft: "Opened electronics can be returned within 30 days.",
    claims: [],
    final_draft: "Opened electronics can be returned within 15 days.",
    final_claims: [],
    final_answer: "Opened electronics can be returned within 15 days.",
    final_status: "CORRECTED",
    abstain_reason: null,
    retries: 1,
    latency_ms: {
      retrieve: 100,
      maker: 500,
      check: 50,
      judge: 0,
      correct: 600,
      total: 1250,
    },
    tokens: {
      maker: 100,
      judge: 0,
    },
    policy_versions: {
      "refund_policy.md": "v2",
    },
    created_at: new Date().toISOString(),
  };
}
