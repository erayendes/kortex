import { db } from "@/db";
import { documents } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { updateDocumentSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = db.select().from(documents).where(eq(documents.id, id)).get();
    if (!doc) throw new NotFoundError("Document", id);
    return Response.json({ data: doc });
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
    const parsed = updateDocumentSchema.parse(body);

    const existing = db.select().from(documents).where(eq(documents.id, id)).get();
    if (!existing) throw new NotFoundError("Document", id);

    db.update(documents)
      .set({ ...parsed, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .run();

    const updated = db.select().from(documents).where(eq(documents.id, id)).get();
    return Response.json({ data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
