"use client";

import { useState, useEffect, use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/types";
import type { TaskStatus, TaskPriority } from "@/types";
import { ArrowLeft, Send, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  assigneePersonaId: string | null;
  epicId: string | null;
  labels: string;
  testSteps: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  personaId: string;
  content: string;
  createdAt: string;
}

// Valid next statuses for each status
const NEXT_STATUSES: Partial<Record<TaskStatus, TaskStatus[]>> = {
  backlog: ["todo"],
  todo: ["in_progress"],
  in_progress: ["test_code_review", "review"],
  test_code_review: ["test_qa", "in_progress"],
  test_qa: ["test_security", "in_progress"],
  test_security: ["review", "in_progress"],
  review: ["done", "in_progress"],
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/tasks/${id}`).then((r) => r.json()),
      fetch(`/api/v1/tasks/${id}/comments`).then((r) => r.json()),
    ])
      .then(([taskJson, commentsJson]) => {
        setTask(taskJson.data);
        setComments(commentsJson.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleTransition(toStatus: TaskStatus) {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/v1/tasks/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, personaId: "prime" }),
      });
      if (res.ok) {
        const json = await res.json();
        setTask(json.data);
      }
    } finally {
      setTransitioning(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    await fetch(`/api/v1/tasks/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: "prime", content: newComment }),
    });
    setNewComment("");
    const res = await fetch(`/api/v1/tasks/${id}/comments`);
    const json = await res.json();
    setComments(json.data ?? []);
  }

  if (loading) {
    return <div className="animate-pulse p-6"><div className="h-8 w-64 rounded bg-[var(--bg-hover)]" /></div>;
  }

  if (!task) {
    return <div className="p-6 text-sm text-[var(--error)]">Görev bulunamadı</div>;
  }

  const nextStatuses = NEXT_STATUSES[task.status as TaskStatus] ?? [];
  const labels: string[] = (() => { try { return JSON.parse(task.labels || "[]"); } catch { return []; } })();

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Link
          href="/board"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Pano
        </Link>

        <div className="mb-4">
          <div className="mb-2 flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--text-muted)]">{task.id}</span>
            <Badge variant={task.status === "done" ? "success" : "accent"}>
              {TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
            </Badge>
            <Badge variant={task.priority === "blocker" ? "error" : "muted"}>
              {TASK_PRIORITY_LABELS[task.priority as TaskPriority] ?? task.priority}
            </Badge>
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{task.title}</h1>
        </div>

        {task.description && (
          <div className="mb-6 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {task.description}
          </div>
        )}

        {/* Transition buttons */}
        {nextStatuses.length > 0 && (
          <div className="mb-6 flex gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === "in_progress" ? "secondary" : "default"}
                onClick={() => handleTransition(status)}
                disabled={transitioning}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {TASK_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        )}

        {/* Labels */}
        {labels.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1">
            {labels.map((l) => (
              <Badge key={l} variant="muted">{l}</Badge>
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Yorumlar</h2>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--accent-primary)]">{c.personaId}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(c.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{c.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Textarea
              placeholder="Yorum ekle..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="text-sm"
            />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar info */}
      <div className="w-72 shrink-0 border-l border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Detaylar</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-xs text-[var(--text-muted)]">Tip</span>
            <p className="text-[var(--text-primary)]">{task.type}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)]">Atanan</span>
            <p className="text-[var(--text-primary)]">{task.assigneePersonaId ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)]">Epic</span>
            <p className="text-[var(--text-primary)]">{task.epicId ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)]">Oluşturulma</span>
            <p className="text-[var(--text-primary)]">{new Date(task.createdAt).toLocaleDateString("tr-TR")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
