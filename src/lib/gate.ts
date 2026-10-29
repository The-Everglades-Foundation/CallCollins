const PREVIEW_HOST = /^[a-z0-9-]+-callcollins\.[a-z0-9-]+\.workers\.dev$/;

export function isPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return PREVIEW_HOST.test(host);
}

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.replace(/[._+-]+/g, " ").replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const titled = words.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  return (titled || email).slice(0, 80);
}
