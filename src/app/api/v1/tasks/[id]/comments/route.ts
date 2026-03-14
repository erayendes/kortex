import { db } from "@/db";
import { comments, tasks } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { createCommentSchema } from "@/lib/validators";
import { generateId } from "@/lib/id";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!task) throw new NotFoundError("Task", id);

    const result = db
      .select()
      .from(comments)
      .where(eq(comments.taskId, id))
      .orderBy(asc(comments.createdAt))
      .all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
    if (!task) throw new NotFoundError("Task", taskId);

    const body = await request.json();
    const parsed = createCommentSchema.parse(body);

    const id = generateId();
    const now = new Date().toISOString();

    db.insert(comments)
      .values({
        id,
        projectId: task.projectId,
        taskId,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(comments).where(eq(comments.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
