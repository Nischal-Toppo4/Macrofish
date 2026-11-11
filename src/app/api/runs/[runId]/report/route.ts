import { getRun } from "@/lib/simulation/store";

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const run = getRun(runId);

  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  if (run.status !== "completed") {
    return Response.json({ error: "Simulation still running" }, { status: 409 });
  }

  return Response.json({
    runId: run.id,
    status: run.status,
    report: run.report,
    rounds: run.rounds,
    agents: run.agents,
    input: run.input,
  });
}
