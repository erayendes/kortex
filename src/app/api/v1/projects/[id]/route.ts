import { db } from "@/db";
import { projects } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { updateProjectSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) throw new NotFoundError("Project", id);
    return Response.json({ data: project });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProjectSchema.parse(body);

    const existing = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!existing) throw new NotFoundError("Project", id);

    db.update(projects)
      .set({ ...parsed, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id))
      .run();

    const updated = db.select().from(projects).where(eq(projects.id, id)).get();
    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
