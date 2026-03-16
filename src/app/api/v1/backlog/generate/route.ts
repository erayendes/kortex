import { errorResponse, ValidationError } from "@/lib/errors";
import { generateBacklogTasks } from "@/lib/engine/backlog-generator";

export { generateBacklogTasks };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body ?? {};

    if (!projectId || typeof projectId !== "string") {
      throw new ValidationError("projectId is required");
    }

    const result = await generateBacklogTasks(projectId);

    return Response.json({ data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
