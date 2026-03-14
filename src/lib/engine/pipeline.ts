import { db } from "@/db";
import { pipelineSteps, documents, personas, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/id";
import { getProvider } from "@/lib/ai/provider-registry";
import { selectModel } from "@/lib/ai/cipher";
import { buildPrompt } from "@/lib/ai/prompt-builder";
import { sseManager } from "@/lib/sse-manager";

// Kickoff DAG step definitions
const KICKOFF_STEPS = [
  { order: 1, personaId: "project-manager", title: "Proje Planı", outputType: "project-plan", dependsOn: [] },
  { order: 2, personaId: "software-architect", title: "Mimari Tasarım", outputType: "architecture", dependsOn: ["project-manager"] },
  { order: 3, personaId: "tech-lead", title: "Teknik Lider Değerlendirmesi", outputType: "tech-assessment", dependsOn: ["software-architect"] },
  { order: 4, personaId: "frontend-developer", title: "Frontend Tasarım Dokümanı", outputType: "frontend-design", dependsOn: ["software-architect"] },
  { order: 5, personaId: "backend-developer", title: "Backend Tasarım Dokümanı", outputType: "backend-design", dependsOn: ["software-architect"] },
  { order: 6, personaId: "database-architect", title: "Veritabanı Şeması", outputType: "database-schema", dependsOn: ["software-architect"] },
  { order: 7, personaId: "api-developer", title: "API Spesifikasyonu", outputType: "api-spec", dependsOn: ["backend-developer"] },
  { order: 8, personaId: "devops-engineer", title: "DevOps Planı", outputType: "devops-plan", dependsOn: ["software-architect"] },
  { order: 9, personaId: "security-specialist", title: "Güvenlik Raporu", outputType: "security-report", dependsOn: ["software-architect"] },
  { order: 10, personaId: "qa-engineer", title: "Test Stratejisi", outputType: "test-strategy", dependsOn: ["tech-lead"] },
  { order: 11, personaId: "technical-writer", title: "Teknik Dokümantasyon Planı", outputType: "documentation-plan", dependsOn: ["tech-lead"] },
  { order: 12, personaId: "code-reviewer", title: "Code Review Kuralları", outputType: "review-rules", dependsOn: ["tech-lead"] },
  { order: 13, personaId: "performance-optimizer", title: "Performans Kriterleri", outputType: "performance-criteria", dependsOn: ["software-architect"] },
  { order: 14, personaId: "accessibility-specialist", title: "Erişilebilirlik Planı", outputType: "accessibility-plan", dependsOn: ["frontend-developer"] },
  { order: 15, personaId: "ux-researcher", title: "UX Araştırma Planı", outputType: "ux-research", dependsOn: ["frontend-developer"] },
];

export function initializeKickoffPipeline(projectId: string) {
  const stepIds: Record<string, string> = {};

  for (const step of KICKOFF_STEPS) {
    const id = generateId();
    stepIds[step.personaId] = id;

    const dependsOnIds = step.dependsOn.map((dep) => stepIds[dep]).filter(Boolean);

    db.insert(pipelineSteps)
      .values({
        id,
        projectId,
        workflowType: "kickoff",
        stepOrder: step.order,
        personaId: step.personaId,
        title: step.title,
        description: `${step.title} oluştur`,
        status: "pending",
        dependsOn: JSON.stringify(dependsOnIds),
        outputDocumentType: step.outputType,
      })
      .run();
  }

  return stepIds;
}

export async function runPipeline(projectId: string) {
  const steps = db
    .select()
    .from(pipelineSteps)
    .where(eq(pipelineSteps.projectId, projectId))
    .all();

  const completedIds = new Set(
    steps.filter((s) => s.status === "approved" || s.status === "awaiting_review").map((s) => s.id)
  );

  // Find ready steps (pending, all deps completed)
  const readySteps = steps.filter((s) => {
    if (s.status !== "pending") return false;
    const deps: string[] = JSON.parse(s.dependsOn ?? "[]");
    return deps.every((d) => completedIds.has(d));
  });

  // Execute ready steps in parallel
  const results = await Promise.allSettled(
    readySteps.map((step) => executeStep(step, projectId))
  );

  return results;
}

async function executeStep(
  step: typeof pipelineSteps.$inferSelect,
  projectId: string
) {
  // Mark as running
  db.update(pipelineSteps)
    .set({ status: "running", startedAt: new Date().toISOString() })
    .where(eq(pipelineSteps.id, step.id))
    .run();

  sseManager.broadcast(projectId, {
    type: "pipeline:step_started",
    data: { stepId: step.id, personaId: step.personaId },
  });

  try {
    // Get persona
    const persona = db
      .select()
      .from(personas)
      .where(eq(personas.id, step.personaId))
      .get();
    if (!persona) throw new Error(`Persona bulunamadı: ${step.personaId}`);

    // Get project
    const project = db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();
    if (!project) throw new Error(`Proje bulunamadı: ${projectId}`);

    // Select model via Cipher
    const modelId = selectModel({ description: step.description ?? "" });

    // Get input documents
    const inputDocIds: string[] = JSON.parse(step.inputDocumentIds ?? "[]");
    const inputDocs = inputDocIds
      .map((id) => db.select().from(documents).where(eq(documents.id, id)).get())
      .filter(Boolean)
      .map((d) => ({ title: d!.title, content: d!.content ?? "" }));

    // Build prompt
    const { system, user } = buildPrompt({
      personaName: persona.name,
      personaTitle: persona.title,
      personaDescription: persona.description,
      personaSkills: persona.skills,
      projectName: project.name,
      roadmap: project.roadmap,
      inputDocuments: inputDocs,
      taskDescription: step.description ?? step.title,
    });

    // Get provider from model
    let generatedText = `# ${step.title}\n\n[AI üretimi bekliyor — provider bağlı değil]\n\nBu doküman ${persona.name} (${persona.title}) tarafından oluşturulacak.`;

    if (modelId) {
      // Find provider for model
      const modelParts = modelId.split("-");
      const providerId = modelParts[0] === "claude" ? "claude" : modelParts[0] === "gpt" ? "openai" : "gemini";
      const provider = getProvider(providerId);

      if (provider) {
        const result = await provider.generateText(user, {
          model: modelId,
          systemPrompt: system,
          maxTokens: 4096,
        });
        generatedText = result.text;
      }
    }

    // Save generated document
    const docId = generateId();
    const now = new Date().toISOString();
    db.insert(documents)
      .values({
        id: docId,
        projectId,
        type: step.outputDocumentType ?? "report",
        title: step.title,
        content: generatedText,
        status: "in_review",
        category: "reference",
        createdByPersonaId: step.personaId,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // Update step
    db.update(pipelineSteps)
      .set({
        status: "awaiting_review",
        outputDocumentId: docId,
        modelId: modelId,
        completedAt: now,
      })
      .where(eq(pipelineSteps.id, step.id))
      .run();

    sseManager.broadcast(projectId, {
      type: "pipeline:step_completed",
      data: { stepId: step.id, documentId: docId },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Bilinmeyen hata";
    db.update(pipelineSteps)
      .set({ status: "failed", error, completedAt: new Date().toISOString() })
      .where(eq(pipelineSteps.id, step.id))
      .run();

    sseManager.broadcast(projectId, {
      type: "pipeline:step_failed",
      data: { stepId: step.id, error },
    });
  }
}
