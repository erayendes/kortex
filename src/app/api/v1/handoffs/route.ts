import { db } from "@/db";
import { handoffs } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { createHandoffSchema } from "@/lib/validators";
import { generateId } from "@/lib/id";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const result = projectId
      ? db.select().from(handoffs).where(eq(handoffs.projectId, projectId)).orderBy(desc(handoffs.createdAt)).all()
      : db.select().from(handoffs).orderBy(desc(handoffs.createdAt)).all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createHandoffSchema.parse(body);

    const id = generateId();
    const now = new Date().toISOString();

    db.insert(handoffs)
      .values({
        id,
        ...parsed,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(handoffs).where(eq(handoffs.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
