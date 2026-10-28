import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { signOut } from "../../lib/db.ts";
import { redirect } from "../../lib/form.ts";

export const POST: APIRoute = async ({ cookies }) => {
  await signOut(env.DB, cookies.get("cc_session")?.value);
  cookies.delete("cc_session", { path: "/" });
  return redirect("/");
};
