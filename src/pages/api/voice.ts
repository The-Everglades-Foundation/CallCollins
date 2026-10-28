import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { addVoiceSample } from "../../lib/db.ts";
import { FileReadError, readUpload } from "../../lib/files.ts";
import { field, filesOf, redirect } from "../../lib/form.ts";
import { currentExecutive } from "../../lib/studio.ts";

export const POST: APIRoute = async (context) => {
  const executive = await currentExecutive(context);
  if (!executive) return redirect("/?error=" + encodeURIComponent("Sign in again."));

  const form = await context.request.formData();
  const title = field(form, "title", 160);
  const speaker = field(form, "speaker", 120) || "Mike Collins";
  const audience = field(form, "audience", 200);
  const occasion = field(form, "occasion", 200);
  const spokenOn = field(form, "spoken_on", 40);
  const files = filesOf(form, "files");
  if (files.length === 0) {
    return redirect("/room?error=" + encodeURIComponent("Choose a PDF, DOCX, or TXT example."));
  }

  try {
    for (const file of files) {
      const uploaded = await readUpload(file);
      await addVoiceSample(env.DB, {
        executiveId: null,
        scope: "house",
        title: title || uploaded.name,
        speaker,
        audience: audience || null,
        occasion: occasion || null,
        spokenOn: spokenOn || null,
        body: uploaded.text,
      });
    }
  } catch (error) {
    const message = error instanceof FileReadError ? error.message : "That example could not be read.";
    return redirect("/room?error=" + encodeURIComponent(message));
  }

  console.log(JSON.stringify({ event: "house_voice_added", count: files.length }));
  return redirect("/room");
};
