"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjectContext } from "@/components/layout/project-context";
import { useSSE } from "@/hooks/use-sse";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityIcon } from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  personaId: string | null;
  metadata: string | null;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  "task:created": "Görev oluşturuldu",
  "task:moved": "Görev taşındı",
  "task:assigned": "Görev atandı",
  "task:commented": "Yorum eklendi",
  "document:created": "Doküman oluşturuldu",
  "document:approved": "Doküman onaylandı",
  "pipeline:started": "Pipeline başlatıldı",
  "pipeline:step_completed": "Pipeline adımı tamamlandı",
  "handoff:created": "Devir oluşturuldu",
};

export default function ActivityPage() {
  const { projectId } = useProjectContext();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/v1/activity?projectId=${projectId}`);
      const json = await res.json();
      setEntries(json.data ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useSSE(projectId ?? null, useCallback(() => {
    fetchActivity();
  }, [fetchActivity]));

  if (!projectId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Bir proje seçin</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">Aktivite</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <ActivityIcon className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Henüz aktivite yok</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[var(--bg-hover)]"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
              <div className="flex-1">
                <span className="text-sm text-[var(--text-primary)]">
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                {entry.targetId && (
                  <span className="ml-1.5 font-mono text-xs text-[var(--text-muted)]">
                    {entry.targetId}
                  </span>
                )}
              </div>
              {entry.personaId && (
                <Badge variant="muted">{entry.personaId}</Badge>
              )}
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date(entry.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
