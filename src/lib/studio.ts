import type { APIContext } from "astro";
import { env } from "cloudflare:workers";
import { ClaudeError, openClaude, readClaudeText, streamClaudeText } from "./claude.ts";
import { addMessage, readStyleCard, listHouse, listShelf } from "./db.ts";
import { formatExamples, systemPrompt, type Brief } from "./prompt.ts";
import { selectExamples } from "./retrieve.ts";

export const MISSING_KEY = "Claude is not configured for this studio yet.";

export function studioModel(): string {
  return env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
}

export function studioKey(): string {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new ClaudeError(MISSING_KEY);
  return key;
}

export async function promptFor(executiveId: string, brief: Brief): Promise<string> {
  const [house, shelf, styleCard] = await Promise.all([
    listHouse(env.DB),
    listShelf(env.DB, executiveId),
    readStyleCard(env.DB),
  ]);
  const examples = [
    ...selectExamples(house, brief, 4),
    ...selectExamples(shelf, brief, 3),
  ];
  return systemPrompt(styleCard, formatExamples(examples));
}

export async function streamRemarks(input: {
  draftId: string;
  kind: string;
  system: string;
  user: string;
}): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await openClaude({
      apiKey: studioKey(),
      model: studioModel(),
      system: input.system,
      user: input.user,
      maxTokens: 8000,
      stream: true,
    });
  } catch (error) {
    const message = error instanceof ClaudeError ? error.message : "Claude could not draft.";
    console.error(JSON.stringify({ event: "claude_failed", draftId: input.draftId }));
    return Response.json({ error: message }, { status: 502, headers: { "x-draft-id": input.draftId } });
  }

  let collected = "";
  const stream = streamClaudeText(upstream, (chunk) => {
    collected += chunk;
  });
  const saved = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const step = await reader.read();
          if (step.done) break;
          controller.enqueue(step.value);
        }
        await persist(input.draftId, input.kind, collected);
        controller.close();
      } catch (error) {
        console.error(JSON.stringify({ event: "draft_stream_failed", draftId: input.draftId }));
        try {
          await persist(input.draftId, input.kind, collected);
        } catch {
          console.error(JSON.stringify({ event: "draft_save_failed", draftId: input.draftId }));
        }
        controller.error(error);
      }
    },
  });

  return new Response(saved, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-draft-id": input.draftId,
    },
  });
}

async function persist(draftId: string, kind: string, collected: string): Promise<void> {
  const speech = collected.trim();
  if (!speech) return;
  await addMessage(env.DB, draftId, "assistant", kind, speech);
}

export async function currentExecutive(context: APIContext) {
  const { resolveExecutive } = await import("./access.ts");
  return resolveExecutive(context.request, context.cookies.get("cc_session")?.value);
}
