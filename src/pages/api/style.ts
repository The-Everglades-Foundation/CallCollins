import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { ClaudeError, openClaude, readClaudeText } from "../../lib/claude.ts";
import { listHouse, listShelf, writeStyleCard } from "../../lib/db.ts";
import { redirect } from "../../lib/form.ts";
import { styleCardPrompt } from "../../lib/prompt.ts";
import { currentExecutive, studioKey, studioModel } from "../../lib/studio.ts";

export const POST: APIRoute = async (context) => {
  const executive = await currentExecutive(context);
  if (!executive) return redirect("/?error=" + encodeURIComponent("Sign in again."));

  const samples = [...(await listHouse(env.DB)), ...(await listShelf(env.DB, executive.id))].slice(0, 12);
  if (samples.length === 0) {
    return redirect("/room?error=" + encodeURIComponent("Add House voice examples first."));
  }

  try {
    const response = await openClaude({
      apiKey: studioKey(),
      model: studioModel(),
      system: "You write a short style card for a speech studio. Plain prose. No title.",
      user: styleCardPrompt(samples),
      maxTokens: 2000,
      stream: false,
    });
    const card = (await readClaudeText(response)).trim();
    if (!card) {
      return redirect("/room?error=" + encodeURIComponent("The style card came back empty."));
    }
    await writeStyleCard(env.DB, card);
  } catch (error) {
    const message = error instanceof ClaudeError ? error.message : "The style card could not be refreshed.";
    return redirect("/room?error=" + encodeURIComponent(message));
  }

  console.log(JSON.stringify({ event: "style_card_refreshed" }));
  return redirect("/room");
};
