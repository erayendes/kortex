import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Helper ─────────────────────────────────────────────

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
};

// ── Projects ───────────────────────────────────────────

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("setup"),
  repoUrl: text("repo_url"),
  defaultBranch: text("default_branch").notNull().default("main"),
  gitSyncEnabled: integer("git_sync_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  roadmap: text("roadmap"),
  ...timestamps,
});

// ── AI Providers ───────────────────────────────────────

export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  authType: text("auth_type").notNull(),
  credentials: text("credentials"),
  isConnected: integer("is_connected", { mode: "boolean" })
    .notNull()
    .default(false),
  connectedAt: text("connected_at"),
});

export const models = sqliteTable("models", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => providers.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  costTier: text("cost_tier").notNull(),
  contextWindow: integer("context_window").notNull(),
  isAvailable: integer("is_available", { mode: "boolean" })
    .notNull()
    .default(true),
});

// ── Personas ───────────────────────────────────────────

export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  tier: text("tier").notNull(),
  decisionLevel: text("decision_level").notNull(),
  parentId: text("parent_id"),
  emoji: text("emoji"),
  description: text("description"),
  skills: text("skills"),
  writePermissions: text("write_permissions"),
  readPermissions: text("read_permissions"),
});

export const personaHierarchy = sqliteTable("persona_hierarchy", {
  personaId: text("persona_id")
    .primaryKey()
    .references(() => personas.id),
  managerId: text("manager_id").references(() => personas.id),
  escalationChain: text("escalation_chain"),
  canDelegateToIds: text("can_delegate_to_ids"),
});

// ── Project-Provider Links ─────────────────────────────

export const projectProviders = sqliteTable("project_providers", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  providerId: text("provider_id")
    .notNull()
    .references(() => providers.id),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const projectModelConfig = sqliteTable("project_model_config", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  modelId: text("model_id")
    .notNull()
    .references(() => models.id),
});

// ── Epics ──────────────────────────────────────────────

export const epics = sqliteTable("epics", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  branch: text("branch"),
  version: text("version"),
  ...timestamps,
});

// ── Tasks ──────────────────────────────────────────────

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  epicId: text("epic_id").references(() => epics.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("backlog"),
  priority: text("priority").notNull().default("medium"),
  assigneePersonaId: text("assignee_persona_id").references(() => personas.id),
  reporterPersonaId: text("reporter_persona_id").references(() => personas.id),
  labels: text("labels").default("[]"),
  testSteps: text("test_steps").default("[]"),
  currentTestStep: text("current_test_step"),
  dependencies: text("dependencies").default(
    '{"blocks":[],"blockedBy":[],"related":[]}'
  ),
  acceptanceCriteria: text("acceptance_criteria"),
  version: text("version"),
  branch: text("branch"),
  orderIndex: integer("order_index").notNull().default(0),
  ...timestamps,
});

export const taskReviewers = sqliteTable("task_reviewers", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  isApproved: integer("is_approved", { mode: "boolean" })
    .notNull()
    .default(false),
  reviewedAt: text("reviewed_at"),
});

// ── Documents ──────────────────────────────────────────

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  category: text("category").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdByPersonaId: text("created_by_persona_id").references(
    () => personas.id
  ),
  approverPersonaId: text("approver_persona_id").references(() => personas.id),
  version: integer("version").notNull().default(1),
  approvedAt: text("approved_at"),
  ...timestamps,
});

export const documentTypes = sqliteTable("document_types", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  ownerPersonaId: text("owner_persona_id").notNull(),
  reviewerPersonaId: text("reviewer_persona_id"),
  approverPersonaId: text("approver_persona_id"),
  template: text("template"),
});

export const documentReviews = sqliteTable("document_reviews", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  reviewerPersonaId: text("reviewer_persona_id")
    .notNull()
    .references(() => personas.id),
  status: text("status").notNull().default("pending"),
  comments: text("comments").default("[]"),
  ...timestamps,
});

// ── Pipeline ───────────────────────────────────────────

export const pipelineSteps = sqliteTable("pipeline_steps", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  workflowType: text("workflow_type").notNull(),
  stepOrder: integer("step_order").notNull(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  dependsOn: text("depends_on").default("[]"),
  inputDocumentIds: text("input_document_ids").default("[]"),
  outputDocumentId: text("output_document_id"),
  outputDocumentType: text("output_document_type"),
  modelId: text("model_id"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  error: text("error"),
});

export const agentExecutions = sqliteTable("agent_executions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  taskId: text("task_id").references(() => tasks.id),
  pipelineStepId: text("pipeline_step_id").references(() => pipelineSteps.id),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  modelId: text("model_id"),
  status: text("status").notNull().default("running"),
  logs: text("logs").default(""),
  tokenUsage: text("token_usage"),
  startedAt: text("started_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

// ── Handoffs ───────────────────────────────────────────

export const handoffs = sqliteTable("handoffs", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  taskId: text("task_id").references(() => tasks.id),
  fromPersonaId: text("from_persona_id")
    .notNull()
    .references(() => personas.id),
  toPersonaId: text("to_persona_id")
    .notNull()
    .references(() => personas.id),
  message: text("message").notNull(),
  context: text("context"),
  status: text("status").notNull().default("pending"),
  ...timestamps,
});

// ── Memory ─────────────────────────────────────────────

export const memoryEntries = sqliteTable("memory_entries", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdByPersonaId: text("created_by_persona_id").references(
    () => personas.id
  ),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  ...timestamps,
});

// ── Commands ───────────────────────────────────────────

export const commands = sqliteTable("commands", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  command: text("command").notNull(),
  args: text("args"),
  triggeredByPersonaId: text("triggered_by_persona_id")
    .notNull()
    .references(() => personas.id),
  status: text("status").notNull().default("pending"),
  result: text("result"),
  ...timestamps,
});

// ── Activity Log ───────────────────────────────────────

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  eventType: text("event_type").notNull(),
  actorPersonaId: text("actor_persona_id").references(() => personas.id),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── Comments ───────────────────────────────────────────

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  authorPersonaId: text("author_persona_id")
    .notNull()
    .references(() => personas.id),
  content: text("content").notNull(),
  ...timestamps,
});

// ── Access Config ──────────────────────────────────────

export const accessConfig = sqliteTable("access_config", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  serviceName: text("service_name").notNull(),
  serviceCategory: text("service_category").notNull(),
  configData: text("config_data"),
  secretKeys: text("secret_keys"),
  isProvisioned: integer("is_provisioned", { mode: "boolean" })
    .notNull()
    .default(false),
  requiredByPersonaId: text("required_by_persona_id"),
  notes: text("notes"),
  ...timestamps,
});
