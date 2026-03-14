"use client";

import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/types";
import { TASK_PRIORITY_LABELS } from "@/types";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
    assigneePersonaId: string | null;
    labels: string;
  };
}

const priorityVariant: Record<TaskPriority, "error" | "warning" | "info" | "muted"> = {
  blocker: "error",
  high: "warning",
  medium: "info",
  low: "muted",
};

export function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const labels: string[] = (() => {
    try {
      return JSON.parse(task.labels || "[]");
    } catch {
      return [];
    }
  })();

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group cursor-grab rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-colors hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-hover)]",
        isDragging && "opacity-50 shadow-lg ring-2 ring-[var(--accent-primary)]"
      )}
    >
      {/* ID + Priority */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {task.id}
        </span>
        <Badge variant={priorityVariant[task.priority as TaskPriority] ?? "muted"}>
          {TASK_PRIORITY_LABELS[task.priority as TaskPriority] ?? task.priority}
        </Badge>
      </div>

      {/* Title */}
      <p className="mb-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
        {task.title}
      </p>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-[var(--bg-hover)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Assignee */}
      {task.assigneePersonaId && (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-[var(--accent-primary)]">
              {task.assigneePersonaId.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {task.assigneePersonaId}
          </span>
        </div>
      )}
    </div>
  );
}
