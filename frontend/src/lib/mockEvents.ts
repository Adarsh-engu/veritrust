import { RunResult } from "@/types/contracts";
import { getMockRunResult } from "./api";

export type ScenarioKey = "corrected" | "delivered" | "abstained";

export function getScenarioRunResult(scenario: ScenarioKey): RunResult {
  return getMockRunResult(scenario);
}
