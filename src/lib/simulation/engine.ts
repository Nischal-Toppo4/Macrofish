import {
  type AgentEvent,
  type AgentProfile,
  type Outcome,
  type RoundState,
  type ScenarioInput,
  type SignalSet,
  type SimulationReport,
} from "@/lib/simulation/types";

const agentArchetypes: Omit<AgentProfile, "id" | "riskTolerance" | "memoryWindow">[] = [
  {
    name: "Maya Chen",
    role: "Product lead",
    persona: "Optimistic builder focused on trust",
    goals: "Grow adoption without harming user confidence",
    color: "#7c5cff",
  },
  {
    name: "Ravi Shah",
    role: "Skeptical customer",
    persona: "Pragmatic evaluator of value and pricing",
    goals: "Avoid complexity and hidden costs",
    color: "#20b8a6",
  },
  {
    name: "Elena Torres",
    role: "Market analyst",
    persona: "Evidence-first trend interpreter",
    goals: "Track market fit and segment traction",
    color: "#f29d49",
  },
  {
    name: "Jon Bell",
    role: "Community moderator",
    persona: "Safety and transparency advocate",
    goals: "Reduce backlash and keep discourse healthy",
    color: "#e8688a",
  },
  {
    name: "Noah Williams",
    role: "Early adopter",
    persona: "Experiment-driven champion",
    goals: "Spot and share high-value experiences quickly",
    color: "#5c9ded",
  },
  {
    name: "Sana Patel",
    role: "Finance operator",
    persona: "Unit-economics disciplinarian",
    goals: "Preserve margins while scaling",
    color: "#8a63d2",
  },
  {
    name: "Leo Grant",
    role: "Competitor watcher",
    persona: "Strategic response planner",
    goals: "Anticipate rival campaigns and reactions",
    color: "#5f7f9f",
  },
];

const actionTemplates = {
  positive: [
    "pushes for transparent onboarding checkpoints to increase trust.",
    "highlights organic testimonials as proof for broader adoption.",
    "supports invite-based expansion to maintain product quality.",
  ],
  neutral: [
    "requests another validation cycle before broadening rollout.",
    "proposes segment-specific messaging for cautious users.",
    "monitors weekly sentiment drift before changing pricing copy.",
  ],
  negative: [
    "warns that unclear pricing could trigger churn in week two.",
    "flags moderation overhead as a short-term growth bottleneck.",
    "expects competitors to exploit confusion around team limits.",
  ],
};

function hashValue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function buildAgents(input: ScenarioInput): AgentProfile[] {
  const riskBase =
    input.riskLevel === "conservative" ? 30 : input.riskLevel === "balanced" ? 50 : 70;

  return Array.from({ length: input.agentCount }, (_, index) => {
    const archetype = agentArchetypes[index % agentArchetypes.length];
    return {
      ...archetype,
      id: `agent-${index + 1}`,
      riskTolerance: clamp(riskBase + (index % 3) * 7 - 6),
      memoryWindow: 2 + (index % 4),
    };
  });
}

function influenceScore(round: number, input: ScenarioInput): number {
  const scenarioWeight = (hashValue(input.context + input.question) % 13) - 6;
  const policyWeight = input.policyMode === "aggressive" ? 5 : -3;
  const riskWeight = input.riskLevel === "aggressive" ? 6 : input.riskLevel === "balanced" ? 2 : -4;
  return scenarioWeight + policyWeight + riskWeight + round * 2;
}

function selectTemplate(influence: number): keyof typeof actionTemplates {
  if (influence > 6) return "positive";
  if (influence < -2) return "negative";
  return "neutral";
}

function signalFromEvents(
  base: SignalSet,
  events: AgentEvent[],
  round: number,
  input: ScenarioInput
): SignalSet {
  const impact = events.reduce((sum, event) => sum + event.signalImpact, 0) / Math.max(1, events.length);
  const drift = input.policyMode === "aggressive" ? 3 : -2;

  return {
    momentum: clamp(base.momentum + impact * 0.6 + round + drift),
    risk: clamp(base.risk - impact * 0.4 + (input.riskLevel === "aggressive" ? 4 : 1)),
    confidence: clamp(base.confidence + impact * 0.5 + (round > 1 ? 3 : 1)),
  };
}

function roundSummary(round: number, signals: SignalSet, policyMode: ScenarioInput["policyMode"]): string {
  const trend = signals.momentum > 70 ? "strong adoption momentum" : signals.momentum > 50 ? "stable traction" : "fragile traction";
  const riskText = signals.risk > 65 ? "risk pressure is elevated" : "risk remains manageable";
  const policyText =
    policyMode === "aggressive"
      ? "growth-first policy accelerates reactions"
      : "conservative policy improves trust calibration";

  return `Round ${round}: ${trend}; ${riskText}; ${policyText}.`;
}

export function generateRounds(input: ScenarioInput, agents: AgentProfile[]): RoundState[] {
  let currentSignals: SignalSet = {
    momentum: input.policyMode === "aggressive" ? 54 : 48,
    risk: input.riskLevel === "aggressive" ? 62 : input.riskLevel === "balanced" ? 56 : 48,
    confidence: 46,
  };

  return Array.from({ length: input.rounds }, (_, index) => {
    const round = index + 1;
    const influence = influenceScore(round, input);

    const events = agents.map((agent, eventIndex) => {
      const stanceShift = influence + (agent.riskTolerance - 50) * 0.12 - eventIndex * 0.8;
      const templateSet = actionTemplates[selectTemplate(stanceShift)];
      const template = templateSet[(hashValue(`${agent.id}-${round}`) + round) % templateSet.length];
      const signalImpact = clamp(50 + stanceShift) - 50;

      return {
        round,
        agentId: agent.id,
        agentName: agent.name,
        message: `${agent.role} ${template}`,
        signalImpact,
      };
    });

    currentSignals = signalFromEvents(currentSignals, events, round, input);

    return {
      round,
      summary: roundSummary(round, currentSignals, input.policyMode),
      signals: currentSignals,
      events,
    };
  });
}

function buildAlternatives(signals: SignalSet): Outcome[] {
  return [
    {
      title: "Rapid organic expansion",
      description:
        signals.momentum > 68
          ? "Community-driven referrals trigger faster expansion than paid campaigns."
          : "Expansion remains moderate unless social proof content improves.",
    },
    {
      title: "Conversion slowdown",
      description:
        signals.risk > 62
          ? "Ambiguous packaging increases decision delay for team buyers."
          : "Conversion remains stable if rollout messaging remains clear.",
    },
  ];
}

export function generateReport(input: ScenarioInput, rounds: RoundState[]): SimulationReport {
  const latest = rounds[rounds.length - 1];

  const leadingOutcome: Outcome = {
    title: latest.signals.momentum > 70 ? "Trust builds before scale" : "Demand grows with careful pacing",
    description:
      latest.signals.confidence > 70
        ? "Agents converge on predictable adoption with clear onboarding and transparent limits."
        : "Agents see mixed reactions; targeted communication is needed to avoid momentum loss.",
  };

  const topDrivers = [
    "Onboarding clarity for first-time users",
    "Peer-generated proof from early adopters",
    input.policyMode === "aggressive"
      ? "Growth-focused launch cadence"
      : "Trust-first rollout cadence",
  ];

  const warnings = [
    latest.signals.risk > 65
      ? "Pricing narrative remains the largest conversion blocker."
      : "Watch competitor discounting during week two.",
    "Moderation and support capacity must scale with engagement spikes.",
  ];

  return {
    leadingOutcome,
    alternatives: buildAlternatives(latest.signals),
    topDrivers,
    warnings,
    confidenceNarrative: `Confidence score ${latest.signals.confidence}/100 combines agent agreement, round-to-round consistency, and scenario evidence reuse.`,
  };
}

export function generateFollowUpAnswer(question: string, report: SimulationReport): string {
  const normalized = question.toLowerCase();

  if (normalized.includes("risk")) {
    return `Primary risk is: ${report.warnings[0]} Secondary risk is operational load during traffic peaks.`;
  }

  if (normalized.includes("why") || normalized.includes("driver")) {
    return `Key drivers are ${report.topDrivers.join(", ")}. These repeatedly influenced agent behavior across rounds.`;
  }

  return `Most likely outcome is "${report.leadingOutcome.title}". Recommendation: pilot with a constrained cohort, publish transparent usage limits, and monitor weekly sentiment before expanding.`;
}
