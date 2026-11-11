import { createRun } from "@/lib/simulation/store";
import type { ScenarioInput } from "@/lib/simulation/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ScenarioInput;

    if (!input?.context?.trim() || !input?.question?.trim()) {
      return Response.json({ error: "Context and prediction question are required." }, { status: 400 });
    }

    const run = createRun(input);
    return Response.json({ runId: run.id, status: run.status });
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
}
