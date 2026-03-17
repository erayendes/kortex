"use client";

import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "./project-context";
import { ChevronDown, FolderKanban, Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProjectSwitcher() {
  const { projects, loading, refetch: refresh } = useProjects();
  const { projectId, setProjectId } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "web" as "web" | "mobile" | "api" | "fullstack" });
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const selected = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0].id);
  }, [projectId, projects, setProjectId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), platform: form.platform }),
      });
      const data = await res.json();
      if (data.data?.id) {
        await refresh();
        setProjectId(data.data.id);
        setShowNew(false);
        setForm({ name: "", platform: "web" });
        setOpen(false);
        router.push("/kickoff");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="mx-3 h-9 animate-pulse rounded-md bg-[var(--bg-hover)]" />;

  return (
    <>
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
              <div className="px-3 py-2 text-xs text-[var(--text-muted)]">Henüz proje yok</div>
            ) : (
              projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProjectId(p.id); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                    p.id === projectId
                      ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">{p.platform}</span>
                </button>
              ))
            )}
            <div className="mt-1 border-t border-[var(--border)] pt-1">
              <button
                onClick={() => { setShowNew(true); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Proje
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Yeni Proje</h2>
              <button onClick={() => setShowNew(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Proje Adı</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Proje adı..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value as typeof form.platform })}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  <option value="web">Web</option>
                  <option value="mobile">Mobile</option>
                  <option value="api">API</option>
                  <option value="fullstack">Fullstack</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="flex-1 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {creating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
