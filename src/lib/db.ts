import { newId, nowIso } from "./ids.ts";
import type { Brief } from "./prompt.ts";
import type { VoiceSample } from "./retrieve.ts";

export type Executive = {
  id: string;
  email: string;
  name: string;
};

export type DraftRow = {
  id: string;
  executive_id: string;
  audience: string;
  occasion: string;
  point: string;
  file_name: string | null;
  created_at: string;
};

export type MessageRow = {
  id: string;
  draft_id: string;
  role: string;
  kind: string;
  content: string;
  created_at: string;
};

export async function readExecutive(db: D1Database, token: string | undefined): Promise<Executive | null> {
  if (!token) return null;
  return db
    .prepare(
      `SELECT e.id AS id, e.email AS email, e.name AS name
       FROM sessions s
       JOIN executives e ON e.id = s.executive_id
       WHERE s.token = ?`,
    )
    .bind(token)
    .first<Executive>();
}

export async function ensureExecutive(db: D1Database, email: string, name: string): Promise<Executive> {
  const existing = await db
    .prepare("SELECT id, email, name FROM executives WHERE email = ?")
    .bind(email)
    .first<Executive>();
  if (existing) return existing;
  const created = nowIso();
  const id = newId();
  await db
    .prepare(
      `INSERT INTO executives (id, email, name, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO NOTHING`,
    )
    .bind(id, email, name, created)
    .run();
  console.log(JSON.stringify({ event: "sign_in" }));
  const row = await db
    .prepare("SELECT id, email, name FROM executives WHERE email = ?")
    .bind(email)
    .first<Executive>();
  if (!row) throw new Error("The account could not be saved.");
  return row;
}

export async function signIn(db: D1Database, email: string, name: string): Promise<string> {
  const created = nowIso();
  const id = newId();
  await db
    .prepare(
      `INSERT INTO executives (id, email, name, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name`,
    )
    .bind(id, email, name, created)
    .run();
  const row = await db.prepare("SELECT id FROM executives WHERE email = ?").bind(email).first<{ id: string }>();
  if (!row) throw new Error("The account could not be saved.");
  const token = newId();
  await db
    .prepare("INSERT INTO sessions (token, executive_id, created_at) VALUES (?, ?, ?)")
    .bind(token, row.id, created)
    .run();
  return token;
}

export async function signOut(db: D1Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export async function listDrafts(db: D1Database, executiveId: string): Promise<DraftRow[]> {
  const result = await db
    .prepare(
      `SELECT id, executive_id, audience, occasion, point, file_name, created_at
       FROM drafts WHERE executive_id = ? ORDER BY created_at DESC LIMIT 30`,
    )
    .bind(executiveId)
    .all<DraftRow>();
  return result.results ?? [];
}

export async function readDraft(db: D1Database, executiveId: string, draftId: string): Promise<DraftRow | null> {
  return db
    .prepare(
      `SELECT id, executive_id, audience, occasion, point, file_name, created_at
       FROM drafts WHERE id = ? AND executive_id = ?`,
    )
    .bind(draftId, executiveId)
    .first<DraftRow>();
}

export async function listMessages(db: D1Database, draftId: string): Promise<MessageRow[]> {
  const result = await db
    .prepare(
      `SELECT id, draft_id, role, kind, content, created_at
       FROM messages WHERE draft_id = ? ORDER BY created_at ASC`,
    )
    .bind(draftId)
    .all<MessageRow>();
  return result.results ?? [];
}

export async function createDraft(db: D1Database, executiveId: string, brief: Brief, content: string): Promise<string> {
  const id = newId();
  const created = nowIso();
  await db
    .prepare(
      `INSERT INTO drafts (id, executive_id, audience, occasion, point, file_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, executiveId, brief.audience, brief.occasion, brief.point, brief.fileName, created)
    .run();
  await addMessage(db, id, "user", "brief", content);
  return id;
}

export async function addMessage(
  db: D1Database,
  draftId: string,
  role: string,
  kind: string,
  content: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO messages (id, draft_id, role, kind, content, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(newId(), draftId, role, kind, content, nowIso())
    .run();
}

export async function listHouse(db: D1Database): Promise<VoiceSample[]> {
  const result = await db
    .prepare(
      `SELECT id, scope, title, speaker, audience, occasion, spoken_on, body, created_at
       FROM voice_samples WHERE scope = 'house' ORDER BY created_at DESC LIMIT 40`,
    )
    .all<VoiceSample>();
  return (result.results ?? []).map((row) => ({ ...row, scope: "house" }));
}

export async function listShelf(db: D1Database, executiveId: string): Promise<VoiceSample[]> {
  const result = await db
    .prepare(
      `SELECT id, scope, title, speaker, audience, occasion, spoken_on, body, created_at
       FROM voice_samples WHERE scope = 'shelf' AND executive_id = ?
       ORDER BY COALESCE(spoken_on, created_at) DESC LIMIT 20`,
    )
    .bind(executiveId)
    .all<VoiceSample>();
  return (result.results ?? []).map((row) => ({ ...row, scope: "shelf" }));
}

export async function addVoiceSample(
  db: D1Database,
  sample: {
    executiveId: string | null;
    scope: "house" | "shelf";
    title: string;
    speaker: string | null;
    audience: string | null;
    occasion: string | null;
    spokenOn: string | null;
    body: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO voice_samples
        (id, executive_id, scope, title, speaker, audience, occasion, spoken_on, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      newId(),
      sample.executiveId,
      sample.scope,
      sample.title,
      sample.speaker,
      sample.audience,
      sample.occasion,
      sample.spokenOn,
      sample.body,
      nowIso(),
    )
    .run();
}

export async function readStyleCard(db: D1Database): Promise<string> {
  const row = await db.prepare("SELECT body FROM style_cards WHERE id = 'house'").first<{ body: string }>();
  return row?.body ?? "";
}

export async function writeStyleCard(db: D1Database, body: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO style_cards (id, body, updated_at) VALUES ('house', ?, ?)
       ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
    )
    .bind(body, nowIso())
    .run();
}
