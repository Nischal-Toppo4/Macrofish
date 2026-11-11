"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { RunRecord, SimulationReport } from "@/lib/simulation/types";
import { generateFollowUpAnswer } from "@/lib/simulation/engine";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ runId: string }>();
  const runId = routeParams.runId ?? "";
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [error, setError] = useState("");

  const isMockMode = searchParams.get("mock") === "1";

  useEffect(() => {
    if (!runId) return;

    if (isMockMode) {
      const stored = sessionStorage.getItem(`mock-run:${runId}`);
      if (!stored) {
        queueMicrotask(() => setError("Mock report not found."));
        return;
      }

      const mockRun = JSON.parse(stored) as RunRecord;
      queueMicrotask(() => setReport(mockRun.report));
      return;
    }

    fetch(`/api/runs/${runId}/report`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Report unavailable");
        }
        return (await response.json()) as { report: SimulationReport };
      })
      .then((payload) => setReport(payload.report))
      .catch(() => setError("Could not load report yet. Return to simulation and finish the run."));
  }, [isMockMode, runId]);

  const confidence = useMemo(() => report?.confidenceNarrative ?? "", [report]);

  async function askFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!followUpQuestion.trim() || !report) return;

    if (isMockMode) {
      setFollowUpAnswer(generateFollowUpAnswer(followUpQuestion, report));
      return;
    }

    try {
      const response = await fetch(`/api/runs/${runId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: followUpQuestion }),
      });

      if (!response.ok) throw new Error("follow-up failed");
      const payload = (await response.json()) as { answer: string };
      setFollowUpAnswer(payload.answer);
    } catch {
      setFollowUpAnswer("Follow-up API unavailable. Use the listed drivers and warnings as your presentation answer.");
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">FINAL REPORT</p>
        <h1>Decision-ready summary</h1>
        <p className="subtitle">Use this section as your presentation conclusion and Q&A support.</p>
      </section>

      {!report && !error && <section className="panel"><p>Loading report...</p></section>}
      {error && <section className="panel"><p className="error-text">{error}</p></section>}

      {report && (
        <>
          <section className="panel">
            <div className="panel-header">
              <h2>Leading outcome</h2>
            </div>
            <h3>{report.leadingOutcome.title}</h3>
            <p>{report.leadingOutcome.description}</p>
            <p className="summary-text">{confidence}</p>
          </section>

          <section className="panel metrics-grid">
            {report.alternatives.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </section>

          <section className="panel split-grid">
            <article>
              <h3>Top drivers</h3>
              <ul>
                {report.topDrivers.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>Warnings</h3>
              <ul>
                {report.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Follow-up chat</h2>
              <span>Ask “why”, “risk”, or “next step”</span>
            </div>
            <form onSubmit={askFollowUp} className="chat-row">
              <input
                value={followUpQuestion}
                onChange={(event) => setFollowUpQuestion(event.target.value)}
                placeholder="Ask a follow-up question"
              />
              <button type="submit" className="primary-button">
                Ask
              </button>
            </form>
            {!!followUpAnswer && <p className="summary-text">{followUpAnswer}</p>}
          </section>
        </>
      )}

      <section className="actions-row">
        <Link href="/" className="ghost-link">
          New scenario
        </Link>
        <Link href={isMockMode ? `/simulation/${runId}?mock=1` : `/simulation/${runId}`} className="ghost-link">
          Back to simulation
        </Link>
      </section>
    </main>
  );
}
