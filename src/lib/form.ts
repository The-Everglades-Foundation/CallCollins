export function field(form: FormData, name: string, max: number): string {
  return String(form.get(name) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function block(form: FormData, name: string, max: number): string {
  return String(form.get(name) ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

export function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { location } });
}

export function filesOf(form: FormData, name: string): File[] {
  return form
    .getAll(name)
    .filter((item): item is File => item instanceof File && item.size > 0 && item.name !== "");
}
