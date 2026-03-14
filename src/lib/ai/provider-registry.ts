import { db } from "@/db";
import { providers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AIProvider } from "./types";
import { ClaudeProvider } from "./providers/claude";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export function getProvider(providerId: string): AIProvider | null {
  const provider = db
    .select()
    .from(providers)
    .where(eq(providers.id, providerId))
    .get();

  if (!provider || !provider.isConnected || !provider.credentials) {
    return null;
  }

  switch (providerId) {
    case "claude":
      return new ClaudeProvider(provider.credentials);
    case "openai":
      return new OpenAIProvider(provider.credentials);
    case "gemini":
      return new GeminiProvider(provider.credentials);
    default:
      return null;
  }
}

export function getActiveProviders(): AIProvider[] {
  const allProviders = db.select().from(providers).all();
  const result: AIProvider[] = [];
  for (const p of allProviders) {
    if (!p.isConnected || !p.credentials) continue;
    switch (p.id) {
      case "claude":
        result.push(new ClaudeProvider(p.credentials));
        break;
      case "openai":
        result.push(new OpenAIProvider(p.credentials));
        break;
      case "gemini":
        result.push(new GeminiProvider(p.credentials));
        break;
    }
  }
  return result;
}
