"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildAgents, generateReport, generateRounds } from "@/lib/simulation/engine";
import type { PolicyMode, RiskLevel, RunRecord, ScenarioInput } from "@/lib/simulation/types";

function createMockRun(input: ScenarioInput): RunRecord {
  const agents = buildAgents(input);
  const rounds = generateRounds(input, agents);

  return {
    id: `mock-${Date.now()}`,
    status: "running",
    input,
    agents,
    rounds,
    report: generateReport(input, rounds),
    createdAt: new Date().toISOString(),
  };
}

export default function ScenarioSetupPage() {
  const router = useRouter();

  const [context, setContext] = useState(
    "A new AI productivity assistant launches with a free plan and a paid team tier."
  );
  const [question, setQuestion] = useState(
    "How will users, competitors, and online communities react over the next 90 days?"
  );
  const [rounds, setRounds] = useState(3);
  const [agentCount, setAgentCount] = useState(5);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("balanced");
  const [policyMode, setPolicyMode] = useState<PolicyMode>("conservative");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function startSimulation() {
    if (!context.trim() || !question.trim()) {
      setStatusMessage("Please provide both context and prediction question.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    const input: ScenarioInput = {
      context,
      question,
      rounds,
      agentCount,
      riskLevel,
      policyMode,
    };

    try {
      const createResponse = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!createResponse.ok) throw new Error("create run failed");
      const createPayload = (await createResponse.json()) as { runId: string };

      const startResponse = await fetch(`/api/runs/${createPayload.runId}/start`, {
        method: "POST",
      });

      if (!startResponse.ok) throw new Error("start run failed");

      router.push(`/simulation/${createPayload.runId}`);
    } catch {
      const mockRun = createMockRun(input);
      sessionStorage.setItem(`mock-run:${mockRun.id}`, JSON.stringify(mockRun));
      setStatusMessage("API unavailable; running deterministic local mock mode.");
      router.push(`/simulation/${mockRun.id}?mock=1`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">SCENARIO SETUP</p>
        <h1>MacroFish MVP Prototype</h1>
        <p className="subtitle">
          Upload context, ask a prediction question, and run a multi-agent simulation for your presentation.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>1) Seed context</h2>
          <span>Input data for simulation intake</span>
        </div>
        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Paste notes, reports, or story context"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>2) Prediction question</h2>
          <span>Define what outcome you want</span>
        </div>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What should the simulation forecast?"
        />
      </section>

      <section className="panel compact-grid">
        <label>
          <span>Rounds</span>
          <select value={rounds} onChange={(event) => setRounds(Number(event.target.value))}>
            {[2, 3, 4, 5, 6].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Agents</span>
          <select value={agentCount} onChange={(event) => setAgentCount(Number(event.target.value))}>
            {[3, 4, 5, 6, 7].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Risk level</span>
          <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as RiskLevel)}>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>

        <label>
          <span>Policy mode (presentation toggle)</span>
          <select value={policyMode} onChange={(event) => setPolicyMode(event.target.value as PolicyMode)}>
            <option value="conservative">Conservative</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>
      </section>

      <section className="actions-row">
        <button type="button" className="primary-button" onClick={startSimulation} disabled={loading}>
          {loading ? "Starting…" : "Start simulation"}
        </button>
        <p>{statusMessage || "Runs in API mode, with automatic local mock fallback."}</p>
      </section>
    </main>
  );
}
