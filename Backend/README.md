# SpendIt — Backend

Turns a bank statement (PDF or CSV) into categorized transactions and
basic spending analytics. No manual expense entry required.

## Core flow

The whole backend is one pipeline, and every stage exists because the
stage before it can't be fully trusted — a bank statement is messy,
untrusted input, and an LLM's reading of it is a proposal, not a fact:

```
Upload (PDF or CSV)
  → extract          Gemini reads PDF text; CSV is already structured, parsed directly
  → categorize        Gemini, batched — PDF gets it during extraction,
                       CSV gets one batched call over unique descriptions
  → validate           reject anything structurally unusable: unparseable dates,
                       impossible calendar dates (Feb 31), non-numeric amounts,
                       dates outside a plausible range (before 2000, or in the future)
  → normalize          currency symbols/commas stripped, categories clamped to a
                       fixed set, dates stored as UTC midnight (no server-timezone
                       off-by-one-day bugs)
  → deduplicate        exact (date, description, amount) matches within a batch
                       are collapsed — mainly a safety net for chunk-boundary
                       overlap in PDF extraction
  → preview            returned to the client, NOT saved yet
  → confirm            user reviews/edits, then POSTs to save — re-validated,
                       re-deduplicated, and re-checked against the DB's unique
                       index, regardless of what the client sends
  → analytics          totals, category breakdown, monthly spend, a short
                       descriptive AI summary — computed only from what
                       survived every step above
```

Nothing is saved until confirm. The upload step only parses and returns
a preview, specifically so the user can catch a wrong category or amount
before it's persisted. This mirrors the standard defensive posture for
untrusted input: **the AI proposes a transaction's structure; deterministic
validation and business logic decide whether it's acceptable.**

## What's handled, and what's a known, deliberate limitation

Bank statements can go wrong in a lot of specific ways. Rather than
handling every one (which would mean OCR, encrypted-PDF support, a
merchant-normalization database, and semantic transfer/refund detection —
real scope for a real company, not a final-year project), this build
handles the ones that would actually make the numbers wrong, and is
upfront about the rest:

**Handled:**
- Malformed/non-JSON Gemini output → caught, that chunk is skipped, not the whole upload.
- A missing/invalid `GEMINI_API_KEY` → fails immediately with a clear error, not a silent "0 transactions found."
- One bad transaction in a batch → skipped individually (`skipped` count in the response), never aborts the rest.
- Chunk-boundary duplication (the same transaction extracted from both sides of a PDF chunk split) → chunks overlap slightly, and the resulting duplicate is caught by `dedupeTransactions`.
- Re-uploading the same statement → the DB's unique `(date, description, amount)` index silently drops exact repeats.
- Impossible calendar dates (`Feb 31`) → JS's `Date` normally rolls these over to a *different, wrong* date instead of erroring; this is explicitly checked and rejected.
- Implausible dates (before 2000, or in the future) → rejected rather than trusted.
- Currency symbols, commas, and case-inconsistent categories → normalized.
- Gemini rate limits (429s) → retried with backoff before giving up on that chunk.

**Known, accepted limitations (be ready to explain these, not apologize for them):**
- **Two genuinely separate transactions with the same date, description, and amount look identical** to the dedup/unique-index logic and will collapse into one. Bank statements don't expose a reliable per-transaction reference number to tell them apart. This is a deliberate simplification — the honest interview answer is "not necessarily a duplicate, but our key can't distinguish it from one."
- **No merchant-name normalization.** `SWIGGY*ORDER123`, `Swiggy India`, and `UPI/Swiggy/9876` aren't mapped to one canonical merchant — categorization relies on Gemini reading the description as-is.
- **No income-vs-expense semantics.** A credit is trusted as income and a debit as spending. A refund or a transfer between the user's own accounts would show up as regular income/spending rather than netting out — correctly identifying those needs transaction-type modeling that's out of scope here.
- **No OCR.** A scanned (image-only) PDF returns no extractable text and is cleanly rejected (`< 50 characters extracted`), rather than guessed at.
- **No password-protected PDF handling.** It fails the extraction step and surfaces as a generic parse error, not a specific "please unlock this file" message.
- **Sign correctness depends on Gemini for PDFs.** The prompt specifies debit = negative, credit = positive, but nothing independently double-checks the model got the sign right. CSV is actually more reliable here — sign is computed directly from real debit/credit columns, not inferred.

## Why an LLM, and where

- **PDF text is unstructured** — column layout, spacing, and even bank
  format vary. Gemini extracts transactions from it because a
  regex/positional parser breaks the moment the format changes.
- **CSV is already structured** — it's parsed directly with no AI call.
  It still gets a categorization pass (one batched Gemini call over the
  unique descriptions in the file, not one call per row).
- **Large PDFs are chunked and parsed in bounded concurrent batches**
  (`Promise.all` per batch, a short pause between batches) — real
  parallelism within a batch, without exceeding Gemini's free-tier
  requests-per-minute limit.
- **The AI insight is purely descriptive.** The prompt explicitly
  forbids advice or recommendations — it states what the numbers show
  and nothing more.

## Endpoints

| Method | Path                      | Does |
|--------|---------------------------|------|
| POST   | `/api/ingest/upload`      | Parses a PDF/CSV, returns an unsaved preview |
| POST   | `/api/transactions/confirm` | Re-validates and saves a (possibly edited) preview |
| GET    | `/api/transactions`       | Paginated transaction list |
| PATCH  | `/api/transactions/:id`   | Edit one transaction |
| DELETE | `/api/transactions/:id`   | Delete one transaction |
| GET    | `/api/analysis/dashboard` | Core totals, category breakdown, monthly spend, latest insight |
| DELETE | `/api/analysis/wipe`      | Clears all data — disabled when `NODE_ENV=production` |

## Deliberate scope limits

- **Single-user, no login.** There's no `userId` on a transaction and no
  auth middleware. Adding multi-user support would mean a `userId` field
  on the schema, auth middleware, and scoping every query to the logged-in
  user — not implemented here on purpose.
- **No forecasting, budgeting, or "financial advice" features.** The
  scope is deliberately just: extract → categorize → validate → show
  analytics. Everything past that was cut.

## Running locally

```bash
npm install
cp .env.example .env   # fill in MONGO_URI and GEMINI_API_KEY
npm run dev
npm test                # runs the unit tests (node's built-in test runner,
                         # no extra dependency)
```

## CSV format support

The CSV parser recognizes common column header variants (`date`,
`narration`/`description`, `amount`, or separate `debit`/`credit`
columns) but isn't a universal bank-format parser — a CSV with unusual
headers returns a clear 400 error rather than silently guessing.
