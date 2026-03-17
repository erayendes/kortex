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
    const id = generateId("PRJ");
    // Inject id before parse so both old (id required) and new (id optional) schemas work
    const parsed = createProjectSchema.parse({ id, ...body });
    const finalId: string = (parsed as { id?: string }).id ?? id;

    const now = new Date().toISOString();
    db.insert(projects)
      .values({
        id: finalId,
        name: parsed.name,
        platform: parsed.platform,
        repoUrl: parsed.repoUrl ?? null,
        defaultBranch: parsed.defaultBranch,
        gitSyncEnabled: parsed.gitSyncEnabled,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(projects).where(eq(projects.id, finalId)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
