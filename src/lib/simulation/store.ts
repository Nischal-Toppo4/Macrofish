import { randomUUID } from "crypto";
import {
  buildAgents,
  generateFollowUpAnswer,
  generateReport,
  generateRounds,
} from "@/lib/simulation/engine";
import type { RunRecord, ScenarioInput } from "@/lib/simulation/types";

type StoreState = {
  runs: Map<string, RunRecord>;
};

declare global {
  var __macrofishStore: StoreState | undefined;
}

function state(): StoreState {
  if (!globalThis.__macrofishStore) {
    globalThis.__macrofishStore = { runs: new Map() };
  }
  return globalThis.__macrofishStore;
}

function normalizeInput(input: ScenarioInput): ScenarioInput {
  return {
    context: input.context.trim(),
    question: input.question.trim(),
    rounds: Math.max(2, Math.min(6, Number(input.rounds) || 3)),
    agentCount: Math.max(3, Math.min(7, Number(input.agentCount) || 5)),
    riskLevel: input.riskLevel,
    policyMode: input.policyMode,
  };
}

export function createRun(input: ScenarioInput): RunRecord {
  const payload = normalizeInput(input);
  const id = randomUUID();
  const agents = buildAgents(payload);

  const run: RunRecord = {
    id,
    status: "draft",
    input: payload,
    agents,
    rounds: [],
    report: {
      leadingOutcome: { title: "Pending", description: "Simulation has not started." },
      alternatives: [],
      topDrivers: [],
      warnings: [],
      confidenceNarrative: "Simulation has not started.",
    },
    createdAt: new Date().toISOString(),
  };

  state().runs.set(id, run);
  return run;
}

export function startRun(runId: string): RunRecord | null {
  const run = state().runs.get(runId);
  if (!run) return null;

  run.status = "running";
  run.rounds = generateRounds(run.input, run.agents);
  run.report = generateReport(run.input, run.rounds);

  return run;
}

export function completeRun(runId: string): RunRecord | null {
  const run = state().runs.get(runId);
  if (!run) return null;
  run.status = "completed";
  return run;
}

export function getRun(runId: string): RunRecord | null {
  return state().runs.get(runId) ?? null;
}

export function answerFollowUp(runId: string, question: string): string | null {
  const run = state().runs.get(runId);
  if (!run || run.status === "draft") return null;

  return generateFollowUpAnswer(question, run.report);
}
