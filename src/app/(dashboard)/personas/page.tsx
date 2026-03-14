"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjectContext } from "@/components/layout/project-context";
import { PersonaTree } from "@/components/persona/persona-tree";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

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

export default function PersonasPage() {
  const { projectId } = useProjectContext();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [personaRes, taskRes] = await Promise.all([
        fetch("/api/v1/personas"),
        projectId
          ? fetch(`/api/v1/tasks?projectId=${projectId}`)
          : Promise.resolve(null),
      ]);

      const personaData = await personaRes.json();
      setPersonas(personaData.data || personaData || []);

      if (taskRes) {
        const taskData = await taskRes.json();
        const tasks = taskData.tasks || taskData || [];
        const assigned: TaskAssignment[] = tasks
          .filter(
            (t: Record<string, unknown>) =>
              t.assigneePersonaId && t.status !== "done"
          )
          .map((t: Record<string, unknown>) => ({
            personaId: t.assigneePersonaId as string,
            taskId: t.id as string,
            taskTitle: t.title as string,
            taskStatus: t.status as string,
          }));
        setAssignments(assigned);
      }
    } catch {
      // Ignore
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-[var(--bg-tertiary)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Personalar
          </h1>
          <Badge variant="muted">{personas.length} persona</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-6">
          {personas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
              <Users className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">Persona bulunamadı</p>
              <p className="mt-1 text-xs">Seed script çalıştırılmamış olabilir</p>
            </div>
          ) : (
            <PersonaTree
              personas={personas}
              assignments={assignments}
              selectedId={selectedPersona?.id ?? null}
              onSelect={(p) => setSelectedPersona(p)}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selectedPersona && (
          <div className="w-96 flex-shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/20">
                <span className="text-sm font-bold text-[var(--accent-primary)]">
                  {selectedPersona.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {selectedPersona.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedPersona.role}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Seviye
                </p>
                <Badge
                  variant={
                    selectedPersona.tier === "lead"
                      ? "accent"
                      : selectedPersona.tier === "senior"
                        ? "info"
                        : "muted"
                  }
                >
                  {selectedPersona.tier}
                </Badge>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Açıklama
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedPersona.description}
                </p>
              </div>

              {selectedPersona.capabilities && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Yetenekler
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(selectedPersona.capabilities).map(
                      (cap: string) => (
                        <Badge key={cap} variant="muted" className="text-[10px]">
                          {cap}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Active Tasks */}
              {assignments.filter((a) => a.personaId === selectedPersona.id)
                .length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Aktif Görevler
                  </p>
                  <div className="space-y-1.5">
                    {assignments
                      .filter((a) => a.personaId === selectedPersona.id)
                      .map((a) => (
                        <a
                          key={a.taskId}
                          href={`/task/${a.taskId}`}
                          className="block rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
                        >
                          <span className="text-xs text-[var(--text-muted)] font-mono">
                            {a.taskId.slice(0, 11)}
                          </span>
                          <p className="text-xs mt-0.5">{a.taskTitle}</p>
                          <Badge
                            variant="muted"
                            className="mt-1 text-[10px]"
                          >
                            {a.taskStatus}
                          </Badge>
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
