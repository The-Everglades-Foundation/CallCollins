import type { VoiceSample } from "./retrieve.ts";

export type Brief = {
  audience: string;
  occasion: string;
  point: string;
  notes: string;
  fileName: string | null;
};

export type RevisionKind = "shorter" | "boardroom" | "talking_points";

export const CHANGE_LIMIT = 4_000;

const REVISION: Record<RevisionKind, string> = {
  shorter: "Cut the remarks to about half. Keep the point and the occasion.",
  boardroom: "Rewrite for a board table. Less oratory, more decision, still in Collins' voice.",
  talking_points: "Turn the remarks into spoken talking points. Short lines. No essay.",
};

export function isRevisionKind(value: string): value is RevisionKind {
  return value === "shorter" || value === "boardroom" || value === "talking_points";
}

export function systemPrompt(styleCard: string, examples: string): string {
  return [
    "You draft remarks in Mike Collins' voice for The Everglades Foundation.",
    "Write the remarks themselves. No title, no preamble, and no notes about your process.",
    "House voice is Collins' own speeches, letters, talking points, and op-eds.",
    "Speaker shelf is this executive's approved speeches. Newer approved speeches outweigh older ones.",
    "Stay close to the occasion.",
    "Use only facts that appear in the brief or the examples. Do not invent statistics, quotations, or citations.",
    "",
    "Style card:",
    styleCard.trim() || "No style card yet. Be clear, specific, and spare.",
    "",
    "Retrieved examples:",
    examples.trim() || "None loaded.",
  ].join("\n");
}

export function briefPrompt(brief: Brief): string {
  const lines = [
    `Audience: ${brief.audience}`,
    `Occasion: ${brief.occasion}`,
    `Point: ${brief.point}`,
    "",
    "Brief:",
    brief.notes.trim() || "(No pasted notes.)",
  ];
  if (brief.fileName) {
    lines.push("", `Attached file name: ${brief.fileName}`);
  }
  return lines.join("\n");
}

export function revisionPrompt(kind: RevisionKind, latest: string, brief: Brief): string {
  return [
    REVISION[kind],
    "",
    `Audience: ${brief.audience}`,
    `Occasion: ${brief.occasion}`,
    `Point: ${brief.point}`,
    "",
    "Latest remarks:",
    latest,
  ].join("\n");
}

export function changePrompt(request: string, latest: string, brief: Brief, earlier: string[]): string {
  const history = earlier.length
    ? ["Earlier change requests:", ...earlier.map((item) => `- ${item}`), ""]
    : [];
  return [
    "Revise the latest remarks to follow the requested change.",
    "Keep Mike Collins' voice, the audience, and the occasion.",
    "Keep facts the request does not ask you to remove. Do not invent statistics, quotations, or citations.",
    "Write the revised remarks themselves. No title and no preamble.",
    "",
    ...history,
    `Requested change: ${request}`,
    "",
    `Audience: ${brief.audience}`,
    `Occasion: ${brief.occasion}`,
    `Point: ${brief.point}`,
    "",
    "Latest remarks:",
    latest,
  ].join("\n");
}

export function formatExamples(samples: VoiceSample[]): string {
  return samples
    .map((sample) => {
      const head = [
        sample.scope === "shelf" ? "Speaker shelf" : "House voice",
        sample.title,
        sample.speaker,
        sample.spoken_on,
        sample.audience,
        sample.occasion,
      ]
        .filter(Boolean)
        .join(" · ");
      const body = sample.body.length > 1200 ? `${sample.body.slice(0, 1200)}…` : sample.body;
      return `${head}\n${body}`;
    })
    .join("\n\n");
}

export function styleCardPrompt(samples: VoiceSample[]): string {
  return [
    "Distill a style card an editor can reuse. Stay under 220 words.",
    "Cover sentence length, formality, how a point is opened, and what this voice avoids.",
    "Do not copy a full speech. Do not invent biographical facts.",
    "",
    formatExamples(samples),
  ].join("\n");
}
