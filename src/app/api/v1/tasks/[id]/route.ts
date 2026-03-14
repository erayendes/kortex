import { db } from "@/db";
import { tasks } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { updateTaskSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!task) throw new NotFoundError("Task", id);
    return Response.json({ data: task });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskSchema.parse(body);

    const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!existing) throw new NotFoundError("Task", id);

    const updates: Record<string, unknown> = {
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    if (parsed.labels) updates.labels = JSON.stringify(parsed.labels);

    db.update(tasks).set(updates).where(eq(tasks.id, id)).run();

    const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();
    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
