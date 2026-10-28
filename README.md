# Call Collins

Private writing room for The Everglades Foundation. An executive uploads
or pastes a brief and receives remarks drafted in Mike Collins' voice.

Repository:
[The-Everglades-Foundation/CallCollins](https://github.com/The-Everglades-Foundation/CallCollins)

## Status

The studio is an Astro app with the Cloudflare adapter. It has run
locally. This repository currently holds the project README. A
Cloudflare deploy still needs Wrangler access, a D1 database named
`call-collins`, an R2 bucket named `call-collins-files`, the
`ANTHROPIC_API_KEY` secret, and the remote migration.

`ANTHROPIC_WORKSPACE_ID` is optional. Claude drafts with the Anthropic
key and the Default workspace.

## A draft

Sign-in is the executive's email and name. Each account keeps its own
ideas.

The brief records the audience, the occasion, and the point. It accepts
a PDF, a DOCX, a TXT file, or pasted notes, and shows that file on the
draft.

The studio streams a speech, then keeps revisions in the same thread:
shorter, more boardroom, and talking points. The Vercel AI SDK is the
writing layer, so the model can be swapped without rewriting the room.

If Claude fails before a speech arrives, the studio saves an on-machine
draft and keeps the brief on the thread.

## Voice

**House voice** is Collins' own speeches, letters, talking points, and
op-eds. About 50 examples are already loaded. The ink sidebar can add
more PDF, DOCX, or TXT examples, several at a time. Those uploads
join House voice as examples.

**Speaker shelf** is an executive's finished speeches. A speech joins
the shelf when someone marks it approved. Approving a finished draft
opens that executive's shelf. Each file carries a date, speaker,
audience, and occasion.

Retrieval favors speeches close to the occasion. Newer approved
speeches outweigh older ones.

A short style card is distilled from material the firm is allowed to
use and stored as chunks a draft can retrieve. The card refreshes from
the loaded House voice examples, and a control can refresh it from
approved speeches. The model itself stays unchanged. Mailbox
passwords stay out of the studio, and drafts leave email accounts
untouched.

## Room

The drafting room is an ink sidebar, warm paper, a serif speech, and a
quiet composer.
