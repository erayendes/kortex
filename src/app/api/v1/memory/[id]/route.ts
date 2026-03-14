import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memoryEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  category: z
    .enum(["active-context", "handover", "decisions", "learned", "snippets"])
    .optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entry = db
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.id, id))
    .get();

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.parse(body);

  const existing = db
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.update(memoryEntries)
    .set({
      ...parsed,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(memoryEntries.id, id))
    .run();

  const updated = db
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.id, id))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Soft delete — archive
  db.update(memoryEntries)
    .set({ isArchived: true, updatedAt: new Date().toISOString() })
    .where(eq(memoryEntries.id, id))
    .run();

  return NextResponse.json({ success: true });
}
