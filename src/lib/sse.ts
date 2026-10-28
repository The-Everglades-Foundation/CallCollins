export type SseEvent = {
  event: string;
  data: string;
};

export function takeSseEvents(buffer: string): { events: SseEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: SseEvent[] = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length > 0) events.push({ event, data: dataLines.join("\n") });
  }
  return { events, rest };
}

export function textFromSseData(data: string): string {
  try {
    const json = JSON.parse(data) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta.text) {
      return json.delta.text;
    }
  } catch {
    return "";
  }
  return "";
}
