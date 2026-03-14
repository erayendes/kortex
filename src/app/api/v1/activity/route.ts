import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");

    const query = projectId
      ? db.select().from(activityLog).where(eq(activityLog.projectId, projectId))
      : db.select().from(activityLog);

    const result = query.orderBy(desc(activityLog.createdAt)).limit(limit).all();
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
