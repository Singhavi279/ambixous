# Invoxa — invoicing simple enough for anyone

Create invoices, **email them from the app**, and **bill repeat customers automatically on a fixed date**.

## Run it locally
```
npm install     # first time only
npm start       # http://localhost:3100, data in data/invoicing.db
npm test
```

## Hosting (all free tiers)
Invoxa lives inside the ambixous.in repository and is served at **https://ambixous.in/invoxa**.
- **Vercel** (the Ambixous project): the UI in `invoxa/public` is copied to `public/invoxa` at build; the API runs from `app/invoxa/api/[[...path]]/route.ts`, which starts this Express app.
- **Turso** is the database (`INVOXA_DATABASE_URL`, `INVOXA_AUTH_TOKEN`). Without them the app uses the local file above.
- **GitHub Actions** (`.github/workflows/invoxa-cron.yml` at the repo root) calls `/invoxa/api/cron/tick` every hour with `CRON_SECRET`. That creates due repeat invoices and sends payment reminders, and catches up anything missed.
- Run the tests from the repo root with `npm run test:invoxa`.

## Users & roles
Sign-in is **Google only**, exactly like ambixous.in. Only people already on the team can get in; a random Google account is refused.
- **Super admin** — can do everything, including managing the team. The emails in `SUPER_ADMIN_EMAILS` are permanent super admins; their access can't be reduced from inside the app.
- **CA** — sees only **Reports** and can download the invoice/payment CSVs.
Add people under **Settings → Team** with their Google email.

### Google sign-in setup
1. Google Cloud Console → your OAuth client → **Authorized redirect URIs**, add
   `https://ambixous.in/invoxa/api/auth/google/callback` (and `http://localhost:3100/api/auth/google/callback` to test locally).
2. The same `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` as the website are used (set in Vercel, or in `invoxa/.env` locally).

## First 5 minutes
1. **Settings → Business**: your name, address, how customers pay you.
2. **Settings → Email**: connect your mailbox (Gmail: `smtp.gmail.com`, port 587, an *App Password*). Press *Send test email*.
3. **Customers → New customer**.
4. **+ New invoice** → pick customer → add what you're charging → **Create & email invoice**.
5. Money arrives? Open the invoice → **Record payment**.

## Repeat billing (automation)
**Repeat billing → Set up**: customer, amount, *every month / 3 / 6 / 12 months*, *on the 30th* (or "last day"),
and whether to email automatically. The app creates the next numbered invoice on that date, covers the right
service period (e.g. "October 2026"), emails it with the PDF, and stops at your end date. Short months use their last day.
Also: automatic polite reminders (3 days before due, on the due date, 7 days late), switchable in Settings → Email.

## What was kept from the PRD / what was simplified
Kept: auto invoice numbers per financial year (`AI/26-27/001`, never reused, voiding keeps the number), due-date from payment
terms, GST **off** by default with the "not registered" note and no "Tax Invoice" label, multi-line invoices, service period,
partial payments, overdue tracking, recurring invoices, audit log, CA-friendly CSV exports, atomic (all-or-nothing) saves,
issued invoices can never be deleted or edited (void instead).
Simplified on purpose: no accounting jargon (ledger, journals, chart of accounts), no partner accounting, quotations,
credit notes, e-invoicing or bank sync. GST, when switched on, is one flat rate — have your CA confirm before using it.
"Type of work" on a service (Advertising / Consulting / Events…) powers the *by type of work* report.

## Tech
Node 20 · Express · SQLite (better-sqlite3) · PDFKit · Nodemailer · plain JS front-end (no build step). `npm test` runs the checks.
Structure: `server/lib.js` (all money/date/numbering logic), `server/scheduler.js` (recurring + reminders), `server/mail.js`, `server/pdf.js`.
