import { answerFollowUp } from "@/lib/simulation/store";

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;

  try {
    const payload = (await request.json()) as { question?: string };
    const question = payload.question?.trim();

    if (!question) {
      return Response.json({ error: "question is required" }, { status: 400 });
    }

    const answer = answerFollowUp(runId, question);
    if (!answer) {
      return Response.json({ error: "Run not ready for follow-up" }, { status: 409 });
    }

    return Response.json({ answer });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
