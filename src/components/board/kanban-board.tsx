"use client";

import { useBoard } from "@/hooks/use-board";
import { useSSE } from "@/hooks/use-sse";
import { KanbanColumn } from "./kanban-column";
import { Skeleton } from "@/components/ui/skeleton";
import { BOARD_COLUMNS } from "@/types";
import type { TaskStatus } from "@/types";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCallback } from "react";

interface KanbanBoardProps {
  projectId: string | null;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data, loading, error, refetch } = useBoard(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // SSE: re-fetch board on any task event
  useSSE(
    projectId,
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active) return;

      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;

      // Find current task column
      const currentCol = data?.columns.find((c) =>
        c.tasks.some((t) => t.id === taskId)
      );
      if (!currentCol || currentCol.id === newStatus) return;

      // Call transition API
      try {
        const res = await fetch(`/api/v1/tasks/${taskId}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toStatus: newStatus,
            personaId: "prime",
          }),
        });

        if (!res.ok) {
          refetch();
          return;
        }

        refetch();
      } catch {
        refetch();
      }
    },
    [data, refetch]
  );

  if (!projectId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Bir proje seçin</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto p-6">
        {BOARD_COLUMNS.map((col) => (
          <div key={col} className="w-72 shrink-0 space-y-2">
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
      <div className="flex gap-4 overflow-x-auto p-6">
        {data.columns.map((col) => (
          <KanbanColumn key={col.id} status={col.id} tasks={col.tasks} />
        ))}
      </div>
    </DndContext>
  );
}
