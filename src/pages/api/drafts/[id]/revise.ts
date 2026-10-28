import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { listMessages, readDraft } from "../../../../lib/db.ts";
import { isRevisionKind, revisionPrompt } from "../../../../lib/prompt.ts";
import { currentExecutive, promptFor, streamRemarks } from "../../../../lib/studio.ts";

export const POST: APIRoute = async (context) => {
  const executive = await currentExecutive(context);
  if (!executive) return Response.json({ error: "Sign in again." }, { status: 401 });

  const draftId = context.params.id ?? "";
  const draft = await readDraft(env.DB, executive.id, draftId);
  if (!draft) return Response.json({ error: "That draft is not in your account." }, { status: 404 });

  const body = (await context.request.json().catch(() => null)) as { kind?: string } | null;
  const kind = body?.kind ?? "";
  if (!isRevisionKind(kind)) {
    return Response.json({ error: "Choose a revision." }, { status: 400 });
  }

  const messages = await listMessages(env.DB, draft.id);
  const latest = [...messages].reverse().find((message) => message.role === "assistant");
  if (!latest) return Response.json({ error: "Draft the remarks before revising them." }, { status: 400 });

  const brief = {
    audience: draft.audience,
    occasion: draft.occasion,
    point: draft.point,
    notes: "",
    fileName: draft.file_name,
  };
  const system = await promptFor(executive.id, brief);
  const user = revisionPrompt(kind, latest.content, brief);
  console.log(JSON.stringify({ event: "revision_started", draftId: draft.id, kind }));
  return streamRemarks({ draftId: draft.id, kind, system, user });
};
