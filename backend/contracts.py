from typing import Literal, Optional
from pydantic import BaseModel, model_validator

ClaimStatus   = Literal["SUPPORTED", "CONTRADICTED", "UNSUPPORTED"]
FinalStatus   = Literal["DELIVERED", "CORRECTED", "ABSTAINED"]
CheckedBy     = Literal["deterministic", "llm"]
AbstainReason = Literal["UNSUPPORTED", "RETRY_CAP", "SYSTEM_ERROR"]

ABSTAIN_MESSAGE = "I couldn't verify this from VeriCorp's policies. Please contact support."

class Evidence(BaseModel):
    """Evidence chunk retrieved from policy documents."""
    source: str
    version: str
    text: str
    chunk_id: str

class ClaimSpan(BaseModel):
    """Character span of a claim within a draft."""
    id: int
    text: str
    start: int
    end: int

class Claim(ClaimSpan):
    """A claim checked against evidence."""
    status: ClaimStatus
    checked_by: CheckedBy
    reason: str
    evidence: list[Evidence]

class JudgeOutput(BaseModel):
    """Output schema for the LLM judge."""
    status: ClaimStatus
    reason: str
    evidence_ids: list[str]

class RunResult(BaseModel):
    """Final result of a pipeline run."""
    run_id: str
    question: str
    chaos: bool
    draft: str
    claims: list[Claim]
    final_draft: str
    final_claims: list[Claim]
    final_answer: str
    final_status: FinalStatus
    abstain_reason: Optional[AbstainReason] = None
    retries: int
    latency_ms: dict[str, int]
    tokens: dict[str, int]
    policy_versions: dict[str, str]
    created_at: str

    @model_validator(mode='after')
    def validate_spans_and_statuses(self) -> 'RunResult':
        # 1. Spans match draft
        for c in self.claims:
            if self.draft[c.start:c.end] != c.text:
                raise ValueError(f"Claim {c.id} span mismatch in draft")
        for c in self.final_claims:
            if self.final_draft[c.start:c.end] != c.text:
                raise ValueError(f"Claim {c.id} span mismatch in final_draft")

        # 2. DELIVERED invariant
        if self.final_status == "DELIVERED":
            if self.retries != 0:
                raise ValueError("DELIVERED must have retries == 0")
            if self.final_answer != self.draft:
                raise ValueError("DELIVERED final_answer must equal draft")
            if not all(c.status == "SUPPORTED" for c in self.final_claims):
                raise ValueError("DELIVERED must have all final_claims SUPPORTED")
            if self.abstain_reason is not None:
                raise ValueError("DELIVERED cannot have abstain_reason")

        # 3. CORRECTED invariant
        if self.final_status == "CORRECTED":
            if not (1 <= self.retries <= 2):
                raise ValueError("CORRECTED must have 1 <= retries <= 2")
            if self.final_answer != self.final_draft or self.final_answer == self.draft:
                raise ValueError("CORRECTED final_answer must equal final_draft and differ from draft")
            if not all(c.status == "SUPPORTED" for c in self.final_claims):
                raise ValueError("CORRECTED must have all final_claims SUPPORTED")
            if self.abstain_reason is not None:
                raise ValueError("CORRECTED cannot have abstain_reason")

        # 4. ABSTAINED invariant
        if self.final_status == "ABSTAINED":
            if self.final_answer != ABSTAIN_MESSAGE:
                raise ValueError("ABSTAINED final_answer must be ABSTAIN_MESSAGE")
            if self.abstain_reason is None:
                raise ValueError("ABSTAINED must have abstain_reason set")

        # 5. retries <= 2
        if self.retries > 2:
            raise ValueError("retries must be <= 2")

        return self

# SSE Event Models
class RunStartedEvent(BaseModel):
    """Event indicating a run has started."""
    question: str
    chaos: bool

class RetrievedEvent(BaseModel):
    """Event indicating evidence has been retrieved."""
    evidence: list[Evidence]

class DraftEvent(BaseModel):
    """Event providing the first Maker draft."""
    text: str

class ClaimsEvent(BaseModel):
    """Event providing the list of claim spans."""
    attempt: int
    claims: list[ClaimSpan]

class ClaimCheckedEvent(BaseModel):
    """Event providing the checked result of a single claim."""
    attempt: int
    claim: Claim

class CorrectingEvent(BaseModel):
    """Event indicating the system is correcting a draft."""
    attempt: int
    feedback: str

class CorrectedDraftEvent(BaseModel):
    """Event providing a corrected draft."""
    attempt: int
    text: str

class FinalEvent(BaseModel):
    """Event providing the final answer and status."""
    answer: str
    status: FinalStatus
    abstain_reason: Optional[AbstainReason] = None

class RunFinishedEvent(BaseModel):
    """Event providing the complete run result."""
    result: RunResult

class ErrorEvent(BaseModel):
    """Event indicating an error occurred."""
    code: Literal["BUSY", "OLLAMA_DOWN", "TIMEOUT", "INTERNAL"]
    message: str

def format_sse_event(name: str, data: BaseModel) -> str:
    """Serializes an event to the SSE wire format."""
    return f"event: {name}\ndata: {data.model_dump_json()}\n\n"
