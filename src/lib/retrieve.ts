export type VoiceSample = {
  id: string;
  scope: "house" | "shelf";
  title: string;
  speaker: string | null;
  audience: string | null;
  occasion: string | null;
  spoken_on: string | null;
  body: string;
  created_at: string;
};

export type OccasionQuery = {
  audience: string;
  occasion: string;
  point: string;
};

export function selectExamples(samples: VoiceSample[], query: OccasionQuery, limit: number): VoiceSample[] {
  const words = tokens(`${query.audience} ${query.occasion} ${query.point}`);
  return samples
    .map((sample) => ({ sample, score: scoreSample(sample, words) }))
    .sort((a, b) => b.score - a.score || stamp(b.sample).localeCompare(stamp(a.sample)))
    .slice(0, limit)
    .map((row) => row.sample);
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
}

function stamp(sample: VoiceSample): string {
  return sample.spoken_on || sample.created_at;
}

function scoreSample(sample: VoiceSample, words: string[]): number {
  const hay = `${sample.title} ${sample.audience ?? ""} ${sample.occasion ?? ""} ${sample.body}`.toLowerCase();
  let score = sample.scope === "shelf" ? 2 : 0;
  for (const word of words) {
    if (hay.includes(word)) score += 1;
  }
  const when = Date.parse(stamp(sample));
  if (Number.isFinite(when)) {
    const ageDays = (Date.now() - when) / 86_400_000;
    score += Math.max(0, 3 - ageDays / 30);
  }
  return score;
}
