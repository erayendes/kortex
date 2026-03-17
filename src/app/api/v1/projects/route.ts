import { db } from "@/db";
import { projects } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { generateId } from "@/lib/id";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

// Inline schema — no import from validators to avoid stale cache issues
const newProjectSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(["web", "mobile", "api", "fullstack"]),
  repoUrl: z.string().url().optional().or(z.literal("")).optional(),
  defaultBranch: z.string().default("main"),
  gitSyncEnabled: z.boolean().default(false),
});

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
    const parsed = newProjectSchema.parse(body);
    const id = generateId("PRJ");
    const now = new Date().toISOString();

    db.insert(projects)
      .values({
        id,
        name: parsed.name,
        platform: parsed.platform,
        repoUrl: parsed.repoUrl ?? null,
        defaultBranch: parsed.defaultBranch,
        gitSyncEnabled: parsed.gitSyncEnabled,
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
