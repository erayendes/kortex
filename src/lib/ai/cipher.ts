import { db } from "@/db";
import { models, providers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CipherInput {
  description?: string;
  complexity?: number; // 1-10 override
}

type ModelCategory = "powerful" | "balanced" | "fast";

export function selectModel(input: CipherInput): string | null {
  const complexity = input.complexity ?? estimateComplexity(input.description ?? "");
  const category = complexityToCategory(complexity);

  // Find a connected provider's model in the right category
  const allModels = db.select().from(models).all();
  const connectedProviders = db
    .select()
    .from(providers)
    .all()
    .filter((p) => p.isConnected && p.credentials);

  const connectedProviderIds = new Set(connectedProviders.map((p) => p.id));

  // Prefer models from connected providers in the target category
  const candidates = allModels.filter(
    (m) => m.category === category && connectedProviderIds.has(m.providerId)
  );

  if (candidates.length > 0) return candidates[0].id;

  // Fallback: any connected model
  const fallback = allModels.find((m) => connectedProviderIds.has(m.providerId));
  return fallback?.id ?? null;
}

function estimateComplexity(description: string): number {
  let score = 5;
  const lower = description.toLowerCase();
  if (lower.includes("architecture") || lower.includes("design")) score += 2;
  if (lower.includes("security") || lower.includes("güvenlik")) score += 1;
  if (lower.includes("simple") || lower.includes("basit")) score -= 2;
  if (lower.includes("complex") || lower.includes("karmaşık")) score += 2;
  if (description.length > 500) score += 1;
  if (description.length < 100) score -= 1;
  return Math.max(1, Math.min(10, score));
}

function complexityToCategory(score: number): ModelCategory {
  if (score >= 8) return "powerful";
  if (score >= 4) return "balanced";
  return "fast";
}
