import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { signOut } from "../../lib/db.ts";
import { redirect } from "../../lib/form.ts";
import { isPreviewHost } from "../../lib/gate.ts";

export const POST: APIRoute = async ({ request, cookies }) => {
  await signOut(env.DB, cookies.get("cc_session")?.value);
  cookies.delete("cc_session", { path: "/" });
  if (!isPreviewHost(new URL(request.url).hostname)) return redirect("/");
  const team = env.ACCESS_TEAM_DOMAIN?.replace(/\/$/, "");
  return redirect(team ? `${team}/cdn-cgi/access/logout` : "/");
};
