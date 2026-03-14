import { db } from "@/db";
import { documents, documentTypes } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { createDocumentSchema } from "@/lib/validators";
import { generateId } from "@/lib/id";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const category = url.searchParams.get("category");

    const conditions = [];
    if (projectId) conditions.push(eq(documents.projectId, projectId));
    if (category) conditions.push(eq(documents.category, category));

    const result =
      conditions.length > 0
        ? db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.createdAt)).all()
        : db.select().from(documents).orderBy(desc(documents.createdAt)).all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createDocumentSchema.parse(body);

    // Derive category from document type if not provided
    let category: string = parsed.category ?? "";
    if (!category) {
      const docType = db.select().from(documentTypes).where(eq(documentTypes.id, parsed.type)).get();
      category = docType?.category ?? "reference";
    }

    const id = generateId();
    const now = new Date().toISOString();

    db.insert(documents)
      .values({
        id,
        ...parsed,
        category,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(documents).where(eq(documents.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
