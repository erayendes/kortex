"use client";

import { Zap } from "lucide-react";

export interface Epic {
  id: string;
  title: string;
  description: string | null;
  status: string;
}

// Fixed palette — class strings must be literals for Tailwind JIT
export const EPIC_COLORS = [
  { border: "border-l-purple-500",  dot: "bg-purple-500",  text: "text-purple-400"  },
  { border: "border-l-blue-500",    dot: "bg-blue-500",    text: "text-blue-400"    },
  { border: "border-l-emerald-500", dot: "bg-emerald-500", text: "text-emerald-400" },
  { border: "border-l-orange-500",  dot: "bg-orange-500",  text: "text-orange-400"  },
  { border: "border-l-pink-500",    dot: "bg-pink-500",    text: "text-pink-400"    },
  { border: "border-l-cyan-500",    dot: "bg-cyan-500",    text: "text-cyan-400"    },
  { border: "border-l-rose-500",    dot: "bg-rose-500",    text: "text-rose-400"    },
  { border: "border-l-amber-500",   dot: "bg-amber-500",   text: "text-amber-400"   },
] as const;

interface EpicColumnProps {
  epics: Epic[];
  epicTaskCounts: Record<string, number>;
}

export function EpicColumn({ epics, epicTaskCounts }: EpicColumnProps) {
  return (
    <div className="flex h-full w-52 shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <Zap size={12} className="text-[var(--warning)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Epicler
        </span>
        <span className="ml-auto rounded-full bg-[var(--bg-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          {epics.length}
        </span>
      </div>

      {/* Epic list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-[var(--bg-secondary)] p-2">
        {epics.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <span className="text-xs text-[var(--text-muted)]">Epic yok</span>
          </div>
        ) : (
          epics.map((epic, i) => {
            const color = EPIC_COLORS[i % EPIC_COLORS.length];
            const taskCount = epicTaskCounts[epic.id] ?? 0;
            return (
              <div
                key={epic.id}
                className={`rounded-md border border-[var(--border)] border-l-[3px] ${color.border} bg-[var(--bg-card)] p-2.5`}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${color.dot}`} />
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${color.text}`}>
                    Epic {i + 1}
                  </span>
                  <span className="ml-auto rounded bg-[var(--bg-hover)] px-1 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {taskCount}
                  </span>
                </div>
                <p className="text-xs font-medium leading-snug text-[var(--text-primary)] line-clamp-2">
                  {epic.title}
                </p>
                {epic.status !== "open" && (
                  <span className="mt-1 inline-block text-[10px] text-[var(--text-muted)]">
                    {epic.status}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
