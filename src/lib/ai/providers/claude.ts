import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, GenerateOptions, GenerateResult } from "../types";

export class ClaudeProvider implements AIProvider {
  id = "claude";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const response = await this.client.messages.create({
      model: options.model || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt ?? "",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cost: 0, // Calculate based on model pricing
      },
    };
  }
}
