import { db } from "@/db";
import { providers } from "@/db/schema";
import { errorResponse, NotFoundError } from "@/lib/errors";
import { updateProviderSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const provider = db.select().from(providers).where(eq(providers.id, id)).get();
    if (!provider) throw new NotFoundError("Provider", id);

    return Response.json({
      data: {
        ...provider,
        credentials: provider.credentials ? "••••••••" : null,
      },
    });
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
    const parsed = updateProviderSchema.parse(body);

    const existing = db.select().from(providers).where(eq(providers.id, id)).get();
    if (!existing) throw new NotFoundError("Provider", id);

    const updates: Record<string, unknown> = {};
    if (parsed.credentials !== undefined) {
      // TODO: Encrypt credentials with AES-256-GCM
      updates.credentials = parsed.credentials;
      updates.isConnected = true;
      updates.connectedAt = new Date().toISOString();
    }
    if (parsed.isConnected !== undefined) {
      updates.isConnected = parsed.isConnected;
      if (!parsed.isConnected) {
        updates.credentials = null;
        updates.connectedAt = null;
      }
    }

    db.update(providers).set(updates).where(eq(providers.id, id)).run();

    const updated = db.select().from(providers).where(eq(providers.id, id)).get();
    return Response.json({
      data: {
        ...updated,
        credentials: updated?.credentials ? "••••••••" : null,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
