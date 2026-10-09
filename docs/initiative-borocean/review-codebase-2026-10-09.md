---
type: code-review
title: Borocean — full-codebase code review
date: 2026-10-09
reviewer: Amelia (bmad-code-review, thorough)
scope: apps/api, apps/web, apps/mobile, packages/shared, apps/api/migrations, apps/api/scripts
review_mode: no-plan
---

# Full-codebase code review — 2026-10-09

**Scope.** All application code: `apps/api` (FastAPI, migrations 0001–0013, cron SQL), `apps/web`
(Next.js 16), `apps/mobile` (Expo), `packages/shared`. `.agents/`, `_bmad/`, `node_modules` and
generated files were excluded.

**How this ran.** `bmad-code-review` is built around a diff and parallel reviewer subagents.
Neither fit here: the target is the whole tree rather than a change, and this run had no
subagents. So I ran the three thorough lenses myself, file group by file group:
- Blind Hunter: what's missing or wrong.
- Edge Case Hunter: unhandled branches and boundaries.
- Verification Gap: what the tests wouldn't catch.

Triage then followed step 3 of the skill. Each claim was checked against the code, including
callers and guards, and rated `high`, `medium`, `low` or rejected. There is no plan file, so
nothing was routed to `decision_needed`. Ambiguous items are under **defer**, and nothing was
patched. Baseline: `pytest` reports 397 passed. CI runs only lint, typecheck and build for
web/mobile.

**Verdict key.**
- **CONFIRMED:** the bad outcome is shown from the code.
- **PLAUSIBLE:** the mechanism is confirmed, but how much it hurts depends on traffic or data.

> **Code review complete.** 0 `decision-needed`, 10 `patch`, 4 `defer`, 7 rejected.
> By severity, over the 10 patch items: **2 high, 4 medium, 4 low**. The 4 deferred items were
> graded 3 medium and 1 low; they are not counted in that split.

---

## Patch: high

### H1. Signal alerts fire on old signals, not new ones (CONFIRMED)
- **Where:** `apps/api/app/signal_alerts.py:195-206`, with `apps/api/app/technical.py:256-417`.
- **What's wrong:** `evaluate_signals()` returns up to `MAX_SIGNALS = 20` crossings from the
  whole candle history: 260 daily bars, about a year. `evaluate_and_persist` triggers when *any*
  of them has the alert's `rule_id`. It never compares `match.triggered_at` with the alert's
  `created_at`.
- **Failure scenario:** a user creates an "RSI 30 altına düştü" alert on a stock whose RSI
  dipped below 30 four months ago. The next page load, or the 05:15 UTC cron since Story 14.2,
  marks the alert triggered. `triggered_at` is set to four months ago. A push and an email
  ("…sinyali tetiklendi") go out immediately. The alert never waits for a *new* signal.
- **Evidence it was missed:** `docs/stories/story-5.3.md:67` records this as success ("kural
  gerçekten `triggered` oldu, gerçek bir geçmiş tarihte"). No test covers a signal older than
  the alert.
- **Fix:** only match signals with
  `match.triggered_at >= alert.created_at.timestamp()`. A stricter option is to require the
  candle to come after creation. Add a test where the only matching signal predates
  `created_at` and the alert stays active.

### H2. Nothing limits the Finnhub request rate; fan-outs exceed the free tier and failures are dropped silently (CONFIRMED mechanism, PLAUSIBLE magnitude)
- **Where:**
  - `apps/api/app/market_data.py:200-219`: each `get_us_overview` makes 2 calls (quote and
    profile).
  - `apps/api/app/highlights.py:41-51`: every dashboard load, uncached.
  - `apps/api/app/screener.py:155-163`: `MAX_CONCURRENT_REQUESTS = 15` over the 118-symbol
    universe.
  - `apps/api/app/bulletins.py:98-111`: 12–20 fundamentals calls per generation.
  - `apps/api/app/alert_runner.py:25-36`.
- **What's wrong:** Twelve Data has a process-wide throttle (`market_data.py:41-59`). Finnhub
  has none, even though the alert-runner docstring says "Finnhub (60/min)". Each caller turns a
  429 into "unavailable" and drops the symbol without telling the user:
  - highlights: `return None`;
  - the screener: the symbol is not cached and simply disappears from the results, with no
    warning;
  - alerts: `unavailable` for that run.
- **Failure scenario:** a user picks Technology, Financial Services and Healthcare as interests,
  which is 50 symbols. Each dashboard load fires 100 Finnhub calls in seconds. Past the first
  ~60 they get 429s, so the highlights come back incomplete. For the rest of that minute every
  other user's quotes fail as well: stock pages, portfolio valuation, and a price-alert cron
  tick that happens to land in that minute. A cold screener run (118 `/stock/metric` calls)
  does the same, and returns an incomplete result list with no warning.
- **Fix:** add a process-wide Finnhub token bucket next to `_throttle_twelvedata`. Add a short
  TTL quote cache, for example 60 s keyed by symbol, used by overview, highlights, portfolio,
  simulations and alerts. For alerts, consider a quote-only fetch (skip `profile2`). Show a
  warning when the screener or highlights dropped symbols because of provider errors.

---

## Patch: medium

### M1. `/auth/confirm` is an unused, reachable route with an open redirect and a login-CSRF (CONFIRMED)
- **Where:** `apps/web/src/app/auth/confirm/route.ts:10,15-17`.
- **What's wrong:** `next` comes from the query string unchecked and goes to `redirect(next)`.
  Every email flow now uses `/auth/oauth` (see `docs/email-templates/README.md`), and nothing
  links to `/auth/confirm`. It is leftover starter code.
- **Failure scenario:** an attacker signs up with their own address and takes the unused
  `token_hash` from their confirmation email. They send the victim
  `https://borocean.com/auth/confirm?token_hash=…&type=signup&next=https://evil.example`.
  `verifyOtp` succeeds, so the victim's browser is now logged into the attacker's account. The
  route then redirects to the attacker's site (protocol-relative `//evil.example` works too).
- **Fix:** delete the route. If it has to stay, apply the same `startsWith("/") &&
  !startsWith("//")` guard that `/auth/oauth` should also use (see L4).

### M2. Simulation history returns the oldest 90 days, not the newest (CONFIRMED)
- **Where:** `apps/api/app/simulations.py:360-373`.
- **What's wrong:** `ORDER BY snapshot_date ASC LIMIT 90` keeps the first 90 rows.
- **Failure scenario:** after a simulation has 90 or more daily snapshots, `get_history` saves
  today's row but returns days 1–90. The equity chart freezes at day 90 and never shows today.
- **Fix:** select the newest 90 (`ORDER BY snapshot_date DESC LIMIT %s`) and reverse them in
  Python, or use a subquery. Add a test with more than 90 snapshots.

### M3. Database access is synchronous on the event loop and opens a new connection per query (CONFIRMED)
- **Where:**
  - `apps/api/app/db.py:9-16`: `psycopg.connect` per call, no pool, `connect_timeout=5`.
  - It is called directly from `async def` endpoints, for example `main.py:622-634`
    (`/alerts`), `:902-909` (`/portfolios`), `:1012-1019`, `:1234-1260`.
  - It is also called from the background runners: `insight_runner.py:284-335` and
    `alert_runner.py`.
- **What's wrong:** FastAPI runs `async def` handlers on the event loop. A blocking connect and
  query (a TLS handshake to the Supabase pooler on every call) stalls *every* in-flight request
  while it runs.
- **Failure scenario:** the morning insight scan makes ~4 DB round-trips per symbol for up to
  300 symbols, and each one freezes the single Render worker. A Supabase outage is worse: each
  call blocks the loop for up to 5 s, so even `/health` stops answering.
- **Fix:** use `psycopg_pool.AsyncConnectionPool` with async queries. The minimal alternative
  is wrapping DB calls in `await asyncio.to_thread(...)` and adding a sync pool.

### M4. A failed bulletin is regenerated on every `GET /bulletins` (CONFIRMED)
- **Where:** `apps/api/app/bulletins.py:219-236`, `apps/api/app/main.py:467-472`.
- **What's wrong:** when there is no row for today, every request runs the whole generation:
  12–20 Finnhub fundamentals calls, then Gemini with 3 attempts. Concurrent first requests all
  do it (the `ON CONFLICT DO NOTHING` only dedupes the insert). When generation fails, for
  example on Gemini quota (a risk already noted for Epic 13) or the H2 Finnhub 429s, nothing
  records the failure. Every dashboard load retries.
- **Failure scenario:** Gemini's daily quota runs out at 10:00. Every dashboard or `/bulletins`
  view for the rest of the day costs ~15 Finnhub calls and 3 Gemini calls, which makes H2 worse,
  and still shows "Bülten verisi şu an sağlanamıyor."
- **Fix:** keep a per-process lock or in-flight future for today's generation. Remember a
  failure for N minutes (process memory is enough), or generate from the morning cron instead
  of on read.

---

## Patch: low

### L1. Simulation and portfolio orders read and then write without row locks (CONFIRMED)
- **Where:** `apps/api/app/simulations.py:192-267`, `apps/api/app/portfolios.py:148-209`.
- **What's wrong:** two concurrent orders, for example from two tabs or web plus mobile, both
  read the same `cash_balance` and `quantity`. The last write wins, so cash is spent twice or a
  quantity update is lost. A concurrent first buy hits `UNIQUE (simulation_id, symbol,
  exchange)` and the user gets a 503. The buttons are disabled while busy
  (`simulate-buy-button.tsx:199`), so a single tab is protected.
- **Fix:** `SELECT … FOR UPDATE` on the simulation row and the position row inside the
  transaction.

### L2. Float subtraction decides "sold everything" (CONFIRMED)
- **Where:** `apps/api/app/portfolios.py:189-192`, `apps/api/app/simulations.py:242-247`.
- **What's wrong:** `numeric` values become `float`, and `remaining == 0` and `held < quantity`
  are compared exactly.
- **Failure scenario:**
  - Buy 0.1, then 0.2: the stored quantity is 0.30000000000000004. Selling 0.3 leaves a dust
    position of about 5e-17 shares that is never removed.
  - Buy 0.3, sell 0.1: the stored quantity is 0.19999999999999998. Selling the remaining 0.2
    fails with "cannot sell more than the current position quantity".
- **Fix:** do the arithmetic in `Decimal` or in SQL (`quantity - %s`), or compare with an
  epsilon and treat `remaining <= eps` as a full sale.

### L3. The account-exists rate limiter never forgets an address (CONFIRMED)
- **Where:** `apps/api/app/account.py:38,55`.
- **What's wrong:** `_checks_by_email.setdefault(email, deque())` adds a key for every distinct
  address and never removes it. Up to 120 new keys a minute (the global cap) is ~170k a day.
- **Failure scenario:** sustained enumeration grows memory steadily, by tens of MB a day, on
  the single 512 MB Render instance until the next deploy.
- **Fix:** drop a bucket once `_allow` has emptied it, or use a bounded TTL dict.

### L4. Signal-alert email and push in English show the raw rule id (CONFIRMED)
- **Where:** `apps/api/app/signal_alerts.py:136-138`.
- **What's wrong:** English users get "The 'macd_bullish_cross' signal fired…". `rule_name` is
  only available in Turkish (`technical.py:10-62`).
- **Fix:** add an English rule name to each `SIGNAL_RULE_CATALOG` entry and use it in the
  English message.
- **Related, minor:** `/auth/oauth` accepts `next="//evil.com"`. It is harmless today because
  the value is concatenated after `baseUrl`. Tighten it when fixing M1.

---

## Defer

### D1. Google/Apple sign-in creates accounts with no Terms/KVKK consent record (CONFIRMED; medium; blocks Story 14.4)
- **Where:** `apps/web/src/app/login/social-buttons.tsx:26-33`, `apps/web/src/app/auth/oauth/route.ts`.
- **What's wrong:** email sign-up stores `legal_accepted_at` and `legal_version`
  (`login/actions.ts:91-95`, `mobile/screens/AuthScreen.tsx:89-95`). The OAuth path has no
  consent step and sets neither field.
- **Why deferred:** OAuth providers are disabled in prod today, so the buttons are hidden
  (`lib/auth-providers.ts`).
- **What to do:** before 14.4 ships, add a post-OAuth consent gate, so that a first sign-in
  without `legal_version` lands on a consent screen. Mobile also has no OAuth path.

### D2. AI reports, bulletins and insight notes are always Turkish (CONFIRMED; medium; product decision)
- **Where:** prompts in `ai_fundamental.py:27-38`, `ai_technical.py`, `ai_combined.py`,
  `bulletins.py:56`, `insight_runner.py:71-88`. The global cache keys
  (`ai_reports (symbol, exchange, report_type)`) have no locale.
- **What's wrong:** English-UI users read Turkish AI text. Fixing it means either per-locale
  cache rows and prompts, or a decision that AI content is Turkish-only, stated in the English
  UI.

### D3. No automated tests for web, mobile or `packages/shared` (CONFIRMED; medium; verification gap)
- **Where:** `.github/workflows/ci.yml:20-23,36-38`. CI runs only lint, typecheck and build.
- **What's missing:** there are no `*.test.*` files under `packages/`, `apps/web/src` or
  `apps/mobile`. The client-side indicator library (`packages/shared/src/indicators/**`, about
  1,000 lines including `advanced/registry.ts`), the auth error mapping, display-name rules
  and the i18n key parity are untested. A regression in the web RSI/MACD drawing would ship.
- **Status:** the QA pass (task 15) is adding tests. Wire them into `ci.yml`.

### D4. Story 5.3's verification record describes H1 as success (low)
- **Where:** `docs/stories/story-5.3.md:58-67`.
- **What to do:** when H1 is fixed, amend AC2 to say "a signal that occurs after the alert was
  created". This is a docs/spec edit, so it is deferred and not patched here.

---

## Rejected

- **Invalid UUID path ids give 503 instead of 404**, in `watchlists`/`alerts`/… delete
  endpoints and `/insights/read`. `low`: already documented in `story-5.3.md:73`, the clients
  only send ids the API returned, and the fix adds guards in several modules.
- **`/notification-settings` GET/PUT don't map `psycopg.Error` to 503** (`main.py:719-735`).
  `low`: the user only sees it during a DB outage, and the fix adds a guard.
- **`ensure_disclaimer` substring check is case-sensitive** (`ai_reports.py:57`). `low`: the
  worst case is a duplicated disclaimer line, which is still compliant.
- **`getSiteOrigin` trusts `x-forwarded-host`** (`lib/site-origin.ts:6`). `false`: Vercel sets
  that header, and Supabase only allows `redirectTo` values on its own redirect allow-list.
- **`PUT /notes` doesn't strip `body.symbol`** (`main.py:1155`). `low`: both clients send
  normalized symbols.
- **Mobile chart drawings may save to the new symbol's key when the symbol changes**
  (`PriceChartWebView.tsx:322-349`). `maybe-false`, and it would only be `low`: AsyncStorage
  runs operations in order and the `getItem` is issued first. Settling it needs a device trace.
- **AI-generated text compliance.** No finding: every prompt carries `COMPLIANCE_RULES`, the
  disclaimer is enforced, and the UI copy has no directive buy/sell labels (`sideBuy` is an
  order button).

## Strengths noted (no action)

- Every user-owned table cascades from `auth.users`, so `DELETE /me` erases everything (KVKK).
- RLS is enabled fail-closed on all tables.
- The cron secret is compared with `hmac.compare_digest`.
- Alert notifications are deduped through `_mark_triggered … AND status='active'`.
- Insight runs are guarded with an advisory lock.
- The PKCE email flow handles the case where the link is opened in another browser.

## Deferred-work log

No plan file was given, and this run was told to write only this report under
`docs/initiative-borocean/`. So D1–D4 are not copied into a separate `deferred-work.md`. The
ticket tree (task 14) should turn H1–H2, M1–M4, L1–L4 and D1–D3 into backlog tickets.
