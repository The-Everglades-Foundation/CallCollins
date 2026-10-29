import assert from "node:assert/strict";
import test from "node:test";
import { isPreviewHost, nameFromEmail } from "../src/lib/gate.ts";

test("only Worker preview hostnames use Access", () => {
  assert.equal(isPreviewHost("callcollins.yacosta-240.workers.dev"), false);
  assert.equal(isPreviewHost("abc123-callcollins.yacosta-240.workers.dev"), true);
  assert.equal(isPreviewHost("ABC123-callcollins.yacosta-240.workers.dev:443"), true);
  assert.equal(isPreviewHost("callcollins.yacosta-240.workers.dev."), false);
  assert.equal(isPreviewHost("evil-callcollins.example.com"), false);
  assert.equal(isPreviewHost("localhost"), false);
});

test("a new Access account gets a readable name from the email", () => {
  assert.equal(nameFromEmail("mike.collins@evergladesfoundation.org"), "Mike Collins");
  assert.equal(nameFromEmail("yacosta@evergladesfoundation.org"), "Yacosta");
});
