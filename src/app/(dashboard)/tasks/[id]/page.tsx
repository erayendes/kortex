"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/types";
import { ArrowLeft, Send, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Task {
  id: string;
  projectId: string;
  epicId: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneePersonaId: string | null;
  reporterPersonaId: string | null;
  labels: string;
  acceptanceCriteria: string | null;
  branch: string | null;
  version: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  authorPersonaId: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  epic: "Epic",
  story: "Story",
  task: "Görev",
  bug: "Bug",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  backlog: ["todo"],
  todo: ["in_progress", "backlog"],
  in_progress: ["test_code_review", "todo"],
  test_code_review: ["test_qa", "in_progress"],
  test_qa: ["test_security", "test_code_review"],
  test_security: ["review", "test_qa"],
  review: ["done", "in_progress"],
  done: ["review"],
};

const PRIORITY_VARIANT: Record<TaskPriority, "error" | "warning" | "info" | "muted"> = {
  blocker: "error",
  high: "warning",
  medium: "info",
  low: "muted",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/v1/tasks/${id}`).then((r) => r.json()),
      fetch(`/api/v1/tasks/${id}/comments`).then((r) => r.json()),
    ]).then(([taskRes, commentsRes]) => {
      setTask(taskRes.data);
      setComments(commentsRes.data ?? []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  async function saveTitle() {
    if (!task || !titleDraft.trim()) return;
    const res = await fetch(`/api/v1/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleDraft.trim() }),
    });
    const data = await res.json();
    setTask(data.data);
    setEditingTitle(false);
  }

  async function saveDesc() {
    if (!task) return;
    const res = await fetch(`/api/v1/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: descDraft }),
    });
    const data = await res.json();
    setTask(data.data);
    setEditingDesc(false);
  }

  async function transition(toStatus: string) {
    if (!task) return;
    const res = await fetch(`/api/v1/tasks/${task.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus, personaId: "prime" }),
    });
    const data = await res.json();
    if (data.data) setTask(data.data);
  }

  async function postComment() {
    if (!task || !commentText.trim()) return;
    setSubmittingComment(true);
    const res = await fetch(`/api/v1/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText.trim(), authorPersonaId: "prime" }),
    });
    const data = await res.json();
    if (data.data) setComments((prev) => [...prev, data.data]);
    setCommentText("");
    setSubmittingComment(false);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-[var(--text-muted)]">Görev bulunamadı</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--accent-primary)] hover:underline"
        >
          Geri dön
        </button>
      </div>
    );
  }

  const labels: string[] = (() => {
    try {
      return JSON.parse(task.labels || "[]");
    } catch {
      return [];
    }
  })();

  const nextStatuses = STATUS_TRANSITIONS[task.status] ?? [];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={15} />
        </button>
        <span className="font-mono text-xs text-[var(--text-muted)]">{task.id}</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">
            {TYPE_LABELS[task.type] ?? task.type}
          </span>
          <Badge variant={PRIORITY_VARIANT[task.priority as TaskPriority] ?? "muted"}>
            {TASK_PRIORITY_LABELS[task.priority as TaskPriority] ?? task.priority}
          </Badge>
          <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
            {TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — main content */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {/* Title */}
          <div className="group flex items-start gap-2">
            {editingTitle ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="flex-1 rounded border border-[var(--accent-primary)] bg-[var(--bg-card)] px-2 py-1 text-xl font-semibold text-[var(--text-primary)] outline-none"
                />
                <button onClick={saveTitle} className="text-[var(--accent-primary)]">
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingTitle(false)}
                  className="text-[var(--text-muted)]"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="flex-1 text-xl font-semibold text-[var(--text-primary)]">
                  {task.title}
                </h1>
                <button
                  onClick={() => {
                    setTitleDraft(task.title);
                    setEditingTitle(true);
                  }}
                  className="mt-1 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <Pencil size={13} />
                </button>
              </>
            )}
          </div>

          {/* Description */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Açıklama
              </h2>
              {!editingDesc && (
                <button
                  onClick={() => {
                    setDescDraft(task.description ?? "");
                    setEditingDesc(true);
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={6}
                  className="w-full rounded border border-[var(--accent-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveDesc}
                    className="rounded bg-[var(--accent-primary)] px-3 py-1 text-xs text-white"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingDesc(false)}
                    className="rounded px-3 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                {task.description || (
                  <span className="italic text-[var(--text-muted)]">Açıklama yok</span>
                )}
              </p>
            )}
          </section>

          {/* Acceptance Criteria */}
          {task.acceptanceCriteria && (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Kabul Kriterleri
              </h2>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                {task.acceptanceCriteria}
              </p>
            </section>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Etiketler
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <span
                    key={l}
                    className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Comments */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Yorumlar ({comments.length})
            </h2>

            {comments.length === 0 && (
              <p className="text-sm italic text-[var(--text-muted)]">Henüz yorum yok</p>
            )}

            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]/20 text-[9px] font-bold text-[var(--accent-primary)]">
                    {c.authorPersonaId.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {c.authorPersonaId}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(c.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                  {c.content}
                </p>
              </div>
            ))}

            {/* New comment */}
            <div className="flex gap-2">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment();
                }}
                placeholder="Yorum yaz… (⌘+Enter gönder)"
                rows={3}
                className="flex-1 resize-none rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                onClick={postComment}
                disabled={!commentText.trim() || submittingComment}
                className={cn(
                  "self-end rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  commentText.trim()
                    ? "bg-[var(--accent-primary)] text-white hover:opacity-90"
                    : "cursor-not-allowed bg-[var(--bg-hover)] text-[var(--text-muted)]"
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </section>
        </div>

        {/* Right — sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto border-l border-[var(--border)] p-4">
          <div className="flex flex-col gap-5">
            {/* Durum geçişleri */}
            {nextStatuses.length > 0 && (
              <section>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Duruma Geç
                </h3>
                <div className="flex flex-col gap-1.5">
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => transition(s)}
                      className="w-full rounded-md border border-[var(--border)] px-3 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    >
                      → {TASK_STATUS_LABELS[s as TaskStatus] ?? s}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Atanan */}
            <section>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Atanan
              </h3>
              {task.assigneePersonaId ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)]/20 text-[11px] font-bold text-[var(--accent-primary)]">
                    {task.assigneePersonaId.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {task.assigneePersonaId}
                  </span>
                </div>
              ) : (
                <p className="text-xs italic text-[var(--text-muted)]">Atanmadı</p>
              )}
            </section>

            {/* Raporlayan */}
            {task.reporterPersonaId && (
              <section>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Raporlayan
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[11px] font-bold text-[var(--text-muted)]">
                    {task.reporterPersonaId.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {task.reporterPersonaId}
                  </span>
                </div>
              </section>
            )}

            {/* Branch */}
            {task.branch && (
              <section>
                <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Branch
                </h3>
                <code className="block rounded bg-[var(--bg-hover)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                  {task.branch}
                </code>
              </section>
            )}

            {/* Tarihler */}
            <section>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Tarihler
              </h3>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Oluşturuldu</span>
                  <span className="text-[var(--text-secondary)]">
                    {new Date(task.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Güncellendi</span>
                  <span className="text-[var(--text-secondary)]">
                    {new Date(task.updatedAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
