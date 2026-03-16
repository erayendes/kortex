import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { commands } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/id";
import { z } from "zod";
import { executeCommand } from "@/lib/engine/command-executor";

const createSchema = z.object({
  projectId: z.string(),
  command: z.enum([
    "!start",
    "!refinement",
    "!start-dev",
    "!deploy",
    "!approve",
    "!reject",
    "!rollback",
  ]),
  args: z.string().optional(),
  triggeredByPersonaId: z.string(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const cmds = db
    .select()
    .from(commands)
    .where(eq(commands.projectId, projectId))
    .orderBy(desc(commands.createdAt))
    .all();

  return NextResponse.json(cmds);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const id = generateId();
    const now = new Date().toISOString();

    db.insert(commands)
      .values({
        id,
        projectId: parsed.projectId,
        command: parsed.command,
        args: parsed.args ?? null,
        triggeredByPersonaId: parsed.triggeredByPersonaId,
        status: "running",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const result = await executeCommand(parsed.projectId, parsed.command, parsed.args);

    db.update(commands)
      .set({
        status: result.success ? "completed" : "failed",
        result: JSON.stringify(result),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(commands.id, id))
      .run();

    const cmd = db.select().from(commands).where(eq(commands.id, id)).get();
    return NextResponse.json({ data: cmd }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[commands POST]", err);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
