import { db } from "@/db";
import { generateId } from "@/lib/id";
import { projects } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { createProjectSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .all();
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.parse(body);
    const id = generateId("PRJ");

    const now = new Date().toISOString();
    db.insert(projects)
      .values({
        id,
        ...parsed,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(projects).where(eq(projects.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
