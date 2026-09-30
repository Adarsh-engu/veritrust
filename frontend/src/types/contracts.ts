export type ClaimStatus = "SUPPORTED" | "CONTRADICTED" | "UNSUPPORTED";
export type FinalStatus = "DELIVERED" | "CORRECTED" | "ABSTAINED";
export type CheckedBy = "deterministic" | "llm";
export type AbstainReason = "UNSUPPORTED" | "RETRY_CAP" | "SYSTEM_ERROR";

export const ABSTAIN_MESSAGE = "I couldn't verify this from VeriCorp's policies. Please contact support.";

export interface Evidence {
  source: string;
  version: string;
  text: string;
  chunk_id: string;
}

export interface ClaimSpan {
  id: number;
  text: string;
  start: number;
  end: number;
}

export interface Claim extends ClaimSpan {
  status: ClaimStatus;
  checked_by: CheckedBy;
  reason: string;
  evidence: Evidence[];
}

export interface JudgeOutput {
  status: ClaimStatus;
  reason: string;
  evidence_ids: string[];
}

export interface RunResult {
  run_id: string;
  question: string;
  chaos: boolean;
  draft: string;
  claims: Claim[];
  final_draft: string;
  final_claims: Claim[];
  final_answer: string;
  final_status: FinalStatus;
  abstain_reason: AbstainReason | null;
  retries: number;
  latency_ms: {
    retrieve: number;
    maker: number;
    check: number;
    judge: number;
    correct: number;
    total: number;
    [key: string]: number;
  };
  tokens: {
    maker: number;
    judge: number;
    [key: string]: number;
  };
  policy_versions: Record<string, string>;
  created_at: string;
}

export type SSEEventName =
  | "run_started"
  | "retrieved"
  | "draft"
  | "claims"
  | "claim_checked"
  | "correcting"
  | "corrected_draft"
  | "final"
  | "run_finished"
  | "error";

export interface EventRunStarted {
  run_id: string;
  question: string;
  chaos: boolean;
}

export interface EventRetrieved {
  evidence: Evidence[];
}

export interface EventDraft {
  text: string;
}

export interface EventClaims {
  attempt: number;
  claims: ClaimSpan[];
}

export interface EventClaimChecked {
  attempt: number;
  claim: Claim;
}

export interface EventCorrecting {
  attempt: number;
  feedback: string;
}

export interface EventCorrectedDraft {
  attempt: number;
  text: string;
}

export interface EventFinal {
  answer: string;
  status: FinalStatus;
  abstain_reason: AbstainReason | null;
}

export interface EventRunFinished {
  result: RunResult;
}

export interface EventError {
  code: "BUSY" | "OLLAMA_DOWN" | "TIMEOUT" | "INTERNAL";
  message: string;
}

export type ServerEvent =
  | { event: "run_started"; data: EventRunStarted }
  | { event: "retrieved"; data: EventRetrieved }
  | { event: "draft"; data: EventDraft }
  | { event: "claims"; data: EventClaims }
  | { event: "claim_checked"; data: EventClaimChecked }
  | { event: "correcting"; data: EventCorrecting }
  | { event: "corrected_draft"; data: EventCorrectedDraft }
  | { event: "final"; data: EventFinal }
  | { event: "run_finished"; data: EventRunFinished }
  | { event: "error"; data: EventError };

export interface MockScenarios {
  scenarios: {
    corrected: ServerEvent[];
    delivered: ServerEvent[];
    abstained: ServerEvent[];
  };
}
