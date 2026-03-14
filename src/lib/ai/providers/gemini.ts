import { GoogleGenAI } from "@google/genai";
import type { AIProvider, GenerateOptions, GenerateResult } from "../types";

export class GeminiProvider implements AIProvider {
  id = "gemini";
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateText(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    const response = await this.client.models.generateContent({
      model: options.model || "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        maxOutputTokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      },
    });

    return {
      text: response.text ?? "",
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        cost: 0,
      },
    };
  }
}
