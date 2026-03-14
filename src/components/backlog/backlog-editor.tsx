"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Minus,
  ArrowDown,
} from "lucide-react";

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

interface BacklogEditorProps {
  tasks: BacklogTask[];
  onUpdate: (tasks: BacklogTask[]) => void;
}

const PRIORITY_CONFIG: Record<
  string,
  { icon: typeof AlertCircle; color: string; label: string }
> = {
  blocker: { icon: AlertCircle, color: "text-red-400", label: "Blocker" },
  high: { icon: AlertTriangle, color: "text-orange-400", label: "Yüksek" },
  medium: { icon: Minus, color: "text-yellow-400", label: "Orta" },
  low: { icon: ArrowDown, color: "text-blue-400", label: "Düşük" },
};

const TYPE_BADGES: Record<string, string> = {
  epic: "accent",
  story: "info",
  task: "muted",
  bug: "error",
};

export function BacklogEditor({ tasks, onUpdate }: BacklogEditorProps) {
  // Group tasks by epic
  const epics = tasks.filter((t) => t.type === "epic");
  const ungrouped = tasks.filter((t) => t.type !== "epic" && !t.epicId);
  const grouped = new Map<string, BacklogTask[]>();

  for (const epic of epics) {
    grouped.set(
      epic.id,
      tasks.filter((t) => t.epicId === epic.id)
    );
  }

  const handleFieldChange = (
    taskId: string,
    field: keyof BacklogTask,
    value: string
  ) => {
    onUpdate(
      tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const renderTask = (task: BacklogTask, indent = false) => {
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const PriorityIcon = priorityConfig.icon;
    const badgeVariant = (TYPE_BADGES[task.type] || "muted") as
      | "accent"
      | "info"
      | "muted"
      | "error"
      | "default"
      | "success"
      | "warning";

    return (
      <div
        key={task.id}
        className={cn(
          "group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 transition-colors hover:border-[var(--border-hover)]",
          indent && "ml-6"
        )}
      >
        <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />

        <PriorityIcon
          className={cn("h-4 w-4 flex-shrink-0", priorityConfig.color)}
        />

        <Badge variant={badgeVariant} className="flex-shrink-0 text-[10px] uppercase">
          {task.type}
        </Badge>

        <span className="font-mono text-[10px] text-[var(--text-muted)] flex-shrink-0">
          {task.id.slice(0, 11)}
        </span>

        <input
          value={task.title}
          onChange={(e) => handleFieldChange(task.id, "title", e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
        />

        <select
          value={task.priority}
          onChange={(e) =>
            handleFieldChange(task.id, "priority", e.target.value)
          }
          className="appearance-none rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-secondary)] outline-none"
        >
          <option value="blocker">Blocker</option>
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>

        {task.labels.length > 0 && (
          <div className="flex gap-1">
            {task.labels.slice(0, 2).map((label) => (
              <Badge key={label} variant="muted" className="text-[10px]">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Epics with children */}
      {epics.map((epic) => {
        const children = grouped.get(epic.id) || [];
        return (
          <div key={epic.id}>
            <div className="flex items-center gap-2 mb-1.5">
              {children.length > 0 ? (
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              )}
              {renderTask(epic)}
            </div>
            <div className="space-y-1">
              {children.map((child) => renderTask(child, true))}
            </div>
          </div>
        );
      })}

      {/* Ungrouped tasks */}
      {ungrouped.length > 0 && (
        <div>
          {epics.length > 0 && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Gruplanmamış Görevler
            </p>
          )}
          <div className="space-y-1">
            {ungrouped.map((task) => renderTask(task))}
          </div>
        </div>
      )}
    </div>
  );
}
