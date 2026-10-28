import { takeSseEvents, textFromSseData } from "./sse.ts";

export const ANTHROPIC_VERSION = "2026-10-21";
export const DEFAULT_MODEL = "claude-sonnet-5-5";

export class ClaudeError extends Error {}

export function claudeRequestBody(input: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  stream: boolean;
  thinking: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    max_tokens: input.maxTokens,
    stream: input.stream,
    system: input.system,
    messages: [{ role: "user", content: input.user }],
  };
  if (input.thinking && input.model.includes("sonnet")) {
    body.thinking = { type: "between_tools" };
  }
  return body;
}

export function summarizeClaudeError(status: number, detail: string): string {
  let message = "";
  try {
    const json = JSON.parse(detail) as { error?: { message?: string } };
    message = json.error?.message ?? "";
  } catch {
    message = "";
  }
  message = message
    .replace(/\bsk-ant-[a-z0-9_-]+\b/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  if (message) return `Claude could not draft (${status}). ${message}`.slice(0, 280);
  return `Claude could not draft (${status}).`;
}

type ClaudeCall = {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  stream: boolean;
};

async function postClaude(input: ClaudeCall, thinking: boolean): Promise<Response> {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": input.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify(
      claudeRequestBody({
        model: input.model,
        system: input.system,
        user: input.user,
        maxTokens: input.maxTokens,
        stream: input.stream,
        thinking,
      }),
    ),
  });
}

export async function openClaude(input: ClaudeCall): Promise<Response> {
  let response = await postClaude(input, true);
  if (response.status === 400) {
    const detail = await response.text();
    if (detail.toLowerCase().includes("thinking")) {
      response = await postClaude(input, false);
    } else {
      throw new ClaudeError(summarizeClaudeError(400, detail));
    }
  }
  if (!response.ok) {
    throw new ClaudeError(summarizeClaudeError(response.status, await response.text()));
  }
  return response;
}

export async function readClaudeText(response: Response): Promise<string> {
  const json = (await response.json()) as {
    content?: { type?: string; text?: string }[];
  };
  return (json.content ?? [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("");
}

export function streamClaudeText(
  response: Response,
  onText: (chunk: string) => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }
      const decoder = new TextDecoder();
      let pending = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const parsed = takeSseEvents(pending);
          pending = parsed.rest;
          for (const event of parsed.events) {
            const text = textFromSseData(event.data);
            if (!text) continue;
            onText(text);
            controller.enqueue(encoder.encode(text));
          }
        }
        const tail = takeSseEvents(`${pending}\n\n`);
        for (const event of tail.events) {
          const text = textFromSseData(event.data);
          if (!text) continue;
          onText(text);
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
