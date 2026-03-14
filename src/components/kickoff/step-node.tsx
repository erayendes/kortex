"use client";

import { Badge } from "@/components/ui/badge";
import { PIPELINE_STEP_STATUS_LABELS } from "@/types";
import type { PipelineStepStatus } from "@/types";
import { cn } from "@/lib/cn";
import { Loader2, CheckCircle, AlertCircle, Clock, Eye } from "lucide-react";

interface StepNodeProps {
  step: {
    id: string;
    personaId: string;
    title: string;
    status: string;
    error: string | null;
  };
  isSelected: boolean;
  onClick: () => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  awaiting_review: <Eye className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  failed: <AlertCircle className="h-3.5 w-3.5" />,
};

const statusVariant: Record<string, "muted" | "accent" | "warning" | "success" | "error"> = {
  pending: "muted",
  running: "accent",
  awaiting_review: "warning",
  approved: "success",
  failed: "error",
};

export function StepNode({ step, isSelected, onClick }: StepNodeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-48 rounded-lg border bg-[var(--bg-card)] p-3 text-left transition-all",
        isSelected
          ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]"
          : "border-[var(--border)] hover:border-[var(--accent-primary)]/40"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {statusIcons[step.status] ?? statusIcons.pending}
        <Badge variant={statusVariant[step.status] ?? "muted"}>
          {PIPELINE_STEP_STATUS_LABELS[step.status as PipelineStepStatus] ?? step.status}
        </Badge>
      </div>
      <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
        {step.title}
      </p>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{step.personaId}</p>
      {step.error && (
        <p className="mt-1 truncate text-[10px] text-[var(--error)]">{step.error}</p>
      )}
    </button>
  );
}
