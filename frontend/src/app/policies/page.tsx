"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { PolicySourcesRail } from "@/components/PolicySourcesRail";
import { PolicyReader } from "@/components/PolicyReader";
import { PolicyEditor } from "@/components/PolicyEditor";
import { MOCK_POLICIES } from "@/lib/mockPolicies";
import { PolicyDocument } from "@/types/policy";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyDocument[]>(MOCK_POLICIES);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("refund_policy.md");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [stalePolicies, setStalePolicies] = useState<Record<string, boolean>>({
    "refund_policy.md": true, // Pre-seeded demonstration of the PRD Section 14 stale-run banner
  });
  const [previousVersions, setPreviousVersions] = useState<Record<string, string>>({
    "refund_policy.md": "v1.4",
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isReindexing, setIsReindexing] = useState<boolean>(false);

  const selectedPolicy =
    policies.find((p) => p.id === selectedPolicyId) || policies[0];

  const handleSelectPolicy = (id: string) => {
    setSelectedPolicyId(id);
    setMode("view");
  };

  const handleSaveDraft = (newContent: string) => {
    setIsSaving(true);

    setTimeout(() => {
      // Calculate simulated next version in local React state (e.g. v1.4 -> v1.5)
      const versionParts = selectedPolicy.version.replace("v", "").split(".");
      const nextMinor = versionParts.length > 1 ? parseInt(versionParts[1], 10) + 1 : 1;
      const nextVersion = `v${versionParts[0]}.${nextMinor}`;

      setPreviousVersions((prev) => ({
        ...prev,
        [selectedPolicy.id]: selectedPolicy.version,
      }));

      setPolicies((prev) =>
        prev.map((p) =>
          p.id === selectedPolicy.id
            ? {
                ...p,
                version: nextVersion,
                updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC",
                markdownContent: newContent,
              }
            : p
        )
      );

      // Trigger the PRD Section 14 stale runs banner for this policy
      setStalePolicies((prev) => ({
        ...prev,
        [selectedPolicy.id]: true,
      }));

      setIsSaving(false);
      setMode("view");
    }, 600);
  };

  const handleReindex = () => {
    if (isReindexing) return;
    setIsReindexing(true);
    setTimeout(() => {
      setIsReindexing(false);
    }, 700);
  };

  return (
    <div className="bg-[#faf8f0] text-on-surface antialiased font-sans min-h-screen flex flex-col">
      {/* Reusable Header with Policies active */}
      <Header activeTab="policies" />

      {/* Main Workspace */}
      <main className="w-full flex-1 bg-[#fff8f0] overflow-y-auto">
        <div className="w-full px-6 py-6 max-w-[1440px] mx-auto flex flex-col gap-6">
          {/* Breadcrumb Context Bar matching Stitch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-dim">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="uppercase tracking-wider text-accent-ochre font-semibold">
                Grounding Engine
              </span>
              <span className="text-outline">/</span>
              <span className="uppercase tracking-wider text-on-surface font-semibold">
                Policies
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-ochre animate-pulse"></span>
                Authoritative Policy Runtime · {policies.length} policies active (Demo Mode)
              </span>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Policy Sources Rail (col-span-4 on lg) */}
            <PolicySourcesRail
              policies={policies}
              selectedPolicyId={selectedPolicyId}
              onSelectPolicy={handleSelectPolicy}
            />

            {/* RIGHT COLUMN: Authoritative Policy Reader & Markdown Studio (col-span-8 on lg) */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              {mode === "view" ? (
                <PolicyReader
                  policy={selectedPolicy}
                  isStale={!!stalePolicies[selectedPolicy.id]}
                  previousVersion={previousVersions[selectedPolicy.id] || "v1.4"}
                  mode={mode}
                  onModeChange={setMode}
                  onReindex={handleReindex}
                  isReindexing={isReindexing}
                />
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Keep the Header Bar visible during edit mode as well */}
                  <PolicyReader
                    policy={selectedPolicy}
                    isStale={!!stalePolicies[selectedPolicy.id]}
                    previousVersion={previousVersions[selectedPolicy.id] || "v1.4"}
                    mode={mode}
                    onModeChange={setMode}
                    onReindex={handleReindex}
                    isReindexing={isReindexing}
                  />
                  <PolicyEditor
                    policy={selectedPolicy}
                    onSaveDraft={handleSaveDraft}
                    onCancel={() => setMode("view")}
                    isSaving={isSaving}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#faf8f0] border-t border-outline-dim py-5">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-mono text-[11px] text-on-surface-variant">
          <p>VeriTrust · Automated AI Verification Ledger · Verified against policy specifications</p>
          <div className="text-outline text-[10px]">
            Policy Runtime Engine v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
