import { db } from "@/db";
import { personas } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Action =
  | "task:create"
  | "task:transition"
  | "task:assign"
  | "task:delete"
  | "document:approve"
  | "document:review"
  | "pipeline:start"
  | "pipeline:approve_step"
  | "backlog:transfer"
  | "project:create"
  | "project:update"
  | "command:execute";

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// Tier-based permission matrix
const TIER_PERMISSIONS: Record<string, Action[]> = {
  lead: [
    "task:create",
    "task:transition",
    "task:assign",
    "task:delete",
    "document:approve",
    "document:review",
    "pipeline:start",
    "pipeline:approve_step",
    "backlog:transfer",
    "project:create",
    "project:update",
    "command:execute",
  ],
  senior: [
    "task:create",
    "task:transition",
    "task:assign",
    "document:review",
    "document:approve",
    "pipeline:approve_step",
    "command:execute",
  ],
  mid: [
    "task:create",
    "task:transition",
    "document:review",
  ],
  junior: [
    "task:transition",
    "document:review",
  ],
};

/**
 * Check if a persona has permission to perform an action.
 * Prime (the user) always has full access.
 */
export function checkPermission(
  personaId: string,
  action: Action
): PermissionResult {
  // Prime always has full access
  if (personaId === "prime") {
    return { allowed: true };
  }

  const persona = db
    .select()
    .from(personas)
    .where(eq(personas.id, personaId))
    .get();

  if (!persona) {
    return { allowed: false, reason: "Persona bulunamadı" };
  }

  const tierActions = TIER_PERMISSIONS[persona.tier] || [];

  if (!tierActions.includes(action)) {
    return {
      allowed: false,
      reason: `${persona.name} (${persona.tier}) bu işlem için yetkilendirilmemiş: ${action}`,
    };
  }

  // Check write permissions for task/document actions
  if (action.startsWith("document:") || action === "task:create") {
    const writePerms = persona.writePermissions
      ? JSON.parse(persona.writePermissions)
      : [];
    // Write permissions are checked but not blocking for now
    // In production, this would check specific resource types
  }

  return { allowed: true };
}

/**
 * Assert permission — throws if not allowed.
 */
export function assertPermission(personaId: string, action: Action): void {
  const result = checkPermission(personaId, action);
  if (!result.allowed) {
    throw new Error(result.reason || "Yetkisiz işlem");
  }
}
