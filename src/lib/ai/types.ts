export interface AIProvider {
  id: string;
  generateText(prompt: string, options: GenerateOptions): Promise<GenerateResult>;
}

export interface GenerateOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface GenerateResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number; cost: number };
}
