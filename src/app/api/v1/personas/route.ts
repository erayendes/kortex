import { db } from "@/db";
import { personas } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tier = url.searchParams.get("tier");

    const result = tier
      ? db.select().from(personas).where(eq(personas.tier, tier)).all()
      : db.select().from(personas).all();

    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
