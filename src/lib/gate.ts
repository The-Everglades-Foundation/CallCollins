const PREVIEW_HOST = /^[a-z0-9-]+-callcollins\.[a-z0-9-]+\.workers\.dev$/;

export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return PREVIEW_HOST.test(host);
}

export function accessTokenFrom(headers: { get(name: string): string | null }): string | null {
  const header = headers.get("cf-access-jwt-assertion")?.trim();
  if (header) return header;
  const cookie = headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.replace(/[._+-]+/g, " ").replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const titled = words.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  return (titled || email).slice(0, 80);
}
