"use client";

import React, { useState } from "react";
import { PolicyDocument } from "@/types/policy";

interface PolicySourcesRailProps {
  policies: PolicyDocument[];
  selectedPolicyId: string;
  onSelectPolicy: (id: string) => void;
}

export const PolicySourcesRail: React.FC<PolicySourcesRailProps> = ({
  policies,
  selectedPolicyId,
  onSelectPolicy,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPolicies = policies.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name ?? "").toLowerCase().includes(term) ||
      (p.summary ?? "").toLowerCase().includes(term) ||
      (p.version ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <aside className="lg:col-span-4 flex flex-col gap-4 bg-white p-4 rounded-lg border border-outline-dim shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">
          Policy Sources
        </span>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-muted text-on-surface-variant">
          {policies.length} Registered
        </span>
      </div>

      {/* Filter Search Bar */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter source markdown files..."
          className="w-full pl-8 pr-3 py-1.5 bg-surface-muted/60 font-mono text-[11px] text-on-surface rounded placeholder:text-outline focus:outline-none focus:bg-white border border-outline-dim transition-colors"
        />
      </div>

      {/* Documents List */}
      <div className="flex flex-col gap-2">
        {filteredPolicies.map((policy) => {
          const isSelected = selectedPolicyId === policy.id;
          return (
            <div
              key={policy.id}
              onClick={() => onSelectPolicy(policy.id)}
              className={`group cursor-pointer p-3 rounded transition-all flex flex-col gap-1 border ${
                isSelected
                  ? "bg-surface-muted/70 text-on-surface border-l-2 border-l-accent-ochre border-outline-dim shadow-xs"
                  : "bg-white hover:bg-surface-muted/30 text-on-surface border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] font-semibold text-on-surface flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      isSelected ? "text-accent-ochre" : "text-outline"
                    }`}
                  >
                    description
                  </span>
                  {policy.name}
                </span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isSelected
                      ? "bg-accent-ochre-bg text-accent-ochre border border-accent-ochre-border"
                      : "bg-surface-muted text-on-surface-variant"
                  }`}
                >
                  ● Current
                </span>
              </div>

              <p className="font-sans text-[12px] text-on-surface-variant line-clamp-1">
                {policy.summary}
              </p>

              <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-surface-dim font-mono text-[10px]">
                <span className="text-outline">
                  {policy.version} · {policy.chunksCount} chunks
                </span>
                <span className={`${isSelected ? "text-accent-ochre font-medium" : "text-outline"}`}>
                  {policy.reviewsGroundedCount} reviews grounded
                </span>
              </div>
            </div>
          );
        })}

        {filteredPolicies.length === 0 && (
          <div className="p-4 text-center font-mono text-[11px] text-outline">
            No matching policies found.
          </div>
        )}
      </div>

      {/* Rail Footer Details */}
      <div className="pt-2 flex flex-col gap-1 bg-surface-muted/50 p-3 rounded border border-outline-dim/70">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-mono text-[10px] font-semibold uppercase">
            Grounding Knowledge Base
          </span>
          <span className="font-mono text-[10px] text-accent-ochre font-medium">
            {policies.length} / {policies.length} Active
          </span>
        </div>
        <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
          All production model endpoints reference these authoritative specifications as source truth.
        </p>
      </div>
    </aside>
  );
};
