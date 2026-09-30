/**
 * FRONTEND DEMO / MOCK POLICIES
 *
 * NOTE: This file contains purely local frontend demonstration data for UI review.
 * It is NOT connected to ChromaDB, SQLite, Supabase, FastAPI, or any live policy runtime.
 * In a full production implementation, these values will be queried from the backend
 * via GET /api/policies and GET /api/policies/{name}.
 */

import { PolicyDocument } from "@/types/policy";

export const MOCK_POLICIES: PolicyDocument[] = [
  {
    id: "refund_policy.md",
    name: "refund_policy.md",
    version: "v1.4",
    updatedAt: "2025-02-14 09:30 UTC",
    summary: "Returns, store credits & electronics return SLA",
    subtitle: "Consumer electronics, audio devices, packaging criteria, and automated settlement windows.",
    reviewsGroundedCount: 142,
    chunksCount: 5,
    staleRunsCount: 18,
    markdownContent: `# REFUND & RETURN POLICY SPECIFICATION (v1.4)

## 1. General Return Window & Conditions
Standard merchandise may be returned within 30 days of documented delivery date, subject to original condition and proof of purchase. Refunds will be credited to the original payment method within 5–7 business days following intake inspection.

## 2. Returns for Opened Electronics & Headphones
Opened electronics, audio gear, and headphones can be returned within 15 days of purchase, provided all original packaging, cords, and purchase receipts are intact.

Returns initiated after this 15-day window are strictly ineligible for refund and are subject exclusively to manufacturer warranty inspection and repair procedures.

## 3. Hygiene Exclusions & Sealed Products
In-ear silicone tips, opened hygiene-sealed accessories, and personalized items cannot be accepted for refund once unsealed, unless verified defective upon initial unboxing by an authorized technician.

## 4. UPI & Digital Payment Processing SLA
Refund transactions issued via UPI networks settle within 24 to 48 hours of inspection clearance. Bank wire transfers require 3 to 5 banking days depending on destination clearing protocol.`,
    chunks: [
      {
        id: "Chunk #1",
        sectionLabel: "§1. General Return Window",
        title: "1. General Return Window & Conditions",
        content:
          "Standard merchandise may be returned within 30 days of documented delivery date, subject to original condition and proof of purchase. Refunds will be credited to the original payment method within 5–7 business days following intake inspection.",
      },
      {
        id: "Chunk #3",
        sectionLabel: "refund_policy.md",
        title: "2. Returns for Opened Electronics & Headphones",
        isGroundTruthAnchor: true,
        anchorRunRef: "Referenced by Run #9042",
        anchorClaimRef: "Target: Claim #ref_01",
        content:
          "Opened electronics, audio gear, and headphones can be returned within 15 days of purchase, provided all original packaging, cords, and purchase receipts are intact. Returns initiated after this 15-day window are strictly ineligible for refund and are subject exclusively to manufacturer warranty inspection and repair procedures.",
        highlightText: "can be returned within 15 days of purchase",
        ineligibleText: "strictly ineligible for refund",
        footnote:
          "Ground truth for redline correction (15 days vs model hallucination of 30 days)",
      },
      {
        id: "Chunk #4",
        sectionLabel: "§3. Hygiene Exclusions",
        title: "3. Hygiene Exclusions & Sealed Products",
        content:
          "In-ear silicone tips, opened hygiene-sealed accessories, and personalized items cannot be accepted for refund once unsealed, unless verified defective upon initial unboxing by an authorized technician.",
      },
      {
        id: "Chunk #5",
        sectionLabel: "§4. Settlement SLAs",
        title: "4. UPI & Digital Payment Processing SLA",
        content:
          "Refund transactions issued via UPI networks settle within 24 to 48 hours of inspection clearance. Bank wire transfers require 3 to 5 banking days depending on destination clearing protocol.",
      },
    ],
  },
  {
    id: "warranty_policy.md",
    name: "warranty_policy.md",
    version: "v2.1",
    updatedAt: "2025-01-20 14:15 UTC",
    summary: "Hardware repairs, defect coverage & exclusions",
    subtitle: "Manufacturer limited warranty, defect coverage periods, and accidental damage exclusions.",
    reviewsGroundedCount: 89,
    chunksCount: 8,
    staleRunsCount: 7,
    markdownContent: `# WARRANTY POLICY SPECIFICATION (v2.1)

## 1. Laptop & Hardware Warranty
VeriCorp laptops come with a standard 2-year manufacturer warranty from invoice date covering internal component defects.

## 2. Accidental & Liquid Damage Exclusions
Liquid spills, immersion, cosmetic wear, and third-party unauthorized repairs are strictly excluded from warranty coverage.`,
    chunks: [
      {
        id: "Chunk #1",
        sectionLabel: "§1. Hardware Warranty",
        title: "1. Laptop & Hardware Warranty",
        content:
          "VeriCorp laptops come with a standard 2-year manufacturer warranty from invoice date covering internal component defects.",
      },
      {
        id: "Chunk #4",
        sectionLabel: "§2. Exclusions",
        title: "2. Accidental & Liquid Damage Exclusions",
        content:
          "Liquid spills, immersion, cosmetic wear, and third-party unauthorized repairs are strictly excluded from warranty coverage.",
      },
    ],
  },
  {
    id: "shipping_policy.md",
    name: "shipping_policy.md",
    version: "v1.8",
    updatedAt: "2025-02-01 11:00 UTC",
    summary: "Fulfillment, dispatch timelines & transit SLAs",
    subtitle: "Standard delivery timelines, intra-city express dispatch, and courier tracking commitments.",
    reviewsGroundedCount: 64,
    chunksCount: 6,
    staleRunsCount: 4,
    markdownContent: `# SHIPPING POLICY SPECIFICATION (v1.8)

## 1. Standard Shipping Timeline
Standard shipping takes 3-5 business days across all domestic postal zones.

## 2. Intra-city Express Delivery
Express shipping costs ₹199 for intra-city delivery across Bengaluru, guaranteed next-day arrival.`,
    chunks: [
      {
        id: "Chunk #1",
        sectionLabel: "§1. Standard Shipping",
        title: "1. Standard Shipping Timelines",
        content: "Standard shipping takes 3-5 business days across all domestic postal zones.",
      },
      {
        id: "Chunk #2",
        sectionLabel: "§2. Express Dispatch",
        title: "2. Intra-city Express Delivery",
        content: "Express shipping costs ₹199 for intra-city delivery across Bengaluru, guaranteed next-day arrival.",
      },
    ],
  },
  {
    id: "cancellation_policy.md",
    name: "cancellation_policy.md",
    version: "v1.2",
    updatedAt: "2025-01-10 16:45 UTC",
    summary: "Order cancellation windows & merchant recalls",
    subtitle: "Pre-dispatch automated cancellations, doorstep refusal guidelines, and restocking policies.",
    reviewsGroundedCount: 41,
    chunksCount: 4,
    staleRunsCount: 3,
    markdownContent: `# CANCELLATION POLICY SPECIFICATION (v1.2)

## 1. Order Cancellation Window
Orders can be cancelled before dispatch without fee. Once handed to the courier, cancellation requires refusal upon delivery attempt.`,
    chunks: [
      {
        id: "Chunk #1",
        sectionLabel: "§1. Cancellation Window",
        title: "1. Order Cancellation Windows",
        content: "Orders can be cancelled before dispatch without fee. Once handed to the courier, cancellation requires refusal upon delivery attempt.",
      },
    ],
  },
  {
    id: "payments_policy.md",
    name: "payments_policy.md",
    version: "v1.5",
    updatedAt: "2025-02-10 18:20 UTC",
    summary: "UPI, card refunds & digital settlement timelines",
    subtitle: "Accepted gateway payment modes, settlement windows, and zero-fee UPI reversal rules.",
    reviewsGroundedCount: 118,
    chunksCount: 5,
    staleRunsCount: 12,
    markdownContent: `# PAYMENTS POLICY SPECIFICATION (v1.5)

## 1. UPI & Digital Payments
We accept UPI, all major domestic debit/credit cards, and net banking. Cash on delivery is not supported.

## 2. Settlement Reversals
UPI refunds are credited back to the source account within 2-3 business days.`,
    chunks: [
      {
        id: "Chunk #1",
        sectionLabel: "§1. Accepted Methods",
        title: "1. Payment Gateways",
        content: "We accept UPI, all major domestic debit/credit cards, and net banking. Cash on delivery is not supported.",
      },
      {
        id: "Chunk #3",
        sectionLabel: "§2. UPI Reversals",
        title: "2. Settlement Timelines",
        content: "UPI refunds are credited back to the source account within 2-3 business days.",
      },
    ],
  },
  {
    id: "support_policy.md",
    name: "support_policy.md",
    version: "v1.1",
    updatedAt: "2024-12-05 10:00 UTC",
    summary: "Tier-1 triage channels & response commitments",
    subtitle: "Support desk hours, customer escalation tiers, and response SLAs for ticketed grievances.",
    reviewsGroundedCount: 27,
    chunksCount: 3,
    staleRunsCount: 2,
    markdownContent: `# SUPPORT POLICY SPECIFICATION (v1.1)

## 1. Customer Support SLA
Our digital support desk operates Monday through Saturday, 9 AM to 8 PM IST. Chat inquiries receive a verified resolution within 15 minutes.`,
    chunks: [
      {
        id: "Chunk #1",
        sectionLabel: "§1. Operating Hours",
        title: "1. Digital Support Hours",
        content: "Our digital support desk operates Monday through Saturday, 9 AM to 8 PM IST. Chat inquiries receive a verified resolution within 15 minutes.",
      },
    ],
  },
];
