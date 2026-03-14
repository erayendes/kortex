import { db } from "@/db";
import { tasks } from "@/db/schema";
import { errorResponse, ValidationError } from "@/lib/errors";
import { eq, asc } from "drizzle-orm";
import { BOARD_COLUMNS } from "@/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) throw new ValidationError("projectId query param required");

    const allTasks = db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.orderIndex))
      .all();

    const columns = BOARD_COLUMNS.map((status) => ({
      id: status,
      tasks: allTasks.filter((t) => t.status === status),
    }));

    return Response.json({ data: { columns } });
  } catch (error) {
    return errorResponse(error);
  }
}
