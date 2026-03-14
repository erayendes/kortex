"use client";

import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "./project-context";
import { ChevronDown, FolderKanban } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ProjectSwitcher() {
  const { projects, loading } = useProjects();
  const { projectId, setProjectId } = useProjectContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = projects.find((p) => p.id === projectId);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects, setProjectId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="mx-3 h-9 animate-pulse rounded-md bg-[var(--bg-hover)]" />
    );
  }

  return (
    <div ref={ref} className="relative mx-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <FolderKanban className="h-4 w-4 text-[var(--accent-primary)]" />
        <span className="flex-1 truncate text-left font-medium">
          {selected?.name ?? "Proje Seç"}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg">
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
              Henüz proje yok
            </div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProjectId(p.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                  p.id === projectId
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="truncate">{p.name}</span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">
                  {p.platform}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
