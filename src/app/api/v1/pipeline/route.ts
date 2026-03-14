import { db } from "@/db";
import { pipelineSteps } from "@/db/schema";
import { errorResponse, ValidationError } from "@/lib/errors";
import { initializeKickoffPipeline, runPipeline } from "@/lib/engine/pipeline";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) throw new ValidationError("projectId query param required");

    const steps = db
      .select()
      .from(pipelineSteps)
      .where(eq(pipelineSteps.projectId, projectId))
      .all();

    return Response.json({ data: steps });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, workflowType } = body;

    if (!projectId) throw new ValidationError("projectId is required");

    // Check if pipeline already exists
    const existing = db
      .select()
      .from(pipelineSteps)
      .where(
        and(
          eq(pipelineSteps.projectId, projectId),
          eq(pipelineSteps.workflowType, workflowType ?? "kickoff")
        )
      )
      .all();

    if (existing.length > 0) {
      // Pipeline exists — run it (execute ready steps)
      await runPipeline(projectId);
      const steps = db
        .select()
        .from(pipelineSteps)
        .where(eq(pipelineSteps.projectId, projectId))
        .all();
      return Response.json({ data: steps });
    }

    // Initialize new pipeline
    initializeKickoffPipeline(projectId);

    // Run first batch
    await runPipeline(projectId);

    const steps = db
      .select()
      .from(pipelineSteps)
      .where(eq(pipelineSteps.projectId, projectId))
      .all();

    return Response.json({ data: steps }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
