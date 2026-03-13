// ── Enums ──────────────────────────────────────────────

export type ProjectPlatform = "web" | "mobile" | "api" | "fullstack";
export type ProjectStatus = "setup" | "kickoff" | "development" | "completed";

export type ProviderAuthType = "api_key" | "oauth";
export type ModelCategory = "powerful" | "balanced" | "fast";
export type ModelCostTier = "high" | "medium" | "low";

export type DocumentCategory = "reference" | "report" | "memory";
export type DocumentStatus = "draft" | "in_review" | "approved" | "archived";
export type ReviewStatus = "pending" | "approved" | "revision_requested";

export type PipelineWorkflowType = "kickoff" | "refinement" | "deployment";
export type PipelineStepStatus =
  | "pending"
  | "running"
  | "awaiting_review"
  | "approved"
  | "failed";

export type AgentExecutionStatus =
  | "running"
  | "paused"
  | "error"
  | "blocked"
  | "completed";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "test_code_review"
  | "test_qa"
  | "test_security"
  | "review"
  | "done";

export type TaskType = "epic" | "story" | "task" | "bug";
export type TaskPriority = "blocker" | "high" | "medium" | "low";

export type PersonaTier = "prime" | "lead" | "senior" | "member";
export type PersonaDecisionLevel = "strategic" | "tactical" | "operational";

export type ServiceCategory =
  | "hosting"
  | "database"
  | "auth"
  | "storage"
  | "ci_cd"
  | "analytics"
  | "other";

export type ActivityTargetType =
  | "task"
  | "document"
  | "pipeline_step"
  | "epic"
  | "agent_execution";

export type HandoffStatus = "pending" | "acknowledged" | "completed";
export type CommandStatus = "pending" | "running" | "completed" | "failed";

// ── Interfaces ─────────────────────────────────────────

export interface TaskDependencies {
  blocks: string[];
  blockedBy: string[];
  related: string[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface InlineComment {
  id: string;
  line: number;
  text: string;
  createdAt: string;
}

// ── Turkish Label Mappings ─────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Yapılacak",
  in_progress: "Devam Eden",
  test_code_review: "Test: Code Review",
  test_qa: "Test: QA",
  test_security: "Test: Güvenlik",
  review: "İnceleme",
  done: "Tamamlandı",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  blocker: "Engelleyici",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  setup: "Kurulum",
  kickoff: "Başlangıç",
  development: "Geliştirme",
  completed: "Tamamlandı",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Taslak",
  in_review: "İncelemede",
  approved: "Onaylandı",
  archived: "Arşivlendi",
};

export const PIPELINE_STEP_STATUS_LABELS: Record<PipelineStepStatus, string> = {
  pending: "Bekliyor",
  running: "Çalışıyor",
  awaiting_review: "İnceleme Bekliyor",
  approved: "Onaylandı",
  failed: "Hata",
};

export const AGENT_STATUS_LABELS: Record<AgentExecutionStatus, string> = {
  running: "Çalışıyor",
  paused: "Durdu",
  error: "Hata",
  blocked: "Bloklandı",
  completed: "Tamamlandı",
};

export const BOARD_COLUMNS: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "test_code_review",
  "test_qa",
  "test_security",
  "review",
  "done",
];
