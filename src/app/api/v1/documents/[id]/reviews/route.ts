import { db } from "@/db";
import { documentReviews, documents } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { createDocumentReviewSchema } from "@/lib/validators";
import { generateId } from "@/lib/id";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = db
      .select()
      .from(documentReviews)
      .where(eq(documentReviews.documentId, id))
      .all();
    return Response.json({ data: reviews });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await request.json();
    const parsed = createDocumentReviewSchema.parse(body);

    const doc = db.select().from(documents).where(eq(documents.id, documentId)).get();
    if (!doc) throw new NotFoundError("Document", documentId);

    const reviewId = generateId();
    const now = new Date().toISOString();

    db.insert(documentReviews)
      .values({
        id: reviewId,
        documentId,
        reviewerPersonaId: parsed.reviewerPersonaId,
        status: parsed.status,
        comments: parsed.comments ? JSON.stringify(parsed.comments) : null,
        createdAt: now,
      })
      .run();

    // Update document status if approved
    if (parsed.status === "approved") {
      db.update(documents)
        .set({ status: "approved", updatedAt: now })
        .where(eq(documents.id, documentId))
        .run();
    }

    const review = db.select().from(documentReviews).where(eq(documentReviews.id, reviewId)).get();
    return Response.json({ data: review }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
