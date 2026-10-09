---
type: architecture-review
lens: rubric-walker
target: docs/initiative-borocean/architecture-borocean/architecture-borocean.md
reviewed: 2026-10-09
verdict: revise-before-ratify
---

# Rubric review — Architecture Spine Borocean

**Verdict:** The spine is a good skeleton. It covers paradigm, layers, dependency direction, deploy topology, environments, and AD-1…AD-16 with Binds/Prevents/Rule. But it does not yet ratify the code. Five Rules make claims the code contradicts (AD-1, AD-5, AD-6, AD-11, AD-14). Two cross-cutting divergence points are not bound anywhere: the provider rate budget and DB access from async code. The one open epic (Crypto, Epic 11) has 3–4 divergence points the spine leaves to chance. Revise before marking it `ratified`.

Severity scale: **High** = a unit following the spine as written will diverge, or the spine records something false. **Medium** = a gap the next epic will hit. **Low** = wording or completeness.

---

## 1. Ratifies vs contradicts the code (spot-checks)

| Claim | Code evidence | Result |
| --- | --- | --- |
| AD-3 ownership by `user_id` filter | `portfolios.py:120,150,219` (child `positions` ownership via join to `portfolios.user_id`); `alerts.py:81` | ✅ holds (but see F7 wording) |
| AD-3 RLS on, no policies | every `create table` in migrations 0001–0013 has `enable row level security`; no `create policy` | ✅ |
| AD-15 cascade deletes | all top-level user tables `references auth.users(id) on delete cascade`; children cascade via parent; `account.delete_account` deletes `auth.users` | ✅ (wording gap, F7) |
| AD-8 cron secret | `main.py:1210` `_check_cron_secret`: 503 if unset, `hmac.compare_digest`; `/internal/insights/run`, `/internal/alerts/run?kind=` | ✅ (query param shape not in Conventions) |
| AD-10 JWKS | `auth.py:17` JWKS URL, RS256/ES256, `aud=authenticated` | ✅ |
| AD-4 clients never call providers | no finnhub/twelvedata/gemini/expo/resend refs in apps/web/src, apps/mobile, packages/shared | ✅ |
| AD-14 notifications via notifications.py | alerts/signal_alerts → `notify_trigger`; insight_runner → `notifications.send_expo_push` | ✅ channel; ❌ dedupe mechanism wording (F5) |
| **AD-5 market_data sole provider caller** | `fundamentals.py:8-9,111-171,304` and `insight_sources.py:20,52` call `finnhub.io` directly with their own `httpx` clients | ❌ **contradicted** (F1) |
| **AD-5 rate limiting** | only Twelve Data has a throttle (`market_data.py:37-58`). **No Finnhub limiter anywhere.** `screener.py` (118-symbol universe, `MAX_CONCURRENT_REQUESTS=15`), `highlights.py` (15 concurrent, quote+profile per symbol), and `bulletins.py` (10 concurrent) fan out to Finnhub with no shared budget | ❌ (F1) |
| **AD-6 "fetched on request, kept in an in-process cache"** | `market_data.get_us_candles` has **no cache**. Every call goes to Twelve Data through the throttle. The only in-process cache is screener fundamentals (`screener.py:26`, 30 min) | ❌ **false claim** (F3) |
| **AD-1 "only the owning module writes SQL for its tables"** | `insights.py:247` (`portfolio_universe`) and `insights.py:339-362` (`push_recipients`) read `positions`, `portfolios`, `user_notification_settings`, `auth.users` with their own SQL. By contrast, `entitlements.py` goes through `list_portfolios`/`list_watchlists`/`list_simulations`, which follows the rule | ❌ partial (F6) |
| **AD-11 "stored AI output is tagged with PROMPT_VERSION"** | `ai_reports` (`ai_reports.py:149,168`) and `symbol_insights.prompt_version` are tagged. `sector_bulletins` has no version column; it uses `_is_legacy_row` (`bulletins.py:222`) | ❌ partial (F8) |
| AD-8 "binds bulletins" | bulletins are generated lazily on `GET /bulletins` (`main.py:460` → `get_or_create_todays_bulletin`). There is no `setup_bulletins_cron.sql` and no single-flight, so concurrent first loads can call Gemini twice | ❌ Binds wrong (F8) |
| AD-12 "reused for the same key, version, and day" | `ai_reports` is keyed by (symbol, exchange, type) with a TTL in hours, not by day | Low wording |
| BIST flag | there are two flags: `market_data.BIST_ENABLED` and `packages/shared/src/exchanges.ts BIST_ENABLED` ("flip both together") | ⚠ not stated in the spine (F10) |

## 2. Findings

### F1 — High — AD-5: the "single gate" is not one, and Finnhub has no rate budget
**Problem.** The Rule says only `market_data.py` calls Finnhub/Twelve Data. In the code, `fundamentals.py` and `insight_sources.py` are Finnhub callers too. The Prevents line covers only Twelve Data's 8/min quota. Nothing limits Finnhub. The screener (118 symbols × metric), highlights (118 × quote+profile) and bulletins fan out concurrently with no shared limit. Finnhub's free plan is 60/min with a 30/s burst, so a cold screener run alone can exceed it and come back as 429 → "data unavailable" for every user. Crypto (FR-120, Done-when 2: "crypto calls must not consume the stock quota") needs exactly this budget concept, and the spine has none.
**Fix.** Amend AD-5:
- Rule: "Every outbound market-data HTTP call (Finnhub, Twelve Data, any future crypto provider) goes through `app/market_data.py` or a `market_data_<provider>.py` adapter it owns. Each provider has one process-wide rate limiter (token bucket) sized to its plan, and every call acquires it. Background runners take a lower-priority lane or a reserved share, so interactive requests are not starved."
- Ratify the current state honestly. Either list `fundamentals.py`/`insight_sources.py` as known violations with a migration story, or redefine the gate as "provider adapters (`market_data.py`, `fundamentals.py`, `insight_sources.py`) that share `market_data`'s limiter".
- Add Finnhub's plan limit to Prevents.

### F2 — High — Unbound dimension: DB access model (sync psycopg in async code, a new connection per query)
**Problem.** `db.get_connection()` opens a fresh `psycopg.connect` (synchronous) per call. Many `async def` endpoints call it directly on the event loop: `get_alerts`, `get_portfolios`, `post_order`, `get_simulations`, `get_simulation_history`, `get_bulletins_endpoint`, `get_portfolio_insights`. The AD-8 background runners (`insight_runner`, `alert_runner`) also run as `asyncio` tasks in the same loop and call sync DB functions. During a morning scan or a 15-minute price-alert run, every DB round-trip blocks all requests. Connection-per-query also costs a TLS handshake each time and can exhaust Supabase's connection limit if the URL is the direct connection rather than the pooler. Every epic touches this. AD-8 makes it worse by putting background work in the request process. The spine is silent on it: not decided, not deferred, not an open question.
**Fix.** Add an AD-17, "Veritabanı erişimi" (database access). Rule: "Sync DB helpers are only called from `def` endpoints (FastAPI threadpool) or via `await asyncio.to_thread(...)` / `run_in_threadpool` from async code. Background runners must do the same. One process-wide `psycopg_pool.ConnectionPool` (or `AsyncConnectionPool`) is opened at startup; `SUPABASE_DB_URL` points at the Supavisor pooler." If the user won't fix it now, add a Deferred entry with a concrete trigger (p95 latency during cron windows, or the first `too many connections`). For new code, the threadpool/`to_thread` rule should be adopted immediately anyway, because it costs nothing.

### F3 — High — AD-6 (RETIRED) records a cache that does not exist
**Problem.** "Fetched from the provider on request and kept in an in-process cache" is false for candles. `get_us_candles` is uncached, so every chart open, signal check, score, comparison and screener technical filter spends one of the 8 Twelve Data calls per minute. Combined with the throttle design (one `asyncio.Lock` held during `sleep`, `market_data.py:46-58`), a background scan or a screener RSI filter can make an interactive chart wait up to about a minute. The Deferred trigger ("reopen when quota/latency hurts") rests on a false premise.
**Fix.** Correct AD-6's text to "candles are not stored and not cached; every request hits Twelve Data through the throttle". Either add a Convention ("candle reads go through a `market_data` TTL cache keyed by symbol+exchange+timeframe") or state explicitly that no cache exists and move the trigger forward: Crypto will hit it first.

### F4 — High — Epic 11 (Crypto, the only open epic) has divergence points the spine leaves open
The spine binds Crypto under AD-5/11/14/16 but fixes none of the choices that 11.3–11.6 (described in the epic as "four independent lanes") would each make differently:
1. **Symbol format.** `symbol + exchange='CRYPTO'` does not say whether it is `BTC`, `BTC/USD` or `BTCUSD`, or what the quote currency is. Watchlist, alerts, portfolio and simulation will each pick one. → Convention: canonical crypto symbol = base ticker, quote fixed to USD, provider mapping only inside the adapter.
2. **Schema.** Every table has `check (exchange in ('US','BIST'))` (0001, 0002, 0003, 0006, 0007, 0011). → Bind one migration that widens all of them, owned by 11.1, so each lane doesn't write its own.
3. **Market-hours assumptions.** `alerts.py:115`, `signal_alerts.py:119`, `insights.py:247` and `insight_runner.EXCHANGE` hard-code `exchange = 'US'`. The price-alert cron is `*/15 13-21 * * 1-5`, but FR-122 wants 24/7. → AD-8 needs "one schedule per asset class; runners take the exchange as a parameter".
4. **Capability per asset class.** FR-121/FR-126 hide fundamentals/score/AI for crypto. Without a shared capability map (e.g. in `@borocean/shared/exchanges`), web and mobile will hide different sections. → Add it to AD-2/AD-16.
5. Quantity is already `numeric` in the DB and `float` in the API, so fractional amounts are fine. Say so, so nobody "fixes" it.

### F5 — Medium — AD-14: the dedupe Rule names one mechanism, the code uses two, and the delivery guarantee is unstated
**Problem.** The Rule says a notification goes only from the call that wins `UPDATE … WHERE status='active'`. Insight pushes instead claim with `insight_push_log` (`log_push` insert, `insight_runner.py:255-256`). Both mechanisms claim before sending, so a failed Expo/Resend send is lost (at-most-once). That is a real product decision the spine should state.
**Fix.** Rule: "Before any send, the caller commits an atomic claim (a conditional UPDATE, or INSERT … ON CONFLICT DO NOTHING on a log table). Only the winner sends. Delivery is at-most-once and there is no retry." Also state that page-load evaluation (`GET /alerts` → `evaluate_and_persist`) and the cron runner are both legitimate triggers.

### F6 — Medium — AD-1: the Rule is stricter than the code it ratifies
**Problem.** `insights.py` reads `positions`/`portfolios`/`user_notification_settings` directly. The Prevents line talks about *writing*, while the Rule talks about *SQL ownership* in general, so it is unclear whether reads count.
**Fix.** Choose one. Either (a) "writes are owner-only; read-only cross-context joins are allowed in runners and must be listed in the module docstring", which ratifies the code, or (b) keep the strict rule and open a story to move `push_recipients`/`portfolio_universe` behind `portfolios`/`notifications` functions.

### F7 — Medium — AD-3/AD-15: the wording fails for child tables
`positions`, `watchlist_items`, `simulation_positions` and `simulation_snapshots` have no `user_id`. They cascade through their parent, and their ownership is checked by a join (`portfolios.py:219`). A literal reading of the Rules ("every user table has `user_id … on delete cascade`", "every query filters by `user_id`") would make the next child table either duplicate `user_id` or fail review. → "…or references a parent that does, with `on delete cascade`. Child-row queries prove ownership by joining to the parent's `user_id`."

### F8 — Medium — AD-8/AD-11/AD-12: bulletins are mis-bound
Bulletins are generated on page load with no single-flight and no `PROMPT_VERSION`. → Either remove bulletins from AD-8's Binds and add "lazy daily generation needs a single-flight guard" to AD-12, or schedule bulletins through pg_cron. Add `prompt_version` to `sector_bulletins` (or relax AD-11 to name the tables it covers).

### F9 — Medium — Operations: three unbound points
1. **Deploy order.** Render deploys automatically on push to `main`; prod migrations are run by hand. The spine does not say "the prod migration is applied *before* merging code that needs it", so a merge can ship code against a missing column. Also, the `GH Actions -.-> Render` edge doesn't say whether CI gates the Render deploy. → Add a release-flow rule and state whether CI is a gate.
2. **Client/API skew.** The web is deployed by hand (`vercel --prod`) and the API automatically, so a response-shape change (AD-2) reaches production before the web catches up. → Convention: "API response changes are additive until both clients have shipped."
3. **Secrets and backups.** `CRON_SECRET` lives in both Render env and Vault (`insights_cron_secret`, which `setup_alerts_cron.sql` reuses) and must match. Rotation means changing both. The cron SQL also hard-codes `trendus-api.onrender.com`. Backup/restore (Supabase plan, PITR) is not decided or deferred. UptimeRobot is load-bearing: it keeps the free Render instance warm, otherwise a pg_net call (60 s timeout) can hit a cold start. → Record each of these as decided or Deferred.

### F10 — Low — Other gaps
- **No Open Questions section.** The memlog has questions, and so does the Crypto epic (provider/cost, legal review, AI for crypto). The rubric requires every dimension to be decided, deferred, or open. → Add the section.
- **BIST flag duplication** (API + shared) should appear in AD-5: "flip both in the same change", or the API should expose it and clients read it (as AD-7 does for entitlements).
- **Stack.** The table matches the manifests for every listed row. Not listed, but they diverge: mobile uses `typescript ~6.0.3` and `react 19.2.3`, while shared uses TS 5.9.3 and web uses `^5` and React 19.2.8. That is a cross-package TS major split over the shared source. Also unlisted: uvicorn 0.53.0, httpx 0.28.1, psycopg_pool (absent). Render's Python version is not pinned (`requires-python >=3.11`, no `.python-version`) while CI runs 3.13. Versions were checked against the manifests only, not against upstream "latest".
- AD-8: the fallback trigger from `GET /insights` (`main.py:1245`) is a second, non-cron entry point. Mention it. Single-flight is per process, so a Render zero-downtime deploy overlap can run two jobs; idempotency covers it, but say so.
- Conventions: internal job routes take the `kind` query parameter (`/internal/alerts/run?kind=`), not only `/internal/<iş>/run`.

## 3. Rubric scorecard

| Criterion | Score | Note |
| --- | --- | --- |
| Fixes the real divergence points for the epics below; misses none | ⚠ Partial | Closed epics are fine. Crypto has 4 unbound points (F4). DB access and the rate budget are unbound (F1, F2). |
| Every Rule is enforceable and prevents its divergence | ⚠ Partial | AD-5 doesn't prevent the Finnhub overrun. AD-14/AD-1/AD-15 wording doesn't match the mechanisms in use. |
| Nothing under Deferred could let two units diverge | ⚠ | "Hata kodu standardı" (error-code standard) is OK. "Çoklu örnek" (multiple instances) is OK. AD-6's deferral rests on a false cache claim (F3). |
| Named tech verified-current | ✅ / ⚠ | Listed rows match the manifests. The mobile TS 6 split and the unpinned Render Python are not recorded. |
| Ratifies, does not contradict the code | ❌ | AD-5, AD-6, AD-1, AD-11, AD-14, AD-8 Binds (§1). |
| Every owned dimension decided / deferred / open | ⚠ | DB access model, deploy ordering, backups, secret rotation, API-compat window: missing. No Open Questions section. |

## 4. Answer to the separate code-review items

- **(a) No Finnhub rate limiter.** The spine *should bind* this, because it is a shared-resource rule and exactly what an initiative-altitude AD is for. Fold it into AD-5 (F1). Deferring is not appropriate: the overrun already happens at current traffic on cold screener/highlights runs, and Epic 11's Done-when depends on quota isolation.
- **(b) Sync psycopg in async endpoints, connection per query.** The spine *should bind* the call-site rule now (threadpool / `to_thread`, which costs nothing and stops new code adding to the problem). The pool and the pooler URL can be bound now or put under Deferred with a measurable trigger. Leaving it unmentioned is the one option that fails the rubric (F2).
