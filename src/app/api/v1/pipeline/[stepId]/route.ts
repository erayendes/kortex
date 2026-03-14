import { db } from "@/db";
import { pipelineSteps } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { runPipeline } from "@/lib/engine/pipeline";
import { sseManager } from "@/lib/sse-manager";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await request.json();

    const step = db
      .select()
      .from(pipelineSteps)
      .where(eq(pipelineSteps.id, stepId))
      .get();
    if (!step) throw new NotFoundError("PipelineStep", stepId);

    const now = new Date().toISOString();

    if (body.status === "approved") {
      db.update(pipelineSteps)
        .set({ status: "approved", completedAt: now })
        .where(eq(pipelineSteps.id, stepId))
        .run();

      sseManager.broadcast(step.projectId, {
        type: "pipeline:step_approved",
        data: { stepId },
      });

      // Trigger next steps
      await runPipeline(step.projectId);
    } else if (body.status === "pending") {
      // Revision requested — reset to pending
      db.update(pipelineSteps)
        .set({ status: "pending", error: null, startedAt: null, completedAt: null })
        .where(eq(pipelineSteps.id, stepId))
        .run();
    } else {
      db.update(pipelineSteps)
        .set({ ...body, completedAt: now })
        .where(eq(pipelineSteps.id, stepId))
        .run();
    }

    const updated = db
      .select()
      .from(pipelineSteps)
      .where(eq(pipelineSteps.id, stepId))
      .get();

    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
