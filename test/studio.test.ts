import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { zipSync, strToU8 } from "fflate";
import { docxToText, readUpload } from "../src/lib/files.ts";
import { briefPrompt, changePrompt, isRevisionKind, systemPrompt } from "../src/lib/prompt.ts";
import { selectExamples, type VoiceSample } from "../src/lib/retrieve.ts";

test("docx text keeps the paragraph", async () => {
  const xml =
    '<?xml version="1.0"?><w:document><w:body><w:p><w:r><w:t>Send clean water south.</w:t></w:r></w:p></w:body></w:document>';
  const zipped = zipSync({ "word/document.xml": strToU8(xml) });
  assert.match(docxToText(zipped), /Send clean water south/);
  const file = new File([zipped], "remarks.docx");
  const read = await readUpload(file);
  assert.equal(read.name, "remarks.docx");
  assert.match(read.text, /Send clean water south/);
});

test("retrieval favors a newer matching shelf speech", () => {
  const samples: VoiceSample[] = [
    sample("house", "Old letter", "a general letter", "2010-01-01"),
    sample("shelf", "Board remarks", "the board vote on restoration", "2026-10-01"),
    sample("house", "Bay talk", "florida bay and the board", "2024-05-01"),
  ];
  const picked = selectExamples(samples, { audience: "board", occasion: "vote", point: "restoration" }, 2);
  assert.equal(picked[0]?.title, "Board remarks");
  assert.equal(picked.length, 2);
});

test("prompts carry the style card and the brief", () => {
  const system = systemPrompt("Short sentences. No ornament.", "");
  assert.match(system, /Short sentences/);
  assert.match(system, /Do not invent statistics/);
  const brief = briefPrompt({
    audience: "the board",
    occasion: "October meeting",
    point: "Keep the promise on the reservoir",
    notes: "The brief says the reservoir is funded.",
    fileName: "notes.txt",
  });
  assert.match(brief, /Keep the promise/);
  assert.match(brief, /notes.txt/);
});

test("a change request revises the latest remarks", () => {
  assert.equal(isRevisionKind("change"), false);
  const prompt = changePrompt(
    "Open with the reservoir.",
    "Send clean water south.",
    {
      audience: "the board",
      occasion: "October meeting",
      point: "Keep the promise",
      notes: "",
      fileName: null,
    },
    ["Cut the second paragraph."],
  );
  assert.match(prompt, /Open with the reservoir/);
  assert.match(prompt, /Send clean water south/);
  assert.match(prompt, /Cut the second paragraph/);
  assert.match(prompt, /Do not invent statistics/);
  assert.match(prompt, /the board/);
});

test("the room offers a change request and a Word download", () => {
  const room = readFileSync("src/pages/room.astro", "utf8");
  assert.match(room, /id="chat"/);
  assert.match(room, /Request a change/);
  assert.match(room, /Download Word/);
  assert.match(room, /\/docx/);
});

test("the pages do not ask the visitor for an API key", () => {
  const sources = [
    "src/pages/index.astro",
    "src/pages/room.astro",
    "src/layouts/Layout.astro",
  ].map((path) => readFileSync(path, "utf8"));
  const html = sources.join("\n");
  assert.equal(/api[_-]?key/i.test(html), false);
  assert.equal(/anthropic/i.test(html), false);
  assert.equal(/type="password"/i.test(html), false);
});

function sample(scope: "house" | "shelf", title: string, body: string, spokenOn: string): VoiceSample {
  return {
    id: title,
    scope,
    title,
    speaker: "Mike Collins",
    audience: null,
    occasion: null,
    spoken_on: spokenOn,
    body,
    created_at: spokenOn,
  };
}
