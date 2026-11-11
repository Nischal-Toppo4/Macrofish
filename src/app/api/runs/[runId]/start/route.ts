import { startRun } from "@/lib/simulation/store";

export async function POST(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const run = startRun(runId);

  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  return Response.json({ runId: run.id, status: run.status, totalRounds: run.rounds.length });
}
