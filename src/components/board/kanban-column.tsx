"use client";

import { TaskCard } from "./task-card";
import { TASK_STATUS_LABELS } from "@/types";
import type { TaskStatus } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";

interface Task {
  id: string;
  title: string;
  type: string;
  priority: string;
  assigneePersonaId: string | null;
  labels: string;
  orderIndex: number;
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const statusColors: Partial<Record<TaskStatus, string>> = {
  backlog: "bg-[var(--text-muted)]",
  todo: "bg-[var(--info)]",
  in_progress: "bg-[var(--accent-primary)]",
  test_code_review: "bg-[var(--warning)]",
  test_qa: "bg-[var(--warning)]",
  test_security: "bg-[var(--warning)]",
  review: "bg-orange-500",
  done: "bg-[var(--success)]",
};

export function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* Column Header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className={`h-2 w-2 rounded-full ${statusColors[status] ?? "bg-[var(--text-muted)]"}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {TASK_STATUS_LABELS[status] ?? status}
        </span>
        <span className="ml-auto rounded-full bg-[var(--bg-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          {tasks.length}
        </span>
      </div>

      {/* Task list (droppable) */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-[var(--bg-secondary)] p-2 transition-colors",
          isOver && "ring-2 ring-[var(--accent-primary)] ring-inset bg-[var(--accent-primary)]/5"
        )}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <span className="text-xs text-[var(--text-muted)]">Boş</span>
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
