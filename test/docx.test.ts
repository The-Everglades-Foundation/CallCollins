import assert from "node:assert/strict";
import test from "node:test";
import { unzipSync } from "fflate";
import { docxToText } from "../src/lib/files.ts";
import { remarksDocx, remarksFilename } from "../src/lib/docx.ts";

test("a remarks file is a Word document with the speech", () => {
  const bytes = remarksDocx({
    point: "Keep the promise & the reservoir",
    audience: "the board",
    occasion: "October meeting",
    kind: "speech",
    body: "Send clean water south.\n\nName the reservoir.\nKeep the line.",
  });
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  const files = unzipSync(bytes);
  assert.ok(files["[Content_Types].xml"]);
  assert.ok(files["word/document.xml"]);
  assert.ok(files["word/styles.xml"]);
  const xml = new TextDecoder().decode(files["word/document.xml"]);
  assert.match(xml, /Keep the promise &amp; the reservoir/);
  assert.equal(xml.includes("Keep the promise & the reservoir"), false);
  const text = docxToText(bytes);
  assert.match(text, /Keep the promise & the reservoir/);
  assert.match(text, /the board/);
  assert.match(text, /October meeting/);
  assert.match(text, /Send clean water south/);
  assert.match(text, /Name the reservoir/);
  assert.match(text, /Keep the line/);
});

test("talking points are labeled and the file name stays plain", () => {
  const bytes = remarksDocx({
    point: 'Vote "yes" / today!',
    audience: "members",
    occasion: "call",
    kind: "talking_points",
    body: "One point.",
  });
  assert.match(docxToText(bytes), /Talking points/);
  assert.equal(remarksFilename('Vote "yes" / today!'), "vote-yes-today.docx");
  assert.equal(remarksFilename("???"), "remarks.docx");
  assert.equal(remarksFilename("Keep the promise").includes('"'), false);
});
