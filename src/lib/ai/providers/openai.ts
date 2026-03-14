import OpenAI from "openai";
import type { AIProvider, GenerateOptions, GenerateResult } from "../types";

export class OpenAIProvider implements AIProvider {
  id = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const response = await this.client.chat.completions.create({
      model: options.model || "gpt-4o",
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages: [
        ...(options.systemPrompt
          ? [{ role: "system" as const, content: options.systemPrompt }]
          : []),
        { role: "user" as const, content: prompt },
      ],
    });

    return {
      text: response.choices[0]?.message?.content ?? "",
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        cost: 0,
      },
    };
  }
}
