# Call Collins

Private writing room for The Everglades Foundation. An executive signs in
with an email and name, gives a brief, and receives remarks drafted in
Mike Collins' voice.

The site is an Astro app on Cloudflare Workers. Claude is called from the
Worker with the `ANTHROPIC_API_KEY` secret. Visitors are not asked for a
key, and the key is not in the page.

Production: [callcollins.yacosta-240.workers.dev](https://callcollins.yacosta-240.workers.dev)

Preview: `*-callcollins.yacosta-240.workers.dev`

Repository:
[The-Everglades-Foundation/CallCollins](https://github.com/The-Everglades-Foundation/CallCollins)

## What a draft does

Sign-in is the executive's email and name. Each account keeps its own
drafts and speaker shelf.

The brief records the audience, the occasion, and the point. It accepts
pasted notes or one PDF, DOCX, or TXT file. The studio shows the file
name and uses the extracted text.

The Worker streams the remarks. On the same draft, the room can ask for
a shorter version, a more boardroom version, or talking points.

If Claude fails before any remarks arrive, the brief stays on the draft.

## Voice

**House voice** is shared. The sidebar accepts PDF, DOCX, and TXT
examples, several at a time. Those uploads are examples. The library
starts empty until someone adds them.

**Speaker shelf** is that executive's finished remarks. "Add to my shelf"
stores the latest remarks for that account. Newer approved speeches
outweigh older ones, and retrieval favors speeches close to the occasion.

**Style card** is a short distillation of the loaded examples. "Refresh
style card" rewrites it. The model itself stays unchanged.

Drafts and examples are stored as text in the D1 database `call-collins`.
The original file bytes are not kept.

## Commands

Requires Node.js 22.12 or newer.

```bash
npm install
npm test
npm run dev
```

Local development uses Wrangler's local D1. Sign in to the Cloudflare
account once with `npx wrangler login` before a remote migration or
deploy. Apply the schema once:

```bash
npx wrangler d1 migrations apply call-collins --local
```

Copy `.dev.vars.example` to `.dev.vars` and set `ANTHROPIC_API_KEY` there
for local drafts. `.dev.vars` stays off git.

```bash
npx wrangler d1 migrations apply call-collins --remote
npm run deploy
npx wrangler secret put ANTHROPIC_API_KEY
```

`npm run deploy` builds the site and publishes the Worker `callcollins`.
`wrangler secret put` stores the key on that Worker. The model id is the
var `ANTHROPIC_MODEL`, set to `claude-sonnet-5-5`.

The workers.dev address is public. Sign-in is email and name.

## Project structure

```text
src/pages/index.astro          sign-in
src/pages/room.astro           drafting room
src/pages/api/                 session, drafts, voice, shelf, style card
src/lib/claude.ts              server-side Messages API
migrations/0001_init.sql       D1 schema
wrangler.jsonc                 Worker, D1 binding, observability
```
