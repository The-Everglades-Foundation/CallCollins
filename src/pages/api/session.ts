import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { signIn } from "../../lib/db.ts";
import { field, redirect } from "../../lib/form.ts";

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const email = field(form, "email", 200).toLowerCase();
  const name = field(form, "name", 80);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length === 0) {
    return redirect("/?error=" + encodeURIComponent("Use a valid email and your name."));
  }
  const token = await signIn(env.DB, email, name);
  cookies.set("cc_session", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
  });
  console.log(JSON.stringify({ event: "sign_in" }));
  return redirect("/room");
};
