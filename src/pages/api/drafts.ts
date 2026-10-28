import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { FileReadError, readUpload } from "../../lib/files.ts";
import { block, field, filesOf, redirect } from "../../lib/form.ts";
import { briefPrompt, type Brief } from "../../lib/prompt.ts";
import { createDraft } from "../../lib/db.ts";
import { currentExecutive, streamRemarks, promptFor } from "../../lib/studio.ts";

export const POST: APIRoute = async (context) => {
  const executive = await currentExecutive(context);
  if (!executive) return Response.json({ error: "Sign in again." }, { status: 401 });

  const form = await context.request.formData();
  const brief: Brief = {
    audience: field(form, "audience", 200),
    occasion: field(form, "occasion", 200),
    point: field(form, "point", 500),
    notes: block(form, "notes", 80_000),
    fileName: null,
  };
  if (!brief.audience || !brief.occasion || !brief.point) {
    return Response.json({ error: "Add the audience, the occasion, and the point." }, { status: 400 });
  }

  const [file] = filesOf(form, "file");
  if (file) {
    try {
      const uploaded = await readUpload(file);
      brief.fileName = uploaded.name;
      brief.notes = [brief.notes, uploaded.text].filter(Boolean).join("\n\n");
    } catch (error) {
      const message = error instanceof FileReadError ? error.message : "That file could not be read.";
      return Response.json({ error: message }, { status: 400 });
    }
  }
  if (!brief.notes.trim()) {
    return Response.json({ error: "Paste notes or attach a PDF, DOCX, or TXT brief." }, { status: 400 });
  }

  const content = briefPrompt(brief);
  const draftId = await createDraft(env.DB, executive.id, brief, content);
  const system = await promptFor(executive.id, brief);
  console.log(JSON.stringify({ event: "draft_started", draftId }));
  return streamRemarks({ draftId, kind: "speech", system, user: content });
};
