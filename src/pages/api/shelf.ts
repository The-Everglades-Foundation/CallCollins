import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { addVoiceSample, listMessages, readDraft } from "../../lib/db.ts";
import { field, redirect } from "../../lib/form.ts";
import { currentExecutive } from "../../lib/studio.ts";

export const POST: APIRoute = async (context) => {
  const executive = await currentExecutive(context);
  if (!executive) return redirect("/?error=" + encodeURIComponent("Sign in again."));

  const form = await context.request.formData();
  const draftId = field(form, "draft", 64);
  const draft = await readDraft(env.DB, executive.id, draftId);
  if (!draft) return redirect("/room?error=" + encodeURIComponent("That draft is not in your account."));

  const messages = await listMessages(env.DB, draft.id);
  const latest = [...messages].reverse().find((message) => message.role === "assistant");
  if (!latest) {
    return redirect(`/room?draft=${draft.id}&error=` + encodeURIComponent("Draft the remarks before adding them to the shelf."));
  }

  const today = new Date().toISOString().slice(0, 10);
  await addVoiceSample(env.DB, {
    executiveId: executive.id,
    scope: "shelf",
    title: draft.point,
    speaker: executive.name,
    audience: draft.audience,
    occasion: draft.occasion,
    spokenOn: today,
    body: latest.content,
  });
  console.log(JSON.stringify({ event: "shelf_approved", draftId: draft.id }));
  return redirect(`/room?draft=${draft.id}`);
};
