"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_STEP_STATUS_LABELS } from "@/types";
import type { PipelineStepStatus } from "@/types";
import { X, CheckCircle, RotateCcw } from "lucide-react";

interface Step {
  id: string;
  personaId: string;
  title: string;
  status: string;
  outputDocumentId: string | null;
  error: string | null;
}

interface StepDetailPanelProps {
  step: Step;
  onClose: () => void;
  onRefresh: () => void;
}

export function StepDetailPanel({ step, onClose, onRefresh }: StepDetailPanelProps) {
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step.outputDocumentId) {
      setLoading(true);
      fetch(`/api/v1/documents/${step.outputDocumentId}`)
        .then((r) => r.json())
        .then((json) => setDocContent(json.data?.content ?? null))
        .catch(() => setDocContent(null))
        .finally(() => setLoading(false));
    }
  }, [step.outputDocumentId]);

  async function handleApprove() {
    await fetch(`/api/v1/pipeline/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    onRefresh();
  }

  async function handleRevise() {
    await fetch(`/api/v1/pipeline/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    onRefresh();
  }

  return (
    <div className="flex h-full flex-col border-l border-[var(--border)] bg-[var(--bg-card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</h3>
          <p className="text-xs text-[var(--text-muted)]">{step.personaId}</p>
        </div>
        <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status */}
      <div className="border-b border-[var(--border)] px-4 py-2">
        <Badge variant={step.status === "approved" ? "success" : step.status === "failed" ? "error" : "warning"}>
          {PIPELINE_STEP_STATUS_LABELS[step.status as PipelineStepStatus] ?? step.status}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/4 rounded bg-[var(--bg-hover)]" />
            <div className="h-4 w-full rounded bg-[var(--bg-hover)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--bg-hover)]" />
          </div>
        ) : docContent ? (
          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {docContent}
          </div>
        ) : step.error ? (
          <p className="text-sm text-[var(--error)]">{step.error}</p>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Henüz içerik yok</p>
        )}
      </div>

      {/* Actions */}
      {step.status === "awaiting_review" && (
        <div className="flex gap-2 border-t border-[var(--border)] p-4">
          <Button size="sm" onClick={handleApprove}>
            <CheckCircle className="h-3.5 w-3.5" />
            Onayla
          </Button>
          <Button size="sm" variant="secondary" onClick={handleRevise}>
            <RotateCcw className="h-3.5 w-3.5" />
            Revize Et
          </Button>
        </div>
      )}
    </div>
  );
}
