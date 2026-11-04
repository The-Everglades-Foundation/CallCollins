import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { listMessages, readDraft } from "../../../../lib/db.ts";
import { remarksDocx, remarksFilename } from "../../../../lib/docx.ts";
import { currentExecutive } from "../../../../lib/studio.ts";

export const GET: APIRoute = async (context) => {
  const executive = await currentExecutive(context);
  if (!executive) return Response.json({ error: "Sign in again." }, { status: 401 });

  const draftId = context.params.id ?? "";
  const draft = await readDraft(env.DB, executive.id, draftId);
  if (!draft) return Response.json({ error: "That draft is not in your account." }, { status: 404 });

  const messages = await listMessages(env.DB, draft.id);
  const latest = [...messages].reverse().find((message) => message.role === "assistant" && message.content.trim());
  if (!latest) return Response.json({ error: "Draft the remarks before downloading them." }, { status: 404 });

  const bytes = remarksDocx({
    point: draft.point,
    audience: draft.audience,
    occasion: draft.occasion,
    kind: latest.kind,
    body: latest.content,
  });
  const filename = remarksFilename(draft.point);
  console.log(JSON.stringify({ event: "docx_download", draftId: draft.id, kind: latest.kind }));
  return new Response(bytes, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
};
