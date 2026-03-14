import { db } from "@/db";
import { tasks, personas } from "@/db/schema";
import { errorResponse, NotFoundError, TransitionError } from "@/lib/errors";
import { transitionTaskSchema } from "@/lib/validators";
import { validateTransition } from "@/lib/engine/transition";
import { sseManager } from "@/lib/sse-manager";
import { eq } from "drizzle-orm";
import type { TaskStatus, PersonaTier } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = transitionTaskSchema.parse(body);

    // Get task
    const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!task) throw new NotFoundError("Task", id);

    // Get persona
    const persona = db
      .select()
      .from(personas)
      .where(eq(personas.id, parsed.personaId))
      .get();
    if (!persona) throw new NotFoundError("Persona", parsed.personaId);

    // Validate transition
    const result = validateTransition(
      {
        id: task.id,
        status: task.status as TaskStatus,
        assigneePersonaId: task.assigneePersonaId,
        testSteps: task.testSteps ?? "[]",
        currentTestStep: task.currentTestStep,
      },
      parsed.toStatus as TaskStatus,
      {
        id: persona.id,
        tier: persona.tier as PersonaTier,
      }
    );

    if (!result.valid) {
      throw new TransitionError(result.reason ?? "Geçiş yapılamadı");
    }

    const now = new Date().toISOString();
    db.update(tasks)
      .set({
        status: result.newStatus,
        currentTestStep: result.newTestStep ?? null,
        updatedAt: now,
      })
      .where(eq(tasks.id, id))
      .run();

    const updated = db.select().from(tasks).where(eq(tasks.id, id)).get();

    // Broadcast SSE event
    sseManager.broadcast(task.projectId, {
      type: "task:moved",
      data: {
        taskId: id,
        from: task.status,
        to: result.newStatus,
        personaId: parsed.personaId,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
