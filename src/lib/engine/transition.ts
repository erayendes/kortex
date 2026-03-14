import type { TaskStatus, PersonaTier } from "@/types";

interface TaskData {
  id: string;
  status: TaskStatus;
  assigneePersonaId: string | null;
  testSteps: string; // JSON array of test step IDs
  currentTestStep: string | null;
}

interface PersonaData {
  id: string;
  tier: PersonaTier;
}

interface TransitionResult {
  valid: boolean;
  reason?: string;
  newStatus?: TaskStatus;
  newTestStep?: string | null;
}

const TEST_STATUSES: TaskStatus[] = [
  "test_code_review",
  "test_qa",
  "test_security",
];

function isTestStatus(s: string): s is TaskStatus {
  return TEST_STATUSES.includes(s as TaskStatus);
}

function parseTestSteps(raw: string): string[] {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

/**
 * Validates whether a task can transition to the target status
 * given the persona attempting the transition.
 */
export function validateTransition(
  task: TaskData,
  toStatus: TaskStatus,
  persona: PersonaData
): TransitionResult {
  const from = task.status;

  // Same status — no-op
  if (from === toStatus) {
    return { valid: false, reason: "Görev zaten bu durumda" };
  }

  // Prime and managers can always move to backlog
  if (toStatus === "backlog") {
    if (persona.tier === "prime" || persona.tier === "lead") {
      return { valid: true, newStatus: "backlog", newTestStep: null };
    }
    return { valid: false, reason: "Sadece prime ve lead roller backlog'a taşıyabilir" };
  }

  const testSteps = parseTestSteps(task.testSteps);

  // ── Valid transitions ──

  // backlog → todo
  if (from === "backlog" && toStatus === "todo") {
    if (persona.tier === "prime" || persona.tier === "lead") {
      return { valid: true, newStatus: "todo", newTestStep: null };
    }
    return { valid: false, reason: "Sadece prime/lead backlog → todo geçişi yapabilir" };
  }

  // todo → in_progress
  if (from === "todo" && toStatus === "in_progress") {
    if (
      persona.id === task.assigneePersonaId ||
      persona.tier === "prime" ||
      persona.tier === "lead"
    ) {
      return { valid: true, newStatus: "in_progress", newTestStep: null };
    }
    return { valid: false, reason: "Sadece atanan persona bu geçişi yapabilir" };
  }

  // in_progress → test (first step) or review (no test steps)
  if (from === "in_progress") {
    if (toStatus === "review" && testSteps.length === 0) {
      if (persona.id === task.assigneePersonaId || persona.tier === "prime") {
        return { valid: true, newStatus: "review", newTestStep: null };
      }
      return { valid: false, reason: "Sadece atanan persona bu geçişi yapabilir" };
    }

    if (isTestStatus(toStatus) && testSteps.length > 0) {
      const firstStep = `test_${testSteps[0]}` as TaskStatus;
      if (toStatus === firstStep || toStatus === (`test_${testSteps[0]}` as TaskStatus)) {
        if (persona.id === task.assigneePersonaId || persona.tier === "prime") {
          return { valid: true, newStatus: firstStep, newTestStep: testSteps[0] };
        }
        return { valid: false, reason: "Sadece atanan persona bu geçişi yapabilir" };
      }
    }

    // Allow direct jump to any test status for assigned persona
    if (isTestStatus(toStatus)) {
      if (persona.id === task.assigneePersonaId || persona.tier === "prime") {
        const stepId = toStatus.replace("test_", "");
        return { valid: true, newStatus: toStatus, newTestStep: stepId };
      }
      return { valid: false, reason: "Sadece atanan persona bu geçişi yapabilir" };
    }
  }

  // test_X → next test or review (approved) or in_progress (rejected)
  if (isTestStatus(from)) {
    const currentStepId = from.replace("test_", "");
    const currentIdx = testSteps.indexOf(currentStepId);

    // test → in_progress (rejection)
    if (toStatus === "in_progress") {
      return { valid: true, newStatus: "in_progress", newTestStep: null };
    }

    // test → next test step
    if (isTestStatus(toStatus)) {
      const nextIdx = currentIdx + 1;
      if (nextIdx < testSteps.length) {
        const expectedNext = `test_${testSteps[nextIdx]}` as TaskStatus;
        if (toStatus === expectedNext) {
          return { valid: true, newStatus: expectedNext, newTestStep: testSteps[nextIdx] };
        }
      }
    }

    // test (last) → review
    if (toStatus === "review" && currentIdx === testSteps.length - 1) {
      return { valid: true, newStatus: "review", newTestStep: null };
    }
  }

  // review → done
  if (from === "review" && toStatus === "done") {
    if (persona.tier === "prime" || persona.tier === "lead") {
      return { valid: true, newStatus: "done", newTestStep: null };
    }
    return { valid: false, reason: "Sadece prime/lead bu geçişi onaylayabilir" };
  }

  // review → in_progress (rejection)
  if (from === "review" && toStatus === "in_progress") {
    if (persona.tier === "prime" || persona.tier === "lead") {
      return { valid: true, newStatus: "in_progress", newTestStep: null };
    }
    return { valid: false, reason: "Sadece prime/lead bu geçişi yapabilir" };
  }

  return {
    valid: false,
    reason: `Geçersiz durum geçişi: ${from} → ${toStatus}`,
  };
}
