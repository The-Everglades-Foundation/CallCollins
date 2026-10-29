import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { ensureExecutive, readExecutive, type Executive } from "./db.ts";
import { isPreviewHost, nameFromEmail } from "./gate.ts";

const jwksByIssuer = new Map<string, JWTVerifyGetKey>();

export async function resolveExecutive(request: Request, sessionToken: string | undefined): Promise<Executive | null> {
  const host = new URL(request.url).hostname;
  if (!isPreviewHost(host)) return readExecutive(env.DB, sessionToken);
  const email = await accessEmail(request);
  if (!email) return null;
  return ensureExecutive(env.DB, email, nameFromEmail(email));
}

async function accessEmail(request: Request): Promise<string | null> {
  const team = env.ACCESS_TEAM_DOMAIN?.replace(/\/$/, "");
  const aud = env.ACCESS_AUD?.trim();
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!team || !aud || !token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks(team), { issuer: team, audience: aud });
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return email;
  } catch {
    console.error(JSON.stringify({ event: "access_jwt_rejected" }));
    return null;
  }
}

function jwks(team: string): JWTVerifyGetKey {
  const cached = jwksByIssuer.get(team);
  if (cached) return cached;
  const created = createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));
  jwksByIssuer.set(team, created);
  return created;
}
