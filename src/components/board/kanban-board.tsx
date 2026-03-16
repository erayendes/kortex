"use client";

import { useBoard } from "@/hooks/use-board";
import { useSSE } from "@/hooks/use-sse";
import { KanbanColumn } from "./kanban-column";
import { EpicColumn, EPIC_COLORS, type Epic } from "./epic-column";
import { Skeleton } from "@/components/ui/skeleton";
import { BOARD_COLUMNS } from "@/types";
import type { TaskStatus } from "@/types";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";

interface KanbanBoardProps {
  projectId: string | null;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data, loading, error, refetch } = useBoard(projectId);
  const [epics, setEpics] = useState<Epic[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Fetch epics when project changes
  useEffect(() => {
    if (!projectId) { setEpics([]); return; }
    fetch(`/api/v1/epics?projectId=${projectId}`)
      .then(r => r.json())
      .then(j => setEpics(j.data ?? []))
      .catch(() => setEpics([]));
  }, [projectId]);

  // SSE: re-fetch board on any task event
  useSSE(
    projectId,
    useCallback(() => { refetch(); }, [refetch])
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active) return;

      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;

      const currentCol = data?.columns.find((c) => c.tasks.some((t) => t.id === taskId));
      if (!currentCol || currentCol.id === newStatus) return;

      try {
        const res = await fetch(`/api/v1/tasks/${taskId}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toStatus: newStatus, personaId: "prime" }),
        });
        if (!res.ok) { refetch(); return; }
        refetch();
      } catch {
        refetch();
      }
    },
    [data, refetch]
  );

  // Build epicBorderMap: epicId → border color class
  const epicBorderMap: Record<string, string> = {};
  epics.forEach((epic, i) => {
    epicBorderMap[epic.id] = EPIC_COLORS[i % EPIC_COLORS.length].border;
  });

  // Epic task counts
  const epicTaskCounts: Record<string, number> = {};
  data?.columns.forEach(col => {
    col.tasks.forEach(task => {
      if (task.epicId) {
        epicTaskCounts[task.epicId] = (epicTaskCounts[task.epicId] ?? 0) + 1;
      }
    });
  });

  if (!projectId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Bir proje seçin</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-60 shrink-0 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-[var(--error)]">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Epic column */}
        <EpicColumn epics={epics} epicTaskCounts={epicTaskCounts} />

        {/* Task status columns */}
        {data.columns.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            tasks={col.tasks}
            epicBorderMap={epicBorderMap}
          />
        ))}
      </div>
    </DndContext>
  );
}
