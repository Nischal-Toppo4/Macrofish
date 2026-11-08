"use client";

import { useMemo, useState } from "react";

type Agent = {
  name: string;
  role: string;
  color: string;
  stance: string;
};

const agents: Agent[] = [
  { name: "Maya Chen", role: "Product lead", color: "#7c5cff", stance: "Optimistic" },
  { name: "Ravi Shah", role: "Skeptical customer", color: "#20b8a6", stance: "Cautious" },
  { name: "Elena Torres", role: "Market analyst", color: "#f29d49", stance: "Analytical" },
  { name: "Jon Bell", role: "Community moderator", color: "#e8688a", stance: "Protective" },
  { name: "Noah Williams", role: "Early adopter", color: "#5c9ded", stance: "Enthusiastic" },
];

const seedEvents = [
  ["Maya Chen", "The launch should start with a small invite-only cohort to protect trust."],
  ["Ravi Shah", "I like the premise, but unclear pricing will make people hesitate."],
  ["Elena Torres", "Early signals suggest the product will spread through niche communities first."],
  ["Jon Bell", "Moderation and transparency need to be visible before the public launch."],
  ["Noah Williams", "I would share this immediately if onboarding takes less than five minutes."],
];

export default function Home() {
  const [scenario, setScenario] = useState(
    "A new AI productivity assistant launches with a free plan and a paid team tier. How will users, competitors, and online communities react over the next 90 days?"
  );
  const [rounds, setRounds] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [activeTab, setActiveTab] = useState("Overview");

  const visibleEvents = useMemo(
    () => seedEvents.slice(0, Math.max(2, Math.min(seedEvents.length, completedRounds + 2))),
    [completedRounds]
  );

  function runSimulation() {
    setIsRunning(true);
    setCompletedRounds(0);
    let round = 0;
    const timer = window.setInterval(() => {
      round += 1;
      setCompletedRounds(round);
      if (round >= rounds) {
        window.clearInterval(timer);
        setIsRunning(false);
      }
    }, 650);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>Miro<span className="brand-fish">Fish</span></span><span className="beta">MVP</span></div>
        <div className="topbar-actions"><span className="status-dot" /> Local simulation <button className="avatar">NC</button></div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="eyebrow">WORKSPACE</div>
            <button className="side-link active"><span>◈</span> New simulation</button>
            <button className="side-link"><span>▤</span> Saved scenarios</button>
            <button className="side-link"><span>◷</span> Activity</button>
          </div>
          <div className="sidebar-section recent">
            <div className="eyebrow">RECENT</div>
            <button className="scenario-link"><span className="scenario-icon purple">A</span><span>AI assistant launch</span></button>
            <button className="scenario-link"><span className="scenario-icon orange">M</span><span>Market expansion</span></button>
            <button className="scenario-link"><span className="scenario-icon teal">P</span><span>Policy response test</span></button>
          </div>
          <div className="sidebar-footer"><div className="help">?</div><span>How it works</span><span className="settings">⚙</span></div>
        </aside>

        <section className="content">
          <div className="page-heading">
            <div><p className="kicker">SCENARIO LAB</p><h1>Rehearse the future.</h1><p className="subtitle">Give your scenario a cast of agents and watch the most likely outcomes emerge.</p></div>
            <button className="secondary-button">＋ Import source</button>
          </div>

          <div className="grid">
            <section className="panel scenario-panel">
              <div className="panel-heading"><div><span className="step">01</span><h2>Set the scenario</h2></div><span className="panel-hint">What do you want to explore?</span></div>
              <textarea value={scenario} onChange={(event) => setScenario(event.target.value)} />
              <div className="field-row">
                <label><span>SIMULATION ROUNDS</span><select value={rounds} onChange={(event) => setRounds(Number(event.target.value))}><option value={2}>2 rounds</option><option value={3}>3 rounds</option><option value={4}>4 rounds</option><option value={5}>5 rounds</option></select></label>
                <label><span>AGENT TEMPERATURE</span><select defaultValue="Balanced"><option>Conservative</option><option>Balanced</option><option>Chaotic</option></select></label>
              </div>
              <button className="run-button" onClick={runSimulation} disabled={isRunning || !scenario.trim()}>{isRunning ? `Simulating round ${completedRounds + 1}…` : completedRounds > 0 ? "Run again" : "Run simulation"} <span>→</span></button>
            </section>

            <section className="panel agents-panel">
              <div className="panel-heading"><div><span className="step">02</span><h2>Choose your cast</h2></div><span className="panel-hint">{agents.length} active agents</span></div>
              <div className="agent-list">{agents.map((agent) => <div className="agent" key={agent.name}><div className="agent-avatar" style={{ background: agent.color }}>{agent.name.split(" ").map((n) => n[0]).join("")}</div><div className="agent-copy"><strong>{agent.name}</strong><span>{agent.role}</span></div><span className="stance">{agent.stance}</span><span className="check">✓</span></div>)}</div>
              <button className="add-agent">＋ Add custom agent</button>
            </section>
          </div>

          <section className="results-section">
            <div className="results-header"><div><p className="kicker">LIVE SIMULATION</p><h2>What&apos;s emerging</h2></div><div className="round-progress"><span className="progress-label">{completedRounds === 0 ? "Ready to run" : `${completedRounds} of ${rounds} rounds`}</span><div className="progress-bar"><i style={{ width: `${(completedRounds / rounds) * 100}%` }} /></div></div></div>
            <div className="tabs">{["Overview", "Agent activity", "Signals"].map((tab) => <button className={activeTab === tab ? "tab active-tab" : "tab"} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div>
            {activeTab === "Overview" && <div className="outcome-grid"><div className="outcome-card primary-outcome"><div className="card-label">LEADING OUTCOME <span>↗</span></div><h3>Trust builds before growth</h3><p>Agents converge on a cautious launch: a transparent free tier and visible early adopters create enough trust for organic team adoption.</p><div className="confidence"><span>Confidence</span><strong>{completedRounds ? "78%" : "—"}</strong><div className="confidence-bar"><i style={{ width: completedRounds ? "78%" : "0%" }} /></div></div></div><div className="outcome-card"><div className="card-label">EMERGING SIGNAL</div><h3>Community proof matters</h3><p>Independent reviews and hands-on examples are more persuasive than polished launch messaging.</p><span className="signal-tag">High momentum</span></div><div className="outcome-card"><div className="card-label">WATCH OUT FOR</div><h3>Pricing friction</h3><p>Unclear team limits may slow conversion during the second phase of adoption.</p><span className="signal-tag amber">Needs attention</span></div></div>}
            {activeTab === "Agent activity" && <div className="activity-feed">{visibleEvents.map(([name, text], index) => <div className="feed-item" key={name}><span className="feed-number">0{index + 1}</span><div><strong>{name}</strong><p>{text}</p></div><span className="feed-round">R{Math.min(rounds, Math.floor(index / 2) + 1)}</span></div>)}</div>}
            {activeTab === "Signals" && <div className="signals"><div className="signal-row"><span>Organic community sharing</span><b>84</b><div><i style={{ width: "84%" }} /></div></div><div className="signal-row"><span>Pricing confusion</span><b>61</b><div><i className="warn" style={{ width: "61%" }} /></div></div><div className="signal-row"><span>Competitor response</span><b>39</b><div><i className="soft" style={{ width: "39%" }} /></div></div></div>}
          </section>
          <footer className="footer-note">MiroFish MVP · Simulations are exploratory scenarios, not guaranteed predictions.</footer>
        </section>
      </div>
    </main>
  );
}
