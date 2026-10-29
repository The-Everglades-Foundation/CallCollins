# Call Collins

Private writing room for The Everglades Foundation. On production, an
executive signs in with an email and name. On a preview URL, Cloudflare
Access checks an Everglades Foundation email first, and the room opens
for that address. The executive gives a brief and receives remarks
drafted in Mike Collins' voice.

The site is an Astro app on Cloudflare Workers. Claude is called from the
Worker with the `ANTHROPIC_API_KEY` secret. Visitors are not asked for a
key, and the key is not in the page.

Production: [callcollins.yacosta-240.workers.dev](https://callcollins.yacosta-240.workers.dev)

Preview: `*-callcollins.yacosta-240.workers.dev`

The Worker `callcollins` is published. The D1 schema is already applied on
`call-collins`, and the Worker secret is set. Checked October 28, 2026
(Eastern Time): sign-in opens the room, and a short draft returned text.

The first local build was the same morning. The Astro build succeeded at
10:26 AM Eastern Time. Wrangler was ready at `http://127.0.0.1:8787` at
10:27 AM, and local sign-in and the room returned HTTP 200 at 10:28 AM.

Repository:
[The-Everglades-Foundation/CallCollins](https://github.com/The-Everglades-Foundation/CallCollins)

## What a draft does

Production sign-in is the executive's email and name. Preview sign-in is
the email Cloudflare Access verified. Each account keeps its own drafts
and speaker shelf. The preview form cannot choose a different email.

The brief records the audience, the occasion, and the point. It accepts
pasted notes or one PDF, DOCX, or TXT file. The studio shows the file
name and uses the extracted text.

The Worker streams the remarks. On the same draft, the room can ask for
a shorter version, a more boardroom version, or talking points.

If Claude fails before any remarks arrive, the brief stays on the draft.

## Voice

**House voice** is shared. On October 29, 2026 (Eastern Time), 27
foundation drafts were loaded into the live database. They are remarks,
letters, a blog draft, and handouts. The drafts are Eric Eikenberg's,
including copies marked with JMC edits. The drafting instruction still
asks for Mike Collins' voice. The sidebar can add more PDF, DOCX, or TXT
examples.

Two files from that upload were not stored. One is a New York Times
article. The other is a packet of copyrighted news clips.

**Speaker shelf** is that executive's finished remarks. "Add to my shelf"
stores the latest remarks for that account. Newer approved speeches
outweigh older ones, and retrieval favors speeches close to the occasion.

**Style card** was refreshed the same morning from the twelve newest
remarks. "Refresh style card" rewrites it. The model itself stays
unchanged.

Drafts and examples are stored as text in the D1 database `call-collins`.
The original file bytes are not kept, and the drafts are not in git.

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

The remote schema is already applied, and the published Worker already
has the key. Run these again only when republishing:

```bash
npx wrangler d1 migrations apply call-collins --remote
npm run deploy
npx wrangler secret put ANTHROPIC_API_KEY
```

`npm run deploy` builds the site and publishes the Worker `callcollins`.
`wrangler secret put` stores the key on that Worker. The model id is the
var `ANTHROPIC_MODEL`, set to `claude-sonnet-5-5`.

The production workers.dev address is public. Sign-in there is still
email and name.

Preview URLs (`*-callcollins.yacosta-240.workers.dev`) are already behind
Cloudflare Access. The reusable policy allows
`@evergladesfoundation.org`, and the account's one-time PIN provider
sends the code. The preview Worker checks the Access token in
`Cf-Access-Jwt-Assertion` against
`https://evergladesfoundation.cloudflareaccess.com` and the audience tag
in `ACCESS_AUD`. This app serves static assets, so it does not read
`ctx.access`. A valid token opens the existing account for that email,
or creates one. Signing out also ends the Access session. Production is
unchanged until Access is turned on for that hostname too.

## Project structure

```text
src/pages/index.astro          sign-in
src/pages/room.astro           drafting room
src/pages/api/                 session, drafts, voice, shelf, style card
src/lib/claude.ts              server-side Messages API
migrations/0001_init.sql       D1 schema
wrangler.jsonc                 Worker, D1 binding, observability
```
