import { z } from "zod";

// ── Projects ───────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  id: z.string().min(1).max(50),
  platform: z.enum(["web", "mobile", "api", "fullstack"]),
  repoUrl: z.string().url().optional().or(z.literal("")),
  defaultBranch: z.string().default("main"),
  gitSyncEnabled: z.boolean().default(false),
  defaultProviderId: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .omit({ id: true })
  .extend({ roadmap: z.string().optional(), status: z.enum(["setup", "kickoff", "development", "completed"]).optional() });

// ── Tasks ──────────────────────────────────────────────

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  epicId: z.string().optional(),
  type: z.enum(["story", "task", "bug"]),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assigneePersonaId: z.string().optional(),
  reporterPersonaId: z.string().optional(),
  priority: z.enum(["blocker", "high", "medium", "low"]).default("medium"),
  labels: z.array(z.string()).default([]),
  acceptanceCriteria: z.string().optional(),
  version: z.string().optional(),
});

const dependenciesSchema = z.object({
  blocks: z.array(z.string()).default([]),
  blockedBy: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
}).optional();

export const updateTaskSchema = createTaskSchema
  .partial()
  .omit({ projectId: true })
  .extend({ dependencies: dependenciesSchema });

export const transitionTaskSchema = z.object({
  toStatus: z.enum([
    "backlog",
    "todo",
    "in_progress",
    "test_code_review",
    "test_qa",
    "test_security",
    "review",
    "done",
  ]),
  personaId: z.string().min(1),
});

export const reorderTaskSchema = z.object({
  orderIndex: z.number().int().min(0),
  status: z.enum([
    "backlog",
    "todo",
    "in_progress",
    "test_code_review",
    "test_qa",
    "test_security",
    "review",
    "done",
  ]).optional(),
});

// ── Epics ──────────────────────────────────────────────

export const createEpicSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  version: z.string().optional(),
});

export const updateEpicSchema = createEpicSchema.partial().omit({ projectId: true });

// ── Documents ──────────────────────────────────────────

export const createDocumentSchema = z.object({
  projectId: z.string().min(1),
  category: z.enum(["reference", "report", "memory"]).optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(""),
  createdByPersonaId: z.string().min(1),
  approverPersonaId: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "in_review", "approved", "archived"]).optional(),
});

// ── Document Reviews ───────────────────────────────────

export const createDocumentReviewSchema = z.object({
  documentId: z.string().min(1),
  reviewerPersonaId: z.string().min(1),
  status: z.enum(["pending", "approved", "revision_requested"]),
  comments: z
    .array(
      z.object({
        id: z.string(),
        line: z.number(),
        text: z.string(),
      })
    )
    .default([]),
});

// ── Comments ───────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1),
  authorPersonaId: z.string().min(1),
});

// ── Handoffs ───────────────────────────────────────────

export const createHandoffSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  fromPersonaId: z.string().min(1),
  toPersonaId: z.string().min(1),
  message: z.string().min(1),
  context: z.string().optional(),
});

// ── Memory ─────────────────────────────────────────────

export const createMemorySchema = z.object({
  projectId: z.string().min(1),
  category: z.enum([
    "active-context",
    "handover",
    "decisions",
    "learned",
    "snippets",
  ]),
  title: z.string().min(1),
  content: z.string().default(""),
  createdByPersonaId: z.string().min(1),
});

export const updateMemorySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

// ── Commands ───────────────────────────────────────────

export const createCommandSchema = z.object({
  projectId: z.string().min(1),
  command: z.string().min(1),
  triggeredByPersonaId: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
});

// ── Providers ──────────────────────────────────────────

export const updateProviderSchema = z.object({
  credentials: z.string().optional(),
  isConnected: z.boolean().optional(),
});
