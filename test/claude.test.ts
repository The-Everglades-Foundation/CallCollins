import assert from "node:assert/strict";
import test from "node:test";
import { claudeRequestBody, summarizeClaudeError } from "../src/lib/claude.ts";
import { textFromSseData, takeSseEvents } from "../src/lib/sse.ts";

test("sse parser keeps a partial event and reads text deltas", () => {
  const first = takeSseEvents(
    'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n' +
      "event: content_block_delta\ndata: {",
  );
  assert.equal(first.events.length, 1);
  assert.equal(textFromSseData(first.events[0].data), "Hello");
  assert.match(first.rest, /content_block_delta/);

  const thinking = textFromSseData(
    '{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"hidden"}}',
  );
  assert.equal(thinking, "");
});

test("claude request carries no client key and skips sampling controls", () => {
  const body = claudeRequestBody({
    model: "claude-sonnet-5-5",
    system: "Style card: spare.",
    user: "Audience: board",
    maxTokens: 800,
    stream: true,
    thinking: true,
  });
  assert.equal(body.model, "claude-sonnet-5-5");
  assert.equal("temperature" in body, false);
  assert.equal("api_key" in body, false);
  assert.deepEqual(body.thinking, { type: "between_tools" });
  const summary = summarizeClaudeError(401, '{"error":{"message":"bad key sk-ant-secretvalue"}}');
  assert.equal(summary.includes("sk-ant-secretvalue"), false);
  assert.match(summary, /\[redacted\]/);
});
