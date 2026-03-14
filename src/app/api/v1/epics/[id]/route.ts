import { db } from "@/db";
import { epics, tasks } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { updateEpicSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const epic = db.select().from(epics).where(eq(epics.id, id)).get();
    if (!epic) throw new NotFoundError("Epic", id);

    const epicTasks = db.select().from(tasks).where(eq(tasks.epicId, id)).all();
    return Response.json({ data: { ...epic, tasks: epicTasks } });
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
    const parsed = updateEpicSchema.parse(body);

    const existing = db.select().from(epics).where(eq(epics.id, id)).get();
    if (!existing) throw new NotFoundError("Epic", id);

    db.update(epics)
      .set({ ...parsed, updatedAt: new Date().toISOString() })
      .where(eq(epics.id, id))
      .run();

    const updated = db.select().from(epics).where(eq(epics.id, id)).get();
    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
