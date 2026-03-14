interface PromptContext {
  personaName: string;
  personaTitle: string;
  personaDescription: string | null;
  personaSkills: string | null;
  projectName: string;
  roadmap: string | null;
  inputDocuments: { title: string; content: string }[];
  taskDescription: string;
  outputFormat?: string;
}

export function buildPrompt(ctx: PromptContext): { system: string; user: string } {
  const skills = ctx.personaSkills
    ? `\nBeceriler: ${ctx.personaSkills}`
    : "";

  const system = [
    `Sen "${ctx.personaName}" rolündesin — ${ctx.personaTitle}.`,
    ctx.personaDescription ? `\n${ctx.personaDescription}` : "",
    skills,
    `\nProje: ${ctx.projectName}`,
    `\nTüm çıktıları Türkçe yaz. Markdown formatında dön.`,
  ]
    .filter(Boolean)
    .join("");

  const inputDocs =
    ctx.inputDocuments.length > 0
      ? "\n\n## Girdi Dokümanları\n\n" +
        ctx.inputDocuments
          .map((d) => `### ${d.title}\n${d.content}`)
          .join("\n\n")
      : "";

  const roadmapSection = ctx.roadmap
    ? `\n\n## Ürün Yol Haritası\n${ctx.roadmap}`
    : "";

  const formatSection = ctx.outputFormat
    ? `\n\n## Beklenen Çıktı Formatı\n${ctx.outputFormat}`
    : "";

  const user = [
    `## Görev\n${ctx.taskDescription}`,
    roadmapSection,
    inputDocs,
    formatSection,
  ].join("");

  return { system, user };
}
