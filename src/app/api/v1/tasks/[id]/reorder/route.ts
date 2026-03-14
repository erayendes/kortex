import { db } from "@/db";
import { tasks } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { reorderTaskSchema } from "@/lib/validators";
import { sseManager } from "@/lib/sse-manager";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = reorderTaskSchema.parse(body);

    const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!task) throw new NotFoundError("Task", id);

    const now = new Date().toISOString();
    db.update(tasks)
      .set({
        orderIndex: parsed.orderIndex,
        updatedAt: now,
      })
      .where(eq(tasks.id, id))
      .run();

    const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();

    // Broadcast reorder event
    sseManager.broadcast(task.projectId, {
      type: "task:reordered",
      data: { taskId: id, orderIndex: parsed.orderIndex },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
