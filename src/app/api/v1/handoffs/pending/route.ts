import { db } from "@/db";
import { handoffs } from "@/db/schema";
import { errorResponse, ValidationError } from "@/lib/errors";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const personaId = url.searchParams.get("persona_id");
    if (!personaId) throw new ValidationError("persona_id query param required");

    const result = db
      .select()
      .from(handoffs)
      .where(
        and(
          eq(handoffs.toPersonaId, personaId),
          eq(handoffs.status, "pending")
        )
      )
      .all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
