"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjectContext } from "@/components/layout/project-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Plus, FileText, Trash2, Save } from "lucide-react";

interface MemoryEntry {
  id: string;
  projectId: string;
  category: string;
  title: string;
  content: string;
  createdByPersonaId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const TABS = [
  { id: "active-context", label: "Aktif Bağlam", color: "accent" },
  { id: "handover", label: "Devir Teslim", color: "info" },
  { id: "decisions", label: "Kararlar", color: "success" },
  { id: "learned", label: "Öğrenilenler", color: "warning" },
  { id: "snippets", label: "Kod Parçaları", color: "muted" },
] as const;

export default function MemoryPage() {
  const { projectId } = useProjectContext();
  const [activeTab, setActiveTab] = useState<string>("active-context");
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await fetch(
      `/api/v1/memory?projectId=${projectId}&category=${activeTab}`
    );
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [projectId, activeTab]);

  useEffect(() => {
    fetchEntries();
    setSelectedEntry(null);
  }, [fetchEntries]);

  const handleCreate = async () => {
    if (!projectId) return;
    const res = await fetch("/api/v1/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        category: activeTab,
        title: "Yeni Not",
        content: "",
      }),
    });
    const entry = await res.json();
    setEntries((prev) => [entry, ...prev]);
    setSelectedEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  };

  const handleSelect = (entry: MemoryEntry) => {
    setSelectedEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  };

  const handleSave = async () => {
    if (!selectedEntry) return;
    setSaving(true);
    const res = await fetch(`/api/v1/memory/${selectedEntry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    });
    const updated = await res.json();
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setSelectedEntry(updated);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/memory/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
        Lütfen bir proje seçin
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Hafıza
        </h1>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Yeni Not
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] px-6 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-t-md px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Entry List */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-[var(--border)]">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-md bg-[var(--bg-tertiary)]"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
              <FileText className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">Bu kategoride not yok</p>
              <p className="text-xs mt-1">Yeni bir not oluşturun</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleSelect(entry)}
                  className={cn(
                    "w-full rounded-md px-3 py-2.5 text-left transition-colors group",
                    selectedEntry?.id === entry.id
                      ? "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30"
                      : "hover:bg-[var(--bg-hover)] border border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {entry.title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                    {entry.content
                      ? entry.content.slice(0, 60) + "..."
                      : "Boş not"}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {new Date(entry.updatedAt).toLocaleDateString("tr-TR")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedEntry ? (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  placeholder="Not başlığı..."
                />
                <Badge variant="muted">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </Badge>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 resize-none bg-transparent p-6 font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                placeholder="Markdown içerik yazın..."
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[var(--text-muted)]">
              <div className="text-center">
                <FileText className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm">Bir not seçin veya yeni oluşturun</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
