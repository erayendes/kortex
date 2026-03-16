import { db } from "@/db";
import { tasks, personas } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { personaId } = body as { personaId: string };

    if (!personaId) {
      return Response.json(
        { error: "personaId is required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!task) throw new NotFoundError("Task", id);

    // Verify persona exists
    const persona = db
      .select()
      .from(personas)
      .where(eq(personas.id, personaId))
      .get();
    if (!persona) throw new NotFoundError("Persona", personaId);

    const now = new Date().toISOString();
    db.update(tasks)
      .set({
        assigneePersonaId: personaId,
        updatedAt: now,
      })
      .where(eq(tasks.id, id))
      .run();

    const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();

    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
