"use client";

import { KanbanBoard } from "@/components/board/kanban-board";
import { useProjectContext } from "@/components/layout/project-context";

export default function BoardPage() {
  const { projectId } = useProjectContext();

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Pano</h1>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}
