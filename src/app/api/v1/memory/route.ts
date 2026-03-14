import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memoryEntries } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "@/lib/id";
import { z } from "zod";

const createSchema = z.object({
  projectId: z.string(),
  category: z.enum([
    "active-context",
    "handover",
    "decisions",
    "learned",
    "snippets",
  ]),
  title: z.string().min(1),
  content: z.string().default(""),
  createdByPersonaId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const category = searchParams.get("category");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const conditions = [
    eq(memoryEntries.projectId, projectId),
    eq(memoryEntries.isArchived, false),
  ];

  if (category) {
    conditions.push(eq(memoryEntries.category, category));
  }

  const entries = db
    .select()
    .from(memoryEntries)
    .where(and(...conditions))
    .orderBy(desc(memoryEntries.updatedAt))
    .all();

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.parse(body);

  const id = generateId();
  const now = new Date().toISOString();

  db.insert(memoryEntries)
    .values({
      id,
      projectId: parsed.projectId,
      category: parsed.category,
      title: parsed.title,
      content: parsed.content,
      createdByPersonaId: parsed.createdByPersonaId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const entry = db
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.id, id))
    .get();

  return NextResponse.json(entry, { status: 201 });
}
