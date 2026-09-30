import { useState } from 'react';
import { askStream } from '@/lib/api';
import { RunResult, Claim, ClaimSpan } from '@/types/contracts';
import { ScenarioKey } from '@/lib/mockEvents';

export function useAsk() {
  const [run, setRun] = useState<RunResult | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string, chaos: boolean, scenario: ScenarioKey = "corrected") => {
    if (status === "running") return;
    setStatus("running");
    setError(null);
    setRun({
      run_id: "", question, chaos, draft: "", claims: [], final_draft: "", final_claims: [], final_answer: "", final_status: "DELIVERED", abstain_reason: null, retries: 0, latency_ms: {retrieve: 0, maker: 0, check: 0, judge: 0, correct: 0, total: 0}, tokens: {maker: 0, judge: 0}, policy_versions: {}, created_at: ""
    } as RunResult);
    
    try {
      const stream = askStream(question, chaos, scenario);
      for await (const msg of stream) {
        setRun(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          switch (msg.event) {
            case "run_started":
              next.run_id = msg.data.run_id;
              next.question = msg.data.question;
              next.chaos = msg.data.chaos;
              break;
            case "draft":
              next.draft = msg.data.text;
              next.final_draft = msg.data.text;
              break;
            case "claims":
              if (msg.data.attempt === 0) {
                next.claims = (msg.data.claims as ClaimSpan[]).map(c => ({...c, status: "UNSUPPORTED", checked_by: "llm", reason: "Pending check...", evidence: []} as Claim));
              }
              break;
            case "claim_checked":
              if (msg.data.attempt === 0) {
                const idx = next.claims.findIndex(c => c.id === msg.data.claim.id);
                if (idx !== -1) {
                  const newClaims = [...next.claims];
                  newClaims[idx] = msg.data.claim;
                  next.claims = newClaims;
                  next.final_claims = newClaims;
                }
              }
              break;
            case "correcting":
              next.retries = msg.data.attempt;
              break;
            case "corrected_draft":
              next.final_draft = msg.data.text;
              break;
            case "final":
              next.final_answer = msg.data.answer;
              next.final_status = msg.data.status;
              next.abstain_reason = msg.data.abstain_reason;
              break;
            case "run_finished":
              return msg.data.result;
            case "error":
              setError(`Error ${msg.data.code}: ${msg.data.message}`);
              setStatus("error");
              break;
          }
          return next;
        });

        if (msg.event === "error") {
          setStatus("error");
        } else if (msg.event === "run_finished") {
          setStatus("done");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to connect: ${err.message}`);
      } else {
        setError("An unknown error occurred");
      }
      setStatus("error");
    }
  };

  return { run, status, error, ask };
}
