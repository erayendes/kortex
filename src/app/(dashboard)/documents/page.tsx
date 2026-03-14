"use client";

import { useState, useEffect } from "react";
import { useProjectContext } from "@/components/layout/project-context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DOCUMENT_STATUS_LABELS } from "@/types";
import type { DocumentStatus } from "@/types";
import Link from "next/link";
import { FileText } from "lucide-react";

interface Doc {
  id: string;
  title: string;
  type: string;
  category: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

const statusVariant: Record<DocumentStatus, "muted" | "info" | "success" | "warning"> = {
  draft: "muted",
  in_review: "info",
  approved: "success",
  archived: "warning",
};

const categoryLabels: Record<string, string> = {
  reference: "Referans",
  report: "Rapor",
  memory: "Hafıza",
};

export default function DocumentsPage() {
  const { projectId } = useProjectContext();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    if (!projectId) return;
    const params = new URLSearchParams({ projectId });
    if (categoryFilter) params.set("category", categoryFilter);

    fetch(`/api/v1/documents?${params}`)
      .then((r) => r.json())
      .then((json) => setDocs(json.data ?? []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [projectId, categoryFilter]);

  if (!projectId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Bir proje seçin</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Dokümanlar</h1>
        <div className="flex gap-2">
          {["", "reference", "report", "memory"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {cat === "" ? "Tümü" : categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <FileText className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Henüz doküman yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--accent-primary)]/40"
            >
              <FileText className="h-5 w-5 text-[var(--text-muted)]" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">{doc.title}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {categoryLabels[doc.category] ?? doc.category} · {doc.type}
                  {doc.createdBy && ` · ${doc.createdBy}`}
                </p>
              </div>
              <Badge variant={statusVariant[doc.status as DocumentStatus] ?? "muted"}>
                {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus] ?? doc.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
