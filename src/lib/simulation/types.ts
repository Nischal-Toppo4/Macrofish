export type RunStatus = "draft" | "running" | "completed" | "failed";

export type RiskLevel = "conservative" | "balanced" | "aggressive";

export type PolicyMode = "conservative" | "aggressive";

export type SignalSet = {
  momentum: number;
  risk: number;
  confidence: number;
};

export type ScenarioInput = {
  context: string;
  question: string;
  rounds: number;
  agentCount: number;
  riskLevel: RiskLevel;
  policyMode: PolicyMode;
};

export type AgentProfile = {
  id: string;
  name: string;
  role: string;
  persona: string;
  goals: string;
  riskTolerance: number;
  memoryWindow: number;
  color: string;
};

export type AgentEvent = {
  round: number;
  agentId: string;
  agentName: string;
  message: string;
  signalImpact: number;
};

export type RoundState = {
  round: number;
  summary: string;
  signals: SignalSet;
  events: AgentEvent[];
};

export type Outcome = {
  title: string;
  description: string;
};

export type SimulationReport = {
  leadingOutcome: Outcome;
  alternatives: Outcome[];
  topDrivers: string[];
  warnings: string[];
  confidenceNarrative: string;
};

export type RunRecord = {
  id: string;
  status: RunStatus;
  input: ScenarioInput;
  agents: AgentProfile[];
  rounds: RoundState[];
  report: SimulationReport;
  createdAt: string;
};

export type StreamPayload =
  | { type: "run_started"; runId: string; totalRounds: number }
  | { type: "round"; round: RoundState; totalRounds: number }
  | { type: "run_completed"; runId: string };
