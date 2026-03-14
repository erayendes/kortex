import { db } from "@/db";
import { providers } from "@/db/schema";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const result = db.select().from(providers).all();

    // Mask credentials in response
    const masked = result.map((p) => ({
      ...p,
      credentials: p.credentials ? "••••••••" : null,
    }));

    return Response.json({ data: masked });
  } catch (error) {
    return errorResponse(error);
  }
}
