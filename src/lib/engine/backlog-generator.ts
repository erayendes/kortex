import { db } from "@/db";
import { projects, documents, tasks } from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import { getActiveProviders } from "@/lib/ai/provider-registry";
import { generateId } from "@/lib/id";

interface RawTask {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  acceptanceCriteria?: string;
}

const FALLBACK_TASKS: RawTask[] = [
  { title: "Proje kurulumu ve environment konfigürasyonu", type: "task", priority: "high" },
  { title: "Veritabanı şeması tasarımı", type: "task", priority: "high" },
  { title: "Authentication sistemi", type: "story", priority: "high" },
  { title: "Core API endpointleri", type: "story", priority: "high" },
  { title: "Frontend temel yapısı", type: "story", priority: "medium" },
  { title: "Unit test altyapısı", type: "task", priority: "medium" },
  { title: "CI/CD pipeline", type: "task", priority: "medium" },
  { title: "Dokümantasyon", type: "task", priority: "low" },
];

const VALID_TYPES = ["task", "story", "bug", "subtask", "epic"] as const;
const VALID_PRIORITIES = ["critical", "high", "medium", "low"] as const;

type TaskType = (typeof VALID_TYPES)[number];
type TaskPriority = (typeof VALID_PRIORITIES)[number];

function sanitizeType(val: unknown): TaskType {
  if (typeof val === "string" && VALID_TYPES.includes(val as TaskType)) {
    return val as TaskType;
  }
  return "task";
}

function sanitizePriority(val: unknown): TaskPriority {
  if (typeof val === "string" && VALID_PRIORITIES.includes(val as TaskPriority)) {
    return val as TaskPriority;
  }
  return "medium";
}

function parseAIResponse(text: string): RawTask[] {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("AI response is not a JSON array");
  return parsed as RawTask[];
}

export async function generateBacklogTasks(projectId: string): Promise<{
  tasksCreated: number;
  tasks: unknown[];
}> {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) throw new NotFoundError("Project", projectId);

  const projectDocs = db
    .select()
    .from(documents)
    .where(eq(documents.projectId, projectId))
    .all();

  const priorityTypes = ["project-plan", "architecture", "frontend-design", "requirements"];
  const relevantDocs = projectDocs
    .filter((d) => priorityTypes.includes(d.type) && d.content)
    .slice(0, 5);
  const docsForPrompt =
    relevantDocs.length > 0 ? relevantDocs : projectDocs.filter((d) => d.content).slice(0, 3);

  let rawTasks: RawTask[] = [];
  let usedAI = false;

  const providers = getActiveProviders();
  if (providers.length > 0) {
    const provider = providers[0];
    const documentSummaries =
      docsForPrompt.length > 0
        ? docsForPrompt.map((d) => `## ${d.title}\n${d.content.slice(0, 1500)}`).join("\n\n")
        : "(No documents available yet)";

    const systemPrompt =
      "You are a technical project manager. Generate a structured list of development tasks for the given project. Return ONLY valid JSON, no markdown, no explanation.";
    const userPrompt =
      `Project: ${project.name}\n\nProject documents:\n${documentSummaries}\n\n` +
      `Generate 15-25 development tasks as a JSON array. Each task must have: ` +
      `title (string), description (string), type ('task'|'story'|'bug'), ` +
      `priority ('critical'|'high'|'medium'|'low'), acceptanceCriteria (string). ` +
      `Return ONLY the JSON array.`;

    try {
      const modelMap: Record<string, string> = {
        claude: "claude-opus-4-5",
        openai: "gpt-4o-mini",
        gemini: "gemini-2.0-flash",
      };
      const model = modelMap[provider.id] ?? "claude-opus-4-5";
      const result = await provider.generateText(userPrompt, {
        model,
        maxTokens: 4096,
        temperature: 0.5,
        systemPrompt,
      });
      rawTasks = parseAIResponse(result.text);
      usedAI = true;
    } catch (aiError) {
      console.error("[backlog-generator] AI generation failed, using fallback:", aiError);
    }
  }

  if (!usedAI || rawTasks.length === 0) {
    rawTasks = FALLBACK_TASKS.map((t) => ({
      ...t,
      description: `${t.title} — ${project.name} projesi için gerekli görev.`,
      acceptanceCriteria: "Görev başarıyla tamamlanmış ve test edilmiş olmalıdır.",
    }));
  }

  const maxResult = db
    .select({ maxNum: max(tasks.taskNumber) })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .get();
  const baseTaskNumber = (maxResult?.maxNum ?? 0) + 1;

  const now = new Date().toISOString();
  const insertValues = rawTasks.map((raw, idx) => ({
    id: generateId(),
    projectId,
    title: String(raw.title ?? "Untitled Task"),
    description: raw.description ? String(raw.description) : null,
    type: sanitizeType(raw.type),
    status: "backlog" as const,
    priority: sanitizePriority(raw.priority),
    acceptanceCriteria: raw.acceptanceCriteria ? String(raw.acceptanceCriteria) : null,
    labels: "[]",
    testSteps: "[]",
    dependencies: JSON.stringify({ blocks: [], blockedBy: [], related: [] }),
    taskNumber: baseTaskNumber + idx,
    orderIndex: baseTaskNumber + idx - 1,
    createdAt: now,
    updatedAt: now,
  }));

  for (const val of insertValues) {
    db.insert(tasks).values(val).run();
  }

  const insertedIds = insertValues.map((v) => v.id);
  const inserted = db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .all()
    .filter((t) => insertedIds.includes(t.id));

  return { tasksCreated: inserted.length, tasks: inserted };
}
