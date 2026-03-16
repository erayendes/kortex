"use client";

import type { TaskPriority, TaskStatus } from "@/types";
import { TASK_STATUS_LABELS } from "@/types";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle, ArrowUp, Minus, ArrowDown,
  Bug, CheckSquare, BookOpen, Zap,
  ArrowLeft, ArrowRight, AlertTriangle,
  Crown, Target, Settings, Package, Clipboard, Lightbulb,
  Building2, Monitor, Server, Palette, FlaskConical, Shield,
  Rocket, Database, Search, PenLine, BarChart2, User,
} from "lucide-react";

// ── Persona icons ────────────────────────────────────
const PERSONA_ICON: Record<string, LucideIcon> = {
  prime: Crown,
  "operation-manager": Target,
  "engineering-manager": Settings,
  "delivery-manager": Package,
  "project-manager": Clipboard,
  "product-manager": Lightbulb,
  architect: Building2,
  "frontend-developer": Monitor,
  "backend-developer": Server,
  designer: Palette,
  "qa-engineer": FlaskConical,
  "security-engineer": Shield,
  "devops-engineer": Rocket,
  "db-admin": Database,
  "code-reviewer": Search,
  "tech-writer": PenLine,
  "data-analyst": BarChart2,
};

// ── Priority ─────────────────────────────────────────
const PRIORITY_CONFIG: Record<TaskPriority, { icon: LucideIcon; cls: string }> = {
  blocker: { icon: AlertCircle, cls: "text-[var(--error)]" },
  high:    { icon: ArrowUp,     cls: "text-[var(--warning)]" },
  medium:  { icon: Minus,       cls: "text-[var(--text-muted)]" },
  low:     { icon: ArrowDown,   cls: "text-[var(--text-muted)]/50" },
};

// ── Type ─────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: LucideIcon; cls: string }> = {
  bug:   { icon: Bug,         cls: "text-[var(--error)]" },
  task:  { icon: CheckSquare, cls: "text-[var(--text-muted)]" },
  story: { icon: BookOpen,    cls: "text-[var(--info)]" },
  epic:  { icon: Zap,         cls: "text-[var(--warning)]" },
};

// ── Status dot ───────────────────────────────────────
const STATUS_DOT: Partial<Record<TaskStatus, string>> = {
  backlog:          "bg-[var(--text-muted)]",
  todo:             "bg-[var(--info)]",
  in_progress:      "bg-[var(--accent-primary)]",
  test_code_review: "bg-[var(--warning)]",
  test_qa:          "bg-[var(--warning)]",
  test_security:    "bg-[var(--warning)]",
  review:           "bg-orange-400",
  done:             "bg-[var(--success)]",
};

export interface TaskCardProps {
  task: {
    id: string;
    title: string;
    type: string;
    status: TaskStatus;
    priority: string;
    assigneePersonaId: string | null;
    epicId: string | null;
    labels: string;
    dependencies: string;
    taskNumber: number;
  };
  epicBorderClass?: string;
}

export function TaskCard({ task, epicBorderClass }: TaskCardProps) {
  const router = useRouter();
  const pointerStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const deps = (() => {
    try { return JSON.parse(task.dependencies || "{}"); }
    catch { return { blocks: [], blockedBy: [] }; }
  })();
  const blocks: string[]    = deps.blocks    ?? [];
  const blockedBy: string[] = deps.blockedBy ?? [];
  const isBlocked  = blockedBy.length > 0;
  const isActive   = task.status === "in_progress" && !isBlocked;
  const hasDeps    = blocks.length > 0 || blockedBy.length > 0;

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const { onPointerDown: dndPointerDown, ...restListeners } =
    (listeners ?? {}) as Record<string, React.PointerEventHandler>;

  const displayId = `KTX-${task.taskNumber || task.id.slice(-4)}`;
  const typeConf  = TYPE_CONFIG[task.type]                         ?? TYPE_CONFIG.task;
  const prioConf  = PRIORITY_CONFIG[task.priority as TaskPriority] ?? PRIORITY_CONFIG.medium;
  const TypeIcon  = typeConf.icon;
  const PrioIcon  = prioConf.icon;
  const PersonaIcon: LucideIcon | null = task.assigneePersonaId
    ? (PERSONA_ICON[task.assigneePersonaId] ?? User)
    : null;

  // Effective left border: blocked > epic > active > none
  const leftBorder = isBlocked
    ? "border-l-[3px] border-l-red-500"
    : epicBorderClass
      ? `border-l-[3px] ${epicBorderClass}`
      : isActive
        ? "border-l-[3px] border-l-[var(--accent-primary)]"
        : "";

  // Card bg tint based on state
  const cardBg = isBlocked
    ? "bg-red-500/5 border-red-500/30"
    : isActive
      ? "bg-[var(--accent-primary)]/5"
      : "bg-[var(--bg-card)]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...restListeners}
      {...attributes}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        didDrag.current = false;
        dndPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        if (dx > 5 || dy > 5) didDrag.current = true;
      }}
      onClick={() => {
        if (!didDrag.current) router.push(`/tasks/${task.id}`);
      }}
      className={cn(
        "group cursor-grab select-none rounded-md border border-[var(--border)] transition-colors hover:brightness-110",
        cardBg,
        leftBorder,
        isDragging && "opacity-50 shadow-xl ring-2 ring-[var(--accent-primary)]"
      )}
    >
      {/* No-epic warning */}
      {!task.epicId && (
        <div className="flex items-center gap-1 border-b border-[var(--border)] px-2.5 py-1">
          <AlertTriangle size={9} className="shrink-0 text-amber-500" />
          <span className="text-[10px] text-amber-500">Epic atanmadı</span>
        </div>
      )}

      {/* Main content */}
      <div className="p-2.5">
        {/* Row 1: ID + type | priority */}
        <div className="mb-1.5 flex items-center gap-1">
          <span className="font-mono text-[10px] text-[var(--text-muted)]">{displayId}</span>
          <TypeIcon size={10} className={cn("shrink-0", typeConf.cls)} />
          <div className="ml-auto">
            <PrioIcon size={12} className={cn("shrink-0", prioConf.cls)} />
          </div>
        </div>

        {/* Row 2: Title */}
        <p className="mb-2 text-xs font-medium leading-snug text-[var(--text-primary)] line-clamp-2">
          {task.title}
        </p>

        {/* Row 3: Status */}
        <div className="mb-2 flex items-center gap-1">
          <div className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isBlocked ? "bg-red-500" : (STATUS_DOT[task.status] ?? "bg-[var(--text-muted)]")
          )} />
          <span className={cn(
            "text-[10px] truncate",
            isBlocked ? "text-red-400" : "text-[var(--text-muted)]"
          )}>
            {isBlocked ? "Bloklandı" : (TASK_STATUS_LABELS[task.status] ?? task.status)}
          </span>
        </div>

        {/* Row 4: Persona */}
        {PersonaIcon ? (
          <div className="flex items-center gap-1">
            <PersonaIcon size={10} className="shrink-0 text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-secondary)] truncate">
              {task.assigneePersonaId}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <AlertCircle size={10} className="shrink-0 text-amber-500" />
            <span className="text-[10px] text-amber-500">Atanmadı</span>
          </div>
        )}
      </div>

      {/* Dependency section */}
      {hasDeps && (
        <div className="border-t border-[var(--border)] px-2.5 py-1.5 flex flex-col gap-0.5">
          {blockedBy.length > 0 && (
            <div className="flex items-center gap-1">
              <ArrowLeft size={9} className="shrink-0 text-red-400" />
              <span className="text-[10px] text-red-400 truncate font-mono">
                {blockedBy.slice(0, 2).join(", ")}
                {blockedBy.length > 2 && ` +${blockedBy.length - 2}`}
              </span>
            </div>
          )}
          {blocks.length > 0 && (
            <div className="flex items-center gap-1">
              <ArrowRight size={9} className="shrink-0 text-amber-500" />
              <span className="text-[10px] text-amber-500 truncate font-mono">
                {blocks.slice(0, 2).join(", ")}
                {blocks.length > 2 && ` +${blocks.length - 2}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
