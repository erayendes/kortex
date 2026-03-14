import { db } from "@/db";
import { epics } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { createEpicSchema } from "@/lib/validators";
import { generateId } from "@/lib/id";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const result = projectId
      ? db.select().from(epics).where(eq(epics.projectId, projectId)).orderBy(desc(epics.createdAt)).all()
      : db.select().from(epics).orderBy(desc(epics.createdAt)).all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createEpicSchema.parse(body);

    const id = generateId();
    const now = new Date().toISOString();

    db.insert(epics).values({ id, ...parsed, createdAt: now, updatedAt: now }).run();

    const created = db.select().from(epics).where(eq(epics.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
