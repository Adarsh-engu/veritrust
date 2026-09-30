/**
 * MOCK / DEMO DATA FOR VERIFICATION LEDGER (AUDIT TRAIL)
 *
 * NOTE: These numbers and sample records are static demonstration data
 * prepared for UI review and testing. They are NOT live production metrics
 * computed from a live SQLite database.
 */

import { LedgerRunRecord, LedgerSummary, TrendPoint } from "@/types/ledger";

export const MOCK_LEDGER_SUMMARY: LedgerSummary = {
  isMockData: true,
  totalChecked: 142,
  wrongDrafts: 23,
  fixedCount: 21,
  refusedCount: 2,
  caption: "Measured on verified runs (Sample Demo Data).",
};

export const MOCK_TREND_POINTS: TrendPoint[] = [
  { runLabel: "Run #8890", ratePercent: 78, cx: 40, cy: 56, highlight: "normal" },
  { runLabel: "Run #8930", ratePercent: 54, cx: 220, cy: 92, highlight: "normal" },
  { runLabel: "Run #8955", ratePercent: 36, cx: 380, cy: 126, highlight: "error" },
  { runLabel: "Run #8970", ratePercent: 82, cx: 480, cy: 48, highlight: "normal" },
  { runLabel: "Run #8990", ratePercent: 80, cx: 660, cy: 52, highlight: "normal" },
  { runLabel: "Run #9010", ratePercent: 86, cx: 820, cy: 40, highlight: "normal" },
  { runLabel: "Run #9042", ratePercent: 87, cx: 960, cy: 38, highlight: "current" },
];

export const MOCK_LEDGER_RUNS: LedgerRunRecord[] = [
  {
    id: "#VC-9042",
    question: "Can I return opened headphones after 20 days?",
    timestamp: "14:22:08 IST",
    status: "CORRECTED",
    statusLabel: "Corrected",
    actionLabel: "Inspect redline",
    actionScenario: "corrected",
    rawProposition: {
      text: "You can return your WH-1000XM5 headphones within 30 days of unboxing provided the original packaging and all accessories are in intact shape.",
      highlightText: "30 days of unboxing",
      failedAssertion: "Maximum return window for opened audio electronics is capped at 15 days.",
    },
    reconciledRedline: {
      text: "Opened electronics can be returned within 15 days of purchase, so a 20-day-old purchase is outside the return window.",
      highlightText: "15 days of purchase",
      groundedChunk: "refund_policy.md#2",
      matchScore: 0.96,
      policySource: "refund_policy.md",
    },
  },
  {
    id: "#VC-9041",
    question: "How long does refund take for UPI payments?",
    timestamp: "14:18:45 IST",
    status: "PASSED",
    statusLabel: "Passed (1st pass)",
    actionLabel: "Open run",
    actionScenario: "delivered",
    rawProposition: {
      text: "Refunds for UPI payments are credited back within 2-3 business days.",
      failedAssertion: "None. All numeric assertions verified against payments policy.",
    },
    reconciledRedline: {
      text: "Refunds for UPI payments are credited back within 2-3 business days.",
      groundedChunk: "payments_policy.md#3",
      matchScore: 0.99,
      policySource: "payments_policy.md",
    },
  },
  {
    id: "#VC-9038",
    question: "Is liquid damage covered under laptop warranty?",
    timestamp: "13:50:12 IST",
    status: "REFUSED",
    statusLabel: "Refused (Abstain)",
    actionLabel: "Inspect redline",
    actionScenario: "abstained",
    rawProposition: {
      text: "Yes, incidental liquid contact is covered under our premium accidental protection tier.",
      highlightText: "incidental liquid contact is covered",
      failedAssertion: "Policy explicitly excludes liquid and physical damage from standard warranty.",
    },
    reconciledRedline: {
      text: "I couldn't verify this from VeriCorp's policies. Please contact support.",
      highlightText: "Safe Refusal Enforced",
      groundedChunk: "warranty_policy.md#4",
      matchScore: 0.91,
      policySource: "warranty_policy.md",
    },
  },
  {
    id: "#VC-9035",
    question: "Can I cancel order after dispatch notification?",
    timestamp: "12:15:33 IST",
    status: "CORRECTED",
    statusLabel: "Corrected",
    isSimulated: true,
    actionLabel: "Inspect redline",
    actionScenario: "corrected",
    rawProposition: {
      text: "Orders can be freely cancelled at any stage before final delivery handover.",
      highlightText: "freely cancelled at any stage",
      failedAssertion: "Once dispatched, cancellation requires refusal at doorstep or RMA request.",
    },
    reconciledRedline: {
      text: "Orders cannot be cancelled once dispatched; please refuse delivery or initiate a return upon receipt.",
      highlightText: "cannot be cancelled once dispatched",
      groundedChunk: "cancellation_policy.md#1",
      matchScore: 0.94,
      policySource: "cancellation_policy.md",
    },
  },
  {
    id: "#VC-9029",
    question: "What is express shipping charge for Bengaluru?",
    timestamp: "11:04:19 IST",
    status: "PASSED",
    statusLabel: "Passed (1st pass)",
    actionLabel: "Open run",
    actionScenario: "delivered",
    rawProposition: {
      text: "Express shipping costs ₹199 for intra-city delivery across Bengaluru.",
      failedAssertion: "None. Price ₹199 matches shipping policy exactly.",
    },
    reconciledRedline: {
      text: "Express shipping costs ₹199 for intra-city delivery across Bengaluru.",
      groundedChunk: "shipping_policy.md#2",
      matchScore: 1.0,
      policySource: "shipping_policy.md",
    },
  },
  {
    id: "#VC-9022",
    question: "Do you accept returns for opened silicone ear tips?",
    timestamp: "09:42:01 IST",
    status: "CORRECTED",
    statusLabel: "Corrected",
    actionLabel: "Inspect redline",
    actionScenario: "corrected",
    rawProposition: {
      text: "All audio accessories including replacement ear tips can be returned within 10 days.",
      highlightText: "including replacement ear tips",
      failedAssertion: "Hygiene products (in-ear tips) are non-returnable once the sealed blister is opened.",
    },
    reconciledRedline: {
      text: "For hygiene and sanitation reasons, opened in-ear silicone tips cannot be returned.",
      highlightText: "opened in-ear silicone tips cannot be returned",
      groundedChunk: "refund_policy.md#5",
      matchScore: 0.97,
      policySource: "refund_policy.md",
    },
  },
  {
    id: "#VC-9018",
    question: "Does laptop warranty extend to 2 years automatically?",
    timestamp: "08:19:14 IST",
    status: "PASSED",
    statusLabel: "Passed (1st pass)",
    actionLabel: "Open run",
    actionScenario: "delivered",
    rawProposition: {
      text: "VeriCorp laptops come with a standard 2-year manufacturer warranty from invoice date.",
      failedAssertion: "None. Duration 2 years matches warranty policy.",
    },
    reconciledRedline: {
      text: "VeriCorp laptops come with a standard 2-year manufacturer warranty from invoice date.",
      groundedChunk: "warranty_policy.md#1",
      matchScore: 0.98,
      policySource: "warranty_policy.md",
    },
  },
];
