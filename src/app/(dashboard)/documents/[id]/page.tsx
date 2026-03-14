"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_STATUS_LABELS } from "@/types";
import type { DocumentStatus } from "@/types";
import { ArrowLeft, CheckCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Doc {
  id: string;
  title: string;
  type: string;
  content: string | null;
  status: string;
  category: string;
  createdBy: string | null;
}

interface Review {
  id: string;
  reviewerPersonaId: string;
  status: string;
  comments: string | null;
  createdAt: string;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/documents/${id}`).then((r) => r.json()),
      fetch(`/api/v1/documents/${id}/reviews`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([docJson, reviewJson]) => {
        setDoc(docJson.data);
        setReviews(reviewJson.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function submitReview(status: "approved" | "revision_requested") {
    await fetch(`/api/v1/documents/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerPersonaId: "prime",
        status,
        comments: reviewComment || undefined,
      }),
    });
    // Refresh
    const res = await fetch(`/api/v1/documents/${id}/reviews`);
    const json = await res.json();
    setReviews(json.data ?? []);
    setReviewComment("");
  }

  if (loading) {
    return <div className="animate-pulse p-6"><div className="h-8 w-64 rounded bg-[var(--bg-hover)]" /></div>;
  }

  if (!doc) {
    return <div className="p-6 text-sm text-[var(--error)]">Doküman bulunamadı</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Document content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Link
          href="/documents"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Dokümanlar
        </Link>

        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">{doc.title}</h1>
          <Badge variant={doc.status === "approved" ? "success" : doc.status === "in_review" ? "info" : "muted"}>
            {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus] ?? doc.status}
          </Badge>
        </div>

        <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
          {doc.content ?? "İçerik yok"}
        </div>
      </div>

      {/* Review panel */}
      <div className="w-80 shrink-0 border-l border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">İnceleme</h2>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">{r.reviewerPersonaId}</span>
                <Badge variant={r.status === "approved" ? "success" : "warning"}>
                  {r.status === "approved" ? "Onaylandı" : "Revizyon"}
                </Badge>
              </div>
              {r.comments && (
                <p className="text-xs text-[var(--text-muted)]">{r.comments}</p>
              )}
            </div>
          ))}

          {doc.status === "in_review" && (
            <>
              <Textarea
                placeholder="Yorum ekle..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => submitReview("approved")}>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Onayla
                </Button>
                <Button size="sm" variant="secondary" onClick={() => submitReview("revision_requested")}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  Revize
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
