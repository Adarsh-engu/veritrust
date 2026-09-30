import { ServerEvent, RunResult } from "@/types/contracts";

export async function* askStream(
  question: string,
  chaos: boolean,
  mockScenario: "corrected" | "delivered" | "abstained" = "corrected"
): AsyncGenerator<ServerEvent, void, unknown> {
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  if (useMocks) {
    const rawEvents = (await import("../../mocks/events.json")).default;
    const scenarios = rawEvents.scenarios;
    const events = scenarios[mockScenario] as ServerEvent[];

    for (const event of events) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 200));
      yield event;
    }
    return;
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ask`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, chaos }),
  });

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Parse SSE format
    while (true) {
      const doubleNewlineIdx = buffer.indexOf("\n\n");
      if (doubleNewlineIdx === -1) break; // incomplete chunk

      const chunk = buffer.slice(0, doubleNewlineIdx);
      buffer = buffer.slice(doubleNewlineIdx + 2);

      let currentEvent = "";
      let currentData = "";

      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData += line.slice(6).trim();
        }
      }

      if (currentEvent && currentData) {
        try {
          const parsedData = JSON.parse(currentData);
          yield { event: currentEvent, data: parsedData } as ServerEvent;
        } catch (err) {
          console.error("Failed to parse event data", currentData, err);
        }
      }
    }
  }
}

export function getMockRunResult(scenario: "corrected" | "delivered" | "abstained"): RunResult {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const rawEvents = require("../../mocks/events.json");
    const events = rawEvents.scenarios[scenario] as ServerEvent[];
    const finished = events?.find((e): e is Extract<ServerEvent, { event: "run_finished" }> => e.event === "run_finished");
    if (finished) return finished.data.result;
  }
  return {
    run_id: "run-fallback", question: "Can I return opened headphones after 20 days?", chaos: true, draft: "Opened electronics can be returned within 30 days.", claims: [], final_draft: "Opened electronics can be returned within 15 days.", final_claims: [], final_answer: "Opened electronics can be returned within 15 days.", final_status: "CORRECTED", abstain_reason: null, retries: 1, latency_ms: { retrieve: 100, maker: 500, check: 50, judge: 0, correct: 600, total: 1250 }, tokens: { maker: 100, judge: 0 }, policy_versions: { "refund_policy.md": "v2" }, created_at: new Date().toISOString()
  };
}
