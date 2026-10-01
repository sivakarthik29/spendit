# SpendIt — Frontend

Two views, nothing more: **Dashboard** (upload a statement, review what was
extracted, see analytics) and **Transactions** (browse, edit, delete).
Plain React + Vite, no TypeScript, no CSS framework — just `index.css`.

## Structure

```
src/
  api.js                      one small fetch wrapper — every backend call goes through this
  App.jsx                     tab switching + the cold-start "waking up" screen
  components/
    Nav.jsx                   top bar, Dashboard/Transactions tabs
    Dashboard.jsx             ties the upload flow + charts + insight together
    UploadCard.jsx            file picker, calls POST /api/ingest/upload
    PreviewTable.jsx          editable preview of extracted (unsaved) transactions
    MetricCards.jsx           total credit / debit / net
    CategoryChart.jsx         pie chart, spending by category
    MonthlyChart.jsx          stacked bar chart, spending by month and category
    InsightCard.jsx           the descriptive AI summary
    TransactionsView.jsx      paginated list with inline edit/delete
```

## Why it's built this way

- **The upload → preview → confirm split lives entirely in the UI state.**
  `UploadCard` calls `/ingest/upload` and hands the result to `Dashboard`,
  which renders `PreviewTable` instead of saving anything. Nothing is
  persisted until the user clicks "Save" in `PreviewTable`, which is what
  actually calls `/transactions/confirm`. The server never sees a
  half-reviewed statement.
- **Charts don't trust their data to be non-empty.** Both `CategoryChart`
  and `MonthlyChart` render a plain message instead of an empty chart if
  there's nothing to show yet — a blank/broken-looking chart on first
  load was a real risk otherwise.
- **The "waking up" screen in `App.jsx`** exists because Render's free
  tier spins the backend down when idle. The app pings the backend root
  route once on load and shows an honest message instead of letting the
  dashboard's first fetch silently hang or fail. This matters more than
  it looks like it should — a recruiter opening a cold deployed link
  with no explanation just looks broken.
- **No state management library.** Each view fetches what it needs with
  `useState`/`useEffect`. Two views and a handful of components is well
  under the size where Redux/Zustand/Context would pay for itself —
  reaching for one here would be a harder thing to defend than not
  having it.

## Known limitations (same honesty as the backend)

- No optimistic UI — an edit or delete waits for the server's response
  before updating the screen. Slightly slower-feeling, much simpler to
  reason about and debug.
- No client-side form validation beyond `type="number"` / `type="date"`
  on inputs — the backend re-validates everything anyway (see its
  README), so duplicating that logic here would be validating the same
  thing twice for no real benefit.
- The category list is hardcoded in two places (`PreviewTable.jsx` and
  `TransactionsView.jsx`) rather than fetched from the backend. For a
  fixed, rarely-changing list of 10 categories, an API round-trip to
  fetch "what are the valid categories" would be more machinery than
  the problem calls for.

## Running locally

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your local or deployed backend
npm run dev
```

## Deploying

Vercel builds this with `npm run build` and serves `dist/`. Set
`VITE_API_URL` as an environment variable in the Vercel project settings
(not just locally in `.env` — Vercel never reads that file) to your
Render backend's URL, including `/api`, e.g.
`https://your-backend.onrender.com/api`.
