# Test Automation Summary — Borocean (all features)

Date: 2026-10-09 · Workflow: `bmad-qa-generate-e2e-tests` · Scope chosen by the user: everything.

## Framework

- **API:** pytest (existing). The suite had 381 tests; 16 were added, giving **397 passing**. `ruff check` is clean.
- **Web E2E:** the project had no web test framework. **`@playwright/test` 1.63.0** was added to `apps/web` devDependencies; it matches the playwright-core version already used for manual checks.

## Generated tests

### API — `apps/api/app/tests/test_endpoint_gaps.py` (16 tests)

The endpoint inventory showed two gaps. Every other endpoint already had status-code tests.

- [x] `/symbols/ai-report/{fundamental,technical,combined}`
  - 200 with report.
  - `AIReportUnavailableError` becomes a warning.
  - `psycopg` error becomes a generic warning.
  - combined: 403 for free users and 401 when unauthenticated (previously untested).
- [x] `/insights/symbol` (previously untested)
  - symbol and exchange normalization, unread count.
  - AI note hidden without AI access.
  - 503 on a DB error, 401 when unauthenticated.
- [x] `/insights`: 503 on a DB error.

### E2E — `apps/web/e2e/` (46 tests: 45 pass, 1 `fixme`)

| File | Covers |
|---|---|
| `public/landing-seo.spec.ts` | Landing h1, feature list, sign-up link. Title, description, canonical, og:image, WebApplication JSON-LD. robots.txt, sitemap.xml, favicon/icon/apple-icon/og image served |
| `public/legal.spec.ts` | /terms, /kvkk, /privacy are public and readable |
| `public/auth.spec.ts` | Login with an unknown address shows "kayıt bulunamadı" and links to sign-up. Login links. Sign-up blocks without consent. Consent links. Short username rejected. Forgot password shows the neutral confirmation. /reset-password without a session asks for a new link. 9 signed-in routes redirect to /login |
| `account.setup.ts` | Signs up a disposable `borocean-e2e-<ts>@mailinator.com` user through the UI (dev has auto-confirm) and checks the greeting shows the username |
| `signed-in/dashboard.spec.ts` | Greeting uses the username, not the email. The quick-access menu has all 8 links and sits above search. Search opens the stock page. Insights panel hidden without positions. Only the latest bulletin is shown, with a "Tüm bültenler" link to /bulletins |
| `signed-in/stock.spec.ts` | Price and 4 tabs, each tab's content. Add to a new watchlist from the stock page. Create a price alert, then list and delete it on /alerts. Create a signal alert, then list and delete it on /signal-alerts. Personal note: save, reload, delete. Simulated buy from the stock page |
| `signed-in/lists.spec.ts` | Watchlist create and delete. Portfolio: create, add a transaction via **symbol autocomplete** (AAPL picked from suggestions), delete the position, delete the portfolio. Simulation: create with a budget, place a market order, delete |
| `signed-in/research.spec.ts` | Compare AAPL and MSFT. Run the default screener, then save and delete the screen |
| `signed-in/settings.spec.ts` | Changing the username updates the greeting (then restores it). Invalid username rejected. Plan, notifications and legal links shown. Delete button disabled until "SİL" is typed |
| `account.teardown.ts` | Wrong password shows "Şifre hatalı.". Then **Settings → Hesabı sil**, and logging in again shows "kayıt bulunamadı", which confirms the account is gone |

## How to run

```bash
cd apps/api && .venv/bin/pytest -q && .venv/bin/ruff check .
cd apps/web && pnpm build && pnpm test:e2e     # starts next start :3000 + uvicorn :8000 if not running
pnpm test:e2e --project=public                 # no account needed
```

Safety: `playwright.config.ts` refuses to run when `.env.local` points at the prod Supabase project (`ztchiibpegvmtdafyhxa`) or when `E2E_BASE_URL` is borocean.com. Runs use one worker, because the signed-in specs share one disposable account. Output (`test-results/`, `playwright-report/`, `e2e/.auth/`) is gitignored.

## Results (dev Supabase, local servers)

- API: **397 passed**.
- E2E: **45 passed, 1 skipped (fixme, known bug below)**, about 6 minutes in total.
- Every run's test account was deleted by the teardown, and the deletion was verified (`POST /auth/account-exists` returned `false` for the last account).
- Web `pnpm lint` and `pnpm typecheck` are clean.

## Bugs found

1. **Blocking DB calls on the API event loop.** Endpoints affected: `apps/api/app/main.py:460` (`/bulletins`), `:1235` (`/insights`), `:1115` (`/highlights`) and other `async def` handlers.
   - **Cause:** these async handlers call synchronous psycopg functions. `app/db.py:10` opens a **new connection per call** with no pool, and that connection takes about 2.3 s against the dev pooler. Each call blocks uvicorn's single event loop.
   - **Scenario:** the user opens /dashboard and types "AAPL" into search right away.
   - **Result:** `/symbols/search` queues behind the panel requests, and search stays on "Aranıyor..." for 45 s or more. The first run also showed "ABD hisse sonuçları şu an getirilemiyor". Once the panels finish loading, search answers in about 0.5 s.
   - **Test:** captured as `test.fixme` in `e2e/signed-in/dashboard.spec.ts`.
   - **Prod impact:** likely smaller (lower DB latency on Render), but the pattern still serializes requests.
   - **Fix direction:** run the sync DB work in a threadpool (plain `def` handlers or `run_in_threadpool`), or use a connection pool.

## Notes / choices

- The signal-alert list and the screener re-fetch market data on load. The tests give them 60 s and 180 s; the screener's default run took about 1–2 minutes on dev.
- The tests wait for each page's client data load before submitting. Submitting before hydration triggers a native form reload, which is a test-timing issue, not a product bug.
- Not covered: the real email flows (confirmation and reset links). Dev auto-confirms, and prod was verified manually on 2026-10-09. OAuth buttons aren't covered because providers aren't enabled. AI report generation isn't covered because it makes paid Gemini calls; only the "Kural Bazlı Metrik Puanı" section is checked.
- The summary lives at this path at the parent's request (the skill default is `test-summary-<slug>/`).
