import { db } from "@/db";
import { tasks } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { createTaskSchema } from "@/lib/validators";
import { generateId } from "@/lib/id";
import { eq, asc, and, max } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const epicId = url.searchParams.get("epicId");

    const conditions = [];
    if (projectId) conditions.push(eq(tasks.projectId, projectId));
    if (status) conditions.push(eq(tasks.status, status));
    if (epicId) conditions.push(eq(tasks.epicId, epicId));

    const result =
      conditions.length > 0
        ? db.select().from(tasks).where(and(...conditions)).orderBy(asc(tasks.orderIndex)).all()
        : db.select().from(tasks).orderBy(asc(tasks.orderIndex)).all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.parse(body);

    const id = generateId();
    const testSteps = deriveTestSteps(parsed.labels);
    const now = new Date().toISOString();

    // Auto-assign sequential task number per project
    const maxResult = db
      .select({ maxNum: max(tasks.taskNumber) })
      .from(tasks)
      .where(eq(tasks.projectId, parsed.projectId))
      .get();
    const taskNumber = (maxResult?.maxNum ?? 0) + 1;

    db.insert(tasks)
      .values({
        id,
        ...parsed,
        taskNumber,
        labels: JSON.stringify(parsed.labels),
        testSteps: JSON.stringify(testSteps),
        dependencies: JSON.stringify({ blocks: [], blockedBy: [], related: [] }),
        status: "backlog",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(tasks).where(eq(tasks.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

function deriveTestSteps(labels: string[]): string[] {
  const steps: string[] = [];
  if (labels.includes("needs-code-review")) steps.push("code_review");
  if (labels.includes("needs-qa")) steps.push("qa");
  if (labels.includes("needs-security")) steps.push("security");
  return steps;
}
