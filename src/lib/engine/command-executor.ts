import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateBacklogTasks } from "@/app/api/v1/backlog/generate/route";

export interface CommandResult {
  success: boolean;
  message: string;
  action?: string;
  data?: Record<string, unknown>;
}

/**
 * Maps framework commands to workflow actions (spec §15).
 * Each command triggers a specific UI/backend workflow.
 */
export async function executeCommand(
  projectId: string,
  command: string,
  args?: string
): Promise<CommandResult> {
  switch (command) {
    case "!start":
      return handleStart(projectId);
    case "!refinement":
      return handleRefinement(projectId);
    case "!start-dev":
      return handleStartDev(projectId);
    case "!deploy":
      return handleDeploy(projectId);
    case "!approve":
      return handleApprove(projectId, args);
    case "!reject":
      return handleReject(projectId, args);
    case "!rollback":
      return handleRollback(projectId);
    default:
      return { success: false, message: `Bilinmeyen komut: ${command}` };
  }
}

async function handleStart(projectId: string): Promise<CommandResult> {
  // Set project status to kickoff
  db.update(projects)
    .set({ status: "kickoff", updatedAt: new Date().toISOString() })
    .where(eq(projects.id, projectId))
    .run();

  return {
    success: true,
    message: "Kickoff analizi başlatıldı",
    action: "pipeline:initialize",
  };
}

async function handleRefinement(projectId: string): Promise<CommandResult> {
  db.update(projects)
    .set({ status: "refinement", updatedAt: new Date().toISOString() })
    .where(eq(projects.id, projectId))
    .run();

  try {
    const { tasksCreated } = await generateBacklogTasks(projectId);
    return {
      success: true,
      message: `Backlog refinement başlatıldı. ${tasksCreated} görev oluşturuldu.`,
      action: "backlog:refine",
      data: { tasksCreated },
    };
  } catch (err) {
    console.error("[command-executor] Backlog generation failed:", err);
    return {
      success: true,
      message: "Backlog refinement başlatıldı (görev oluşturma başarısız).",
      action: "backlog:refine",
    };
  }
}

async function handleStartDev(projectId: string): Promise<CommandResult> {
  db.update(projects)
    .set({ status: "development", updatedAt: new Date().toISOString() })
    .where(eq(projects.id, projectId))
    .run();

  return {
    success: true,
    message: "Geliştirme modu aktif. Board'a geçiliyor.",
    action: "board:activate",
  };
}

async function handleDeploy(projectId: string): Promise<CommandResult> {
  db.update(projects)
    .set({ status: "deploying", updatedAt: new Date().toISOString() })
    .where(eq(projects.id, projectId))
    .run();

  return {
    success: true,
    message: "Deploy süreci başlatıldı",
    action: "deploy:start",
  };
}

async function handleApprove(
  projectId: string,
  args?: string
): Promise<CommandResult> {
  if (!args) {
    return {
      success: false,
      message: "Onaylanacak öğenin ID'si gerekli. Kullanım: !approve <id>",
    };
  }

  return {
    success: true,
    message: `${args} onaylandı`,
    action: "review:approve",
    data: { targetId: args },
  };
}

async function handleReject(
  projectId: string,
  args?: string
): Promise<CommandResult> {
  if (!args) {
    return {
      success: false,
      message: "Reddedilecek öğenin ID'si gerekli. Kullanım: !reject <id>",
    };
  }

  return {
    success: true,
    message: `${args} revize için geri gönderildi`,
    action: "review:reject",
    data: { targetId: args },
  };
}

async function handleRollback(projectId: string): Promise<CommandResult> {
  return {
    success: true,
    message: "Rollback başlatıldı",
    action: "deploy:rollback",
  };
}
