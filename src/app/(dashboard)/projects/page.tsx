"use client";

import { useProjects } from "@/hooks/use-projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_STATUS_LABELS } from "@/types";
import type { ProjectStatus } from "@/types";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";

const statusVariant: Record<ProjectStatus, "muted" | "info" | "accent" | "success"> = {
  setup: "muted",
  kickoff: "info",
  development: "accent",
  completed: "success",
};

export default function ProjectsPage() {
  const { projects, loading } = useProjects();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Projeler</h1>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Yeni Proje
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="mb-4 h-12 w-12 text-[var(--text-muted)]" />
          <p className="mb-2 text-sm text-[var(--text-secondary)]">
            Henüz proje yok
          </p>
          <Link href="/projects/new">
            <Button size="sm">Yeni Proje Oluştur</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/board`}
              className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-hover)]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    {p.name}
                  </h3>
                  <Badge variant={statusVariant[p.status as ProjectStatus] ?? "muted"}>
                    {PROJECT_STATUS_LABELS[p.status as ProjectStatus] ?? p.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {p.platform} · {p.id}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
