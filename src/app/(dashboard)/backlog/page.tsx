"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjectContext } from "@/components/layout/project-context";
import { BacklogEditor } from "@/components/backlog/backlog-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, ListTodo } from "lucide-react";

interface BacklogTask {
  id: string;
  title: string;
  type: string;
  priority: string;
  assigneePersonaId: string | null;
  labels: string[];
  acceptanceCriteria: string;
  epicId?: string;
  order: number;
}

export default function BacklogPage() {
  const { projectId } = useProjectContext();
  const [tasks, setTasks] = useState<BacklogTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/tasks?projectId=${projectId}&status=backlog`
      );
      const data = await res.json();
      setTasks(
        (data.tasks || data || []).map(
          (t: Record<string, unknown>, i: number) => ({
            id: t.id,
            title: t.title,
            type: t.type || "task",
            priority: t.priority || "medium",
            assigneePersonaId: t.assigneePersonaId || null,
            labels: t.labels ? JSON.parse(t.labels as string) : [],
            acceptanceCriteria: t.acceptanceCriteria || "",
            epicId: t.epicId as string | undefined,
            order: i,
          })
        )
      );
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTransferToBoard = async () => {
    if (!projectId || tasks.length === 0) return;
    setTransferring(true);

    // Move all backlog tasks to "todo" status
    for (const task of tasks) {
      await fetch(`/api/v1/tasks/${task.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "todo" }),
      });
    }

    // Update project status to development
    await fetch("/api/v1/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        command: "!start-dev",
        triggeredByPersonaId: "prime",
      }),
    });

    setTransferring(false);
    window.location.href = "/board";
  };

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
        Lütfen bir proje seçin
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Backlog Düzenleme
          </h1>
          <Badge variant="info">{tasks.length} görev</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchTasks}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Yenile
          </Button>
          <Button
            size="sm"
            onClick={handleTransferToBoard}
            disabled={transferring || tasks.length === 0}
          >
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
            {transferring ? "Aktarılıyor..." : "Board'a Aktar"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-[var(--bg-tertiary)]"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <ListTodo className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Backlog boş</p>
            <p className="mt-1 text-xs">
              Kickoff pipeline tamamlandıktan sonra backlog görevleri burada
              görünecek
            </p>
          </div>
        ) : (
          <BacklogEditor tasks={tasks} onUpdate={setTasks} />
        )}
      </div>
    </div>
  );
}
