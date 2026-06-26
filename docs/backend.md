# Helix backend documentation

Helix is the internal editor for Helix health app documentation. It stores content in a cloud database and serves it through a small set of web endpoints that the editor (and other tools) can call.

**Live site:** [documentation.helixhealth.app](https://documentation.helixhealth.app)  
**Repository:** [github.com/browndove/textsave](https://github.com/browndove/textsave)

---

## Table of contents

1. [Overview](#overview)
2. [Quick reference](#quick-reference)
3. [Database](#database)
4. [API](#api)
5. [Operations](#operations)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What the backend does

The backend handles three kinds of content:

| Kind | Where it appears | What gets saved |
|------|------------------|-----------------|
| **Drafts** | Sidebar under your personal notes | Free-form text you write in the editor |
| **FAQ** | Pinned document — *Helix App Frequently Asked Questions* | Questions and answers |
| **How-To Guide** | Pinned document — *HELIX How-To Guide* | Topics, each with numbered steps and optional tips |

When someone opens a pinned document for the first time, the system loads starter content from built-in seed files if the database is empty. After that, everything comes from the database.

### How data flows

```
Editor in the browser
        │
        ▼
   Web endpoints (/api/...)
        │
        ▼
   Cloud database (PostgreSQL on Neon)
        │
        └── Seed files (FAQ & How-To starters in /data)
```

- **Saving a pinned document:** the editor sends the full document (title + all entries). The backend replaces the previous version in one transaction so you never end up with a half-saved file.
- **Saving a draft:** each save creates a new draft record with a title derived from the first line of text (unless you provide a title).
- **Importing a file:** upload PDF, Word, or plain text → the backend extracts text, detects questions or topics, and returns a preview. It does not write to the database until you save in the editor.

---

## Quick reference

### Pinned document IDs

| ID | Document |
|----|----------|
| `helix-faq` | Helix App Frequently Asked Questions |
| `helix-howto` | HELIX How-To Guide |

### Common tasks

| Task | Command |
|------|---------|
| Run locally | `npm run dev` |
| Create database tables | `npm run db:migrate` |
| Reset How-To from seed file | `npm run db:reseed-howto` |
| Import a PDF into a seed file | `npm run import-faq` |

### API at a glance

| Action | Method | Path |
|--------|--------|------|
| Load FAQ or How-To | GET | `/api/faq?id=…` |
| Load with pagination | GET | `/api/faq?id=…&limit=…&offset=…` |
| Save FAQ or How-To | PUT | `/api/faq` |
| Import file (preview only) | POST | `/api/faq/import` |
| List drafts | GET | `/api/versions` |
| Save draft | POST | `/api/versions` |
| Delete draft | DELETE | `/api/versions?id=…` |

**Required configuration:** a database connection string in `.env.local` as `DATABASE_URL`. See [Operations](#operations).

---

## Database

Helix stores all persistent content in **PostgreSQL**, hosted on **Neon** (a managed cloud database). The connection is configured with `DATABASE_URL` in `.env.local`.

To create or update tables:

```bash
npm run db:migrate
```

The table definitions live in `lib/db/schema.sql` if engineers need the exact source.

### Big picture

Think of the database as three areas:

```
┌─────────────────────────────────────────────────────────┐
│  PINNED DOCUMENTS                                       │
│  (FAQ + How-To — always in the sidebar)                 │
│                                                         │
│   Document: "Helix FAQ"          Document: "How-To"     │
│        │                                │               │
│        ├── Question 1                   ├── Topic 1     │
│        ├── Question 2                   ├── Topic 2     │
│        └── ...                          └── ...         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  DRAFTS (separate — your personal saved notes)          │
│   Draft A    Draft B    Draft C    ...                  │
└─────────────────────────────────────────────────────────┘
```

Pinned documents and drafts do not share storage. Deleting a draft never affects the FAQ or How-To.

### Pinned documents

Each pinned file in the sidebar has one **document record**:

| Field | Meaning |
|-------|---------|
| **ID** | Stable name used by the app — `helix-faq` or `helix-howto` |
| **Title** | Display name shown in the sidebar |
| **Last updated** | When the document was last saved |

### Entries (questions and topics)

Inside each pinned document are **entries** — one row per accordion item in the editor.

| Field | Meaning |
|-------|---------|
| **ID** | Unique identifier for this entry (stays the same when you reorder) |
| **Document** | Which pinned file this belongs to |
| **Question / topic title** | The accordion heading — a question for FAQ, a topic name for How-To |
| **Answer / body** | The content inside the accordion (format differs — see below) |
| **Sort order** | Position in the list (first item = 0) |
| **Last updated** | When this entry was last changed |

If a pinned document is deleted from the database, all of its entries are removed automatically. Entries are always returned in sort order so the accordion matches what you saved.

### How FAQ answers are stored

FAQ entries are simple: the answer is **plain text**, exactly as you type it in the editor.

**Example**

- **Question:** What is HELIX?
- **Answer:** HELIX is a secure clinical communication platform used by care teams to coordinate patient care.

Multi-paragraph answers are stored as one block of text with line breaks preserved.

### How How-To content is stored

How-To topics are richer. Each topic’s body is stored as structured data with two lists:

| Part | What it is in the editor |
|------|--------------------------|
| **Steps** | Numbered instructions inside the topic |
| **Tips** | Blue callout boxes (helpful notes, not numbered steps) |

Behind the scenes this is saved as structured data. You do not need to edit that format by hand — the How-To editor reads and writes it for you.

**Conceptual example for one topic**

- **Topic:** Make a Voice or Video Call
- **Steps:**
  1. Tap *Calls* in the bottom navigation bar.
  2. Select the contact or enter a number.
  3. Choose voice or video.
- **Tips:**
  - Always sign in to your role at the start of a shift.

The How-To Guide currently has **37 topics** in the seed data. Topic titles and step text can be updated in the editor or refreshed from the seed file.

### Drafts

Drafts are personal saved notes from the free-form editor. Each draft stores:

| Field | Meaning |
|-------|---------|
| **ID** | Unique identifier |
| **Title** | Shown in the sidebar — taken from your title or the first line of text |
| **Content** | Full body of the note |
| **Author** | Who saved it (defaults to “You”) |
| **Created** | When the draft was saved |

Drafts are listed newest first. There is no link between a draft and the FAQ or How-To documents.

### First-time loading (seeding)

When someone requests a pinned document that does not exist in the database yet, the system **automatically copies** the matching seed file into the database:

| Document | Seed file |
|----------|-----------|
| FAQ | `data/helix-faq-seed.json` |
| How-To | `data/helix-howto-seed.json` |

This only happens once per document. After that, the database is the source of truth until you run a reseed script or save from the editor.

### Saving behavior

**Pinned documents:** saving sends the entire document. The backend updates the document header, removes old entries, and inserts the current list. This keeps the file consistent — you never get duplicate or orphaned entries from a partial save.

**Drafts:** each save creates a **new** draft. Older drafts stay in the list until you delete them.

### Terminology

| Term | FAQ | How-To |
|------|-----|--------|
| Accordion item | Question | Topic |
| Heading | Question text | Topic title |
| Body | Answer (plain text) | Steps + tips |
| Numbered list inside body | — | Steps |
| Blue callout | — | Tips |

---

## API

Helix exposes a small set of web endpoints under `/api`. The editor uses these to load and save content. External tools can use the same endpoints against [documentation.helixhealth.app](https://documentation.helixhealth.app) or your local dev server.

All responses are JSON. Errors return a JSON object with an `error` message and an appropriate status code (400 = bad request, 404 = not found, 500 = server error).

### Pinned documents — FAQ & How-To

**Base path:** `/api/faq`

#### Load a document

```
GET /api/faq?id=helix-faq
GET /api/faq?id=helix-howto
```

If you omit `id`, it defaults to the FAQ (`helix-faq`).

**Successful response** — full document:

```json
{
  "id": "helix-faq",
  "title": "Helix App Frequently Asked Questions",
  "updatedAt": "2025-06-20T14:30:00.000Z",
  "entries": [
    {
      "id": "…",
      "question": "What is HELIX?",
      "answer": "HELIX is a secure clinical communication platform…",
      "updatedAt": "2025-06-20T14:30:00.000Z"
    }
  ]
}
```

For How-To documents, each entry’s `answer` contains the structured steps-and-tips data described in [How How-To content is stored](#how-how-to-content-is-stored).

| Situation | Status |
|-----------|--------|
| Unknown document id | 404 |
| Database or server problem | 500 |

#### Load a document in chunks (pagination)

Use this when you only need part of a large document — for example, loading 20 topics at a time.

```
GET /api/faq?id=helix-howto&limit=20&offset=0
```

| Parameter | Required | Meaning |
|-----------|----------|---------|
| `id` | No (defaults to FAQ) | `helix-faq` or `helix-howto` |
| `limit` | No* | How many entries to return (1–100) |
| `offset` | No | How many entries to skip (default 0) |

\* If either `limit` or `offset` is provided, the response includes a `pagination` block. If neither is provided, you get the full document with no pagination block.

**Example response with pagination:**

```json
{
  "id": "helix-howto",
  "title": "HELIX How-To Guide",
  "updatedAt": "2025-06-20T14:30:00.000Z",
  "entries": [ "…first 20 entries…" ],
  "pagination": {
    "total": 37,
    "limit": 20,
    "offset": 0,
    "count": 20,
    "hasMore": true
  }
}
```

| Pagination field | Meaning |
|------------------|---------|
| `total` | Total entries in the document |
| `limit` | Page size you asked for (or `null` if only offset was set) |
| `offset` | Where this page starts |
| `count` | How many entries are in this response |
| `hasMore` | `true` if more pages exist |

**Next page:** increase `offset` by `limit` (e.g. `offset=20`, then `offset=40`).

**Validation errors** (status 400): `limit` must be a positive whole number (max 100); `offset` must be zero or a positive whole number.

#### Save a document

```
PUT /api/faq
```

Send the full document in the request body. The backend replaces all entries for that document.

**Request body:**

```json
{
  "id": "helix-faq",
  "title": "Helix App Frequently Asked Questions",
  "updatedAt": "2025-06-24T10:00:00.000Z",
  "entries": [
    {
      "id": "existing-or-new-id",
      "question": "What is HELIX?",
      "answer": "Updated answer text.",
      "updatedAt": "2025-06-24T10:00:00.000Z"
    }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Must be `helix-faq` or `helix-howto` |
| `title` | Yes | Document display name |
| `entries` | Yes | Array; order in the array = order in the app |
| `updatedAt` | Yes | ISO date string |
| Each entry `id` | Yes | Keep existing ids when editing; new entries can use new ids |
| Each entry `question` | Yes | Question or topic title |
| Each entry `answer` | Yes | Plain text (FAQ) or structured How-To body |
| Each entry `updatedAt` | Yes | ISO date string |

**Successful response:** the saved document (same shape as GET).

| Situation | Status |
|-----------|--------|
| Missing id, unknown id, or entries not an array | 400 |
| Server or database error | 500 |

### Import from file

**Path:** `POST /api/faq/import`

Upload a file to extract questions or topics **without** saving to the database. The editor uses this for “import from PDF” flows; you review the preview, then save manually.

**Request:** `multipart/form-data`

| Field | Required | Meaning |
|-------|----------|---------|
| `file` | Yes | The file to import |
| `documentId` | No | `helix-faq` or `helix-howto` — picks the right parsing style |
| `format` | No | `faq` or `howto` — overrides auto-detection |

**Supported file types**

| Type | Extensions |
|------|------------|
| PDF | `.pdf` |
| Word | `.docx` |
| Text | `.txt`, `.md`, or any `text/*` type |

**Maximum file size:** 15 MB

**Parsing rules**

- **FAQ:** looks for lines that look like questions (ending with `?`, or labeled like “Q1:”)
- **How-To:** looks for numbered sections like `1. Set Up Your Profile`

**Successful response:**

```json
{
  "fileName": "Helix App Frequently Asked Questions.pdf",
  "count": 91,
  "entries": [ "…full parsed entries…" ],
  "preview": [
    {
      "question": "What is HELIX?",
      "answer": "HELIX is a secure…"
    }
  ]
}
```

`preview` is the first five entries with answers trimmed to 200 characters.

| Situation | Status |
|-----------|--------|
| No file uploaded | 400 |
| File too large | 400 |
| Unsupported file type | 500 (with message) |
| No questions/topics found in file | 422 |
| Other processing error | 500 |

### Drafts

**Base path:** `/api/versions`

Drafts are personal saved notes, separate from FAQ and How-To.

#### List all drafts

```
GET /api/versions
```

Returns an array of drafts, **newest first**.

```json
[
  {
    "id": "…",
    "title": "Meeting notes from Tuesday",
    "content": "Full text of the draft…",
    "author": "You",
    "createdAt": "2025-06-24T09:15:00.000Z"
  }
]
```

#### Save a new draft

```
POST /api/versions
```

**Request body:**

```json
{
  "content": "Text of the draft (required)",
  "title": "Optional custom title"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `content` | Yes | Cannot be empty or whitespace only |
| `title` | No | If omitted, title is derived from the first line of content |

**Successful response:** the created draft (status 201).

If no title is given, the system uses the first line of text (trimmed and shortened if very long), or a time-based label like “Version 2:30 PM”.

#### Delete a draft

```
DELETE /api/versions?id={draft-id}
```

| Parameter | Required |
|-----------|----------|
| `id` | Yes — the draft’s id from GET or POST |

**Successful response:** `{ "ok": true }`

| Situation | Status |
|-----------|--------|
| Missing `id` | 400 |
| Draft not found | 404 |

---

## Operations

### Requirements

- **Node.js** (for local development and scripts)
- A **PostgreSQL** database — production uses [Neon](https://neon.tech)
- **npm** to install dependencies and run commands

### Environment setup

1. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

2. Set `DATABASE_URL` in `.env.local` to your database connection string.

   **Important:** if the URL contains `&` (common with Neon), wrap the whole value in quotes:

   ```
   DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
   ```

3. Create the database tables:

   ```bash
   npm run db:migrate
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

`.env.local` is not committed to git — each developer and the production host need their own copy.

### npm scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Check code style |
| `npm run db:migrate` | Create or update database tables from `lib/db/schema.sql` |
| `npm run db:reseed-howto` | Replace the How-To document in the database with `data/helix-howto-seed.json` |
| `npm run import-faq` | Parse a PDF into a seed JSON file (see below) |

### Database migration

Run after cloning the repo or when `lib/db/schema.sql` changes:

```bash
npm run db:migrate
```

This is safe to run multiple times — it only creates tables and indexes if they do not already exist.

### Seed files

Starter content for pinned documents lives in the repo as JSON:

| File | Document |
|------|----------|
| `data/helix-faq-seed.json` | FAQ |
| `data/helix-howto-seed.json` | How-To Guide (37 topics) |

**When seeds are used**

- The first time a document is loaded and the database has no row for it, the matching seed is copied in automatically.
- Running `npm run db:reseed-howto` **overwrites** the How-To in the database with the seed file (FAQ has no dedicated reseed script — edit the seed and save via the editor).

**Typical workflow for bulk How-To updates**

1. Edit `data/helix-howto-seed.json` (or regenerate from PDF — see below).
2. Run `npm run db:reseed-howto`.
3. Verify in the app at [documentation.helixhealth.app](https://documentation.helixhealth.app) or locally.

### Importing from PDF (command line)

To rebuild a seed file from a source PDF:

```bash
npm run import-faq
```

Defaults: reads `Helix App Frequently Asked Questions.pdf` from the project root, writes `data/helix-faq-seed.json`, copies the PDF to `public/`.

**Options** (pass after the script name):

| Flag | Example | Purpose |
|------|---------|---------|
| `--id` | `--id helix-howto` | Which document (`helix-faq` or `helix-howto`) |
| `--pdf` | `--pdf "HELIX app How-to Guide-1.pdf"` | Source PDF path |
| `--out` | `--out data/helix-howto-seed.json` | Output JSON path |
| `--title` | `--title "HELIX How-To Guide"` | Document title in the seed |
| `--format` | `--format howto` | `faq` or `howto` parsing mode |

**Example — regenerate How-To seed:**

```bash
npm run import-faq -- --id helix-howto --format howto
npm run db:reseed-howto
```

Users can also upload PDF, Word, or text files through the editor (`POST /api/faq/import`) — that returns a preview without writing to the database until they save.

### Source PDFs

Reference PDFs are stored in `public/` for download links in the sidebar:

| File | Document |
|------|----------|
| `public/Helix App Frequently Asked Questions.pdf` | FAQ |
| `public/HELIX app How-to Guide-1.pdf` | How-To |

### Production deployment

- **URL:** [documentation.helixhealth.app](https://documentation.helixhealth.app)
- **Database:** Neon PostgreSQL — `DATABASE_URL` must be set in the hosting environment (e.g. Vercel project settings), not only in `.env.local`.

After deploying schema changes, run `npm run db:migrate` against the production database.

### Where the code lives

| Area | Location |
|------|----------|
| API routes | `app/api/faq/`, `app/api/versions/` |
| Database access | `lib/db/repository.ts` |
| Table definitions | `lib/db/schema.sql` |
| Document registry | `lib/documents.ts` |
| FAQ / How-To parsing | `lib/faq-parse.ts`, `lib/howto-content.ts` |
| Maintenance scripts | `scripts/` |

---

## Troubleshooting

| Problem | Likely cause | What to try |
|---------|--------------|-------------|
| “DATABASE_URL is not set” | Missing `.env.local` | Copy `.env.example`, set connection string |
| Connection errors with Neon | Unquoted URL with `&` | Wrap `DATABASE_URL` in double quotes |
| Tables do not exist | Migration not run | `npm run db:migrate` |
| How-To content looks wrong after bulk edit | DB out of sync with seed | `npm run db:reseed-howto` |
| Import finds no topics | PDF layout does not match expected numbering | Check section headers like `8. Search Within…`; may need manual seed edits |
| File import too large | Over 15 MB | Split or compress source file |
