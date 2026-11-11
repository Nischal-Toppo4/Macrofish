"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { AgentEvent, RoundState, RunRecord, RunStatus, SignalSet } from "@/lib/simulation/types";

const initialSignals: SignalSet = {
  momentum: 0,
  risk: 0,
  confidence: 0,
};

export default function SimulationPage() {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ runId: string }>();
  const router = useRouter();

  const runId = routeParams.runId ?? "";
  const [runStatus, setRunStatus] = useState<RunStatus>("running");
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [signals, setSignals] = useState<SignalSet>(initialSignals);
  const [latestSummary, setLatestSummary] = useState("Waiting for first round...");
  const [errorMessage, setErrorMessage] = useState("");

  const isMockMode = searchParams.get("mock") === "1";

  useEffect(() => {
    if (!runId) return;

    if (isMockMode) {
      const stored = sessionStorage.getItem(`mock-run:${runId}`);
      if (!stored) {
        queueMicrotask(() => {
          setErrorMessage("Mock run data is missing.");
          setRunStatus("failed");
        });
        return;
      }

      const mockRun = JSON.parse(stored) as RunRecord;
      queueMicrotask(() => {
        setTotalRounds(mockRun.rounds.length);
        setRunStatus("running");
      });

      let index = 0;
      const timer = window.setInterval(() => {
        if (index >= mockRun.rounds.length) {
          setRunStatus("completed");
          window.clearInterval(timer);
          return;
        }

        const round = mockRun.rounds[index];
        setRoundIndex(round.round);
        setSignals(round.signals);
        setLatestSummary(round.summary);
        setAgentEvents((current) => [...current, ...round.events]);
        index += 1;
      }, 850);

      return () => window.clearInterval(timer);
    }

    const eventSource = new EventSource(`/api/runs/${runId}/events`);

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as
        | { type: "run_started"; totalRounds: number }
        | { type: "round"; round: RoundState; totalRounds: number }
        | { type: "run_completed" };

      if (payload.type === "run_started") {
        setTotalRounds(payload.totalRounds);
        setRunStatus("running");
        return;
      }

      if (payload.type === "round") {
        setRoundIndex(payload.round.round);
        setTotalRounds(payload.totalRounds);
        setSignals(payload.round.signals);
        setLatestSummary(payload.round.summary);
        setAgentEvents((current) => [...current, ...payload.round.events]);
        return;
      }

      if (payload.type === "run_completed") {
        setRunStatus("completed");
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setErrorMessage("Failed to stream simulation events.");
      setRunStatus("failed");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [isMockMode, runId]);

  const progress = useMemo(() => {
    if (!totalRounds) return 0;
    return Math.min(100, Math.round((roundIndex / totalRounds) * 100));
  }, [roundIndex, totalRounds]);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">LIVE SIMULATION</p>
        <h1>Round-by-round execution</h1>
        <p className="subtitle">Watch agents interact in real time and observe evolving outcome signals.</p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Run state</h2>
          <span>
            {runStatus.toUpperCase()} · Round {roundIndex}/{totalRounds || "?"}
          </span>
        </div>
        <div className="meter">
          <i style={{ width: `${progress}%` }} />
        </div>
        <p className="summary-text">{latestSummary}</p>
      </section>

      <section className="panel metrics-grid">
        <article>
          <h3>Momentum</h3>
          <strong>{signals.momentum}</strong>
        </article>
        <article>
          <h3>Risk</h3>
          <strong>{signals.risk}</strong>
        </article>
        <article>
          <h3>Confidence</h3>
          <strong>{signals.confidence}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Agent activity feed</h2>
          <span>{agentEvents.length} events</span>
        </div>
        <div className="feed-list">
          {agentEvents.slice(-18).map((event, index) => (
            <article key={`${event.agentId}-${event.round}-${index}`}>
              <header>
                <strong>{event.agentName}</strong>
                <span>R{event.round}</span>
              </header>
              <p>{event.message}</p>
            </article>
          ))}
          {!agentEvents.length && <p>No activity yet.</p>}
        </div>
      </section>

      <section className="actions-row">
        <Link href="/" className="ghost-link">
          Back to setup
        </Link>
        <button
          type="button"
          className="primary-button"
          disabled={runStatus !== "completed"}
          onClick={() =>
            router.push(isMockMode ? `/report/${runId}?mock=1` : `/report/${runId}`)
          }
        >
          Open final report
        </button>
      </section>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </main>
  );
}
