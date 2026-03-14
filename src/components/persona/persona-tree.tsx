"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { ChevronDown, CircleDot } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  role: string;
  tier: string;
  description: string;
  capabilities: string;
  writePermissions: string;
}

interface TaskAssignment {
  personaId: string;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
}

interface PersonaTreeProps {
  personas: Persona[];
  assignments: TaskAssignment[];
  selectedId: string | null;
  onSelect: (persona: Persona) => void;
}

const TIER_ORDER = ["lead", "senior", "mid", "junior"];
const TIER_COLORS: Record<string, string> = {
  lead: "text-[var(--accent-primary)]",
  senior: "text-blue-400",
  mid: "text-green-400",
  junior: "text-yellow-400",
};

export function PersonaTree({
  personas,
  assignments,
  selectedId,
  onSelect,
}: PersonaTreeProps) {
  // Group by tier
  const grouped = new Map<string, Persona[]>();
  for (const tier of TIER_ORDER) {
    grouped.set(
      tier,
      personas.filter((p) => p.tier === tier)
    );
  }

  return (
    <div className="space-y-6">
      {TIER_ORDER.map((tier) => {
        const tierPersonas = grouped.get(tier) || [];
        if (tierPersonas.length === 0) return null;

        return (
          <div key={tier}>
            {/* Tier Header */}
            <div className="mb-2 flex items-center gap-2">
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {tier} ({tierPersonas.length})
              </span>
            </div>

            {/* Persona Cards */}
            <div className="grid gap-2 pl-5">
              {tierPersonas.map((persona) => {
                const activeTaskCount = assignments.filter(
                  (a) => a.personaId === persona.id
                ).length;

                return (
                  <button
                    key={persona.id}
                    onClick={() => onSelect(persona)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                      selectedId === persona.id
                        ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5"
                        : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]",
                        TIER_COLORS[persona.tier]
                      )}
                    >
                      <span className="text-xs font-bold">
                        {persona.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {persona.name}
                        </span>
                        <Badge
                          variant={
                            persona.tier === "lead"
                              ? "accent"
                              : persona.tier === "senior"
                                ? "info"
                                : "muted"
                          }
                          className="text-[10px]"
                        >
                          {persona.tier}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {persona.role}
                      </p>
                    </div>

                    {/* Active task indicator */}
                    {activeTaskCount > 0 && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <CircleDot className="h-3 w-3 text-green-400 animate-pulse" />
                        <span className="text-xs text-[var(--text-muted)]">
                          {activeTaskCount} aktif
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
