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
  // Fallback hardcoded result — used when mocks are disabled or events.json has no run_finished
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
    latency_ms: { retrieve: 100, maker: 500, check: 50, judge: 0, correct: 600, total: 1250 },
    tokens: { maker: 100, judge: 0 },
    policy_versions: { "refund_policy.md": "v1" },
    created_at: new Date().toISOString(),
  };
}


const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMetrics() {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { MOCK_LEDGER_SUMMARY } = await import("./mockLedger");
    return MOCK_LEDGER_SUMMARY;
  }
  const res = await fetch(`${getBaseUrl()}/api/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchRuns(limit: number = 20, offset: number = 0, source?: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { MOCK_LEDGER_RUNS } = await import("./mockLedger");
    return MOCK_LEDGER_RUNS;
  }
  let url = `${getBaseUrl()}/api/runs?limit=${limit}&offset=${offset}`;
  if (source) url += `&source=${source}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function fetchRunById(id: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { MOCK_LEDGER_RUNS } = await import("./mockLedger");
    return MOCK_LEDGER_RUNS.find(r => r.id === id);
  }
  const res = await fetch(`${getBaseUrl()}/api/runs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch run");
  return res.json();
}

export async function fetchPolicies() {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { MOCK_POLICIES } = await import("./mockPolicies");
    return MOCK_POLICIES;
  }
  const res = await fetch(`${getBaseUrl()}/api/policies`);
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

export async function fetchPolicyByName(name: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { MOCK_POLICIES } = await import("./mockPolicies");
    return MOCK_POLICIES.find(p => p.id === name);
  }
  const res = await fetch(`${getBaseUrl()}/api/policies/${name}`);
  if (!res.ok) throw new Error("Failed to fetch policy");
  return res.json();
}

export async function updatePolicy(name: string, text: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { name, version: "v9.9", stale_run_ids: [] };
  }
  const res = await fetch(`${getBaseUrl()}/api/policies/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error("Failed to update policy");
  return res.json();
}

export async function fetchBenchmarkLatest() {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    return { cases: [], summary: { passed: 40, total: 40, detection: 91.3, false_approval: 0, accuracy: 95.0 } };
  }
  const res = await fetch(`${getBaseUrl()}/api/benchmark/latest`);
  if (!res.ok) throw new Error("Failed to fetch benchmark latest");
  return res.json();
}

export async function* benchmarkStream(modes: string[]): AsyncGenerator<any, void, unknown> {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    // Mock simulation
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 50));
      yield { event: "case_result", data: { id: i, status: "PASSED" } };
    }
    yield { event: "summary", data: { passed: 40, total: 40, detection: 91.3, false_approval: 0, accuracy: 95.0 } };
    return;
  }
  const res = await fetch(`${getBaseUrl()}/api/benchmark/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modes })
  });
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    while (true) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let ev = "", data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) ev = line.slice(7).trim();
        else if (line.startsWith("data: ")) data += line.slice(6).trim();
      }
      if (ev && data) yield { event: ev, data: JSON.parse(data) };
    }
  }
}

