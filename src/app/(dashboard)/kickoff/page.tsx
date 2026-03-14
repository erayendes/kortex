"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjectContext } from "@/components/layout/project-context";
import { useSSE } from "@/hooks/use-sse";
import { DagView } from "@/components/kickoff/dag-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket } from "lucide-react";

interface Step {
  id: string;
  personaId: string;
  title: string;
  status: string;
  stepOrder: number;
  dependsOn: string;
  outputDocumentId: string | null;
  error: string | null;
}

export default function KickoffPage() {
  const { projectId } = useProjectContext();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchSteps = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/v1/pipeline?projectId=${projectId}`);
      const json = await res.json();
      setSteps(json.data ?? []);
    } catch {
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  useSSE(projectId ?? null, useCallback(() => {
    fetchSteps();
  }, [fetchSteps]));

  async function handleStart() {
    if (!projectId) return;
    setStarting(true);
    try {
      await fetch("/api/v1/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, workflowType: "kickoff" }),
      });
      fetchSteps();
    } finally {
      setStarting(false);
    }
  }

  if (!projectId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Bir proje seçin</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Başlangıç Pipeline</h1>
        <Button onClick={handleStart} disabled={starting}>
          <Rocket className="h-4 w-4" />
          {starting ? "Başlatılıyor..." : steps.length > 0 ? "Devam Et" : "Analiz Başlat"}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex gap-6 p-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-48 shrink-0" />
            ))}
          </div>
        ) : steps.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Rocket className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">Pipeline henüz başlatılmadı</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                &quot;Analiz Başlat&quot; butonuna tıklayarak AI agent&apos;ları çalıştırın
              </p>
            </div>
          </div>
        ) : (
          <DagView steps={steps} onRefresh={fetchSteps} />
        )}
      </div>
    </div>
  );
}
