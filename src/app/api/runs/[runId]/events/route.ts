import { completeRun, getRun } from "@/lib/simulation/store";
import type { StreamPayload } from "@/lib/simulation/types";

function encodeEvent(payload: StreamPayload): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const run = getRun(runId);

  if (!run) {
    return new Response("run not found", { status: 404 });
  }

  if (!run.rounds.length) {
    return new Response("run not started", { status: 409 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const totalRounds = run.rounds.length;

      controller.enqueue(encoder.encode(encodeEvent({ type: "run_started", runId, totalRounds })));

      let index = 0;
      const timer = setInterval(() => {
        if (index >= totalRounds) {
          completeRun(runId);
          controller.enqueue(encoder.encode(encodeEvent({ type: "run_completed", runId })));
          clearInterval(timer);
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: "round",
              round: run.rounds[index],
              totalRounds,
            })
          )
        );

        index += 1;
      }, 900);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
