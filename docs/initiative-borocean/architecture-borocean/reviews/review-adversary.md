---
type: architecture-review
lens: adversary
target: docs/initiative-borocean/architecture-borocean/architecture-borocean.md
date: 2026-10-09
units_considered: [epic-crypto-market (11.1–11.8), epic-domain-infrastructure (14.3–14.5), epic-portfolio-insights 13.7, epic-codebase-review-fixes (15: H1, H2, M3, M4, L1, L2, L4, D2)]
---

# Adversary Review — Architecture Spine (Borocean)

## Verdict

The spine does not hold yet. At least eight pairs of open units can each follow every AD exactly and still ship things that don't fit together. The biggest gap is the asset identity. AD-5 says `symbol + exchange`, but nothing says *where exchange-based dispatch happens* or *what an in-memory key must contain*. Epic 11 is the first unit to add a third exchange, and it lands in code that branches on `BIST` and treats everything else as US. The second gap: AD-12 (cache key without locale) and AD-13 (AI text in the user's locale) contradict each other. The third: AD-5's "single gateway" is already false in the live code, so Epic 15/H2's Finnhub limiter would follow the AD and still miss half the Finnhub traffic.

Method: for each pair, I name two units, show that each one follows the letter of every AD it is bound by, and then show the clash in the real code (file:line). Every pair ends with the AD change that would close it.

---

## Pair 1 — Crypto price alerts are priced as a US stock with the same ticker

- **Unit A: Story 11.1 (crypto adapter).** Following AD-5, it adds `get_crypto_quote(symbol)` / `get_crypto_candles(...)` to `market_data.py` as a "new adapter". Compliant.
- **Unit B: Story 11.4 (crypto in watchlist/alerts/portfolio).** Following the Consistency Conventions ("`check (exchange in (...))`"), it widens the CHECK on `price_alerts`, `watchlist_items` and `positions` to `('US','BIST','CRYPTO')`. Compliant.
- **Clash (grounded):**
  - `apps/api/app/alerts.py:174-184`: `evaluate_and_persist` handles only `if alert.exchange == "BIST"` as a special case. **Every other exchange** goes through `get_us_overview(alert.symbol)`. A `CRYPTO/BTC` alert is priced with the quote for the NYSE Arca ETF `BTC` (Grayscale Bitcoin Mini Trust, about $40–50). "BTC below 70000" fires at once and sends a false push or email. "Above 50000" never fires. Neither unit touched this line, and AD-5 never asked them to.
  - The in-run caches are keyed by `symbol` only: `alerts.py:169-188` (`price_cache[alert.symbol]`), `portfolios.py:238-258`, `simulations.py:284-297`, `screener.py:26,65` (`_fundamentals_cache[symbol]`). Even after dispatch is fixed, a user who holds both `US/BTC` and `CRYPTO/BTC` gets the first price fetched for both.
  - `market_data.get_us_candles` sends `symbol` straight to Twelve Data (`market_data.py:278`). Crypto there is `BTC/USD`, so the symbol format is also exchange-specific, and only the adapter knows it.
  - Meanwhile the background runners filter `exchange = 'US'` (`alerts.py:115`, `signal_alerts.py:119`, `insights.py:247`). Crypto alerts are then evaluated **only on page load**, with the wrong price. That breaks FR-122's "7/24" and Epic 11 Done-when #3.
- **Why the spine allows it:** AD-5 decides who *calls* the provider. It says nothing about who *chooses the adapter*. "Asset = symbol + exchange" applies to the DB, but nothing extends it to in-memory keys.
- **Proposed AD fix: tighten AD-5:**
  > Exchange-based dispatch happens only inside `market_data.py`, through `get_quote(symbol, exchange)` / `get_candles(symbol, exchange, timeframe)`. Bounded-context modules don't branch on `exchange` to pick a provider function (`get_us_*` is private to `market_data`). Every cache, dedupe set or dictionary keyed by an asset uses the `(symbol, exchange)` tuple. An unknown exchange raises an error and never falls back to US.

## Pair 2 — Nobody owns the exchange enum, so three units each widen a different subset

- **Units:** 11.4 (watchlist/alert/portfolio), 11.5 (simulation), 11.6 (screener/compare), plus 11.3 / FR-122 (signal alerts, 7/24).
- **Each obeys:** the convention says only "`check (exchange in (...))`", and AD-3 says migrations are idempotent and applied by hand.
- **Clash (grounded):** the enum lives in **six separate CHECKs** (`0001_watchlists.sql:17`, `0002_price_alerts.sql:8`, `0003_signal_alerts.sql:8`, `0006_portfolios.sql:16`, `0007_personalization.sql:11`, `0011_simulations.sql:22`). It is also in **eleven hard-coded tuples** in `main.py` (`if exchange not in ("US", "BIST")`: 575, 642, 743, 868, 946, 1061, 1136, 1149, 1165…), in TS literal unions in mobile (`PortfolioScreen.tsx:336`, `SimulationScreen.tsx:331`, `ScreenerScreen.tsx:40`), and in **zero** CHECKs on `ai_reports`, `symbol_insights` and `symbol_scan_state`. The spine claims `packages/shared` holds the "borsa listesi". In fact `packages/shared/src/exchanges.ts` exports only `BIST_ENABLED`. No story owns `signal_alerts` (FR-122 sits under 11.3, while the table edits sit with 11.4) or `0007_personalization` (notes/highlights on crypto). The likely outcome: you can add a crypto watchlist item, but the signal alert on it fails with a 400 at `main.py` or a CHECK violation, depending on which story ran first. Two stories each writing `alter table … drop constraint <t>_exchange_check` also depend on Postgres's auto-generated constraint names, which nobody controls.
- **Proposed AD fix: new AD "Exchange registry":**
  > The single list of exchanges is `EXCHANGES` in `@borocean/shared/exchanges` (TS) and `market_data.EXCHANGES` (Py), and they change together. API inputs validate against it (one `Exchange` Literal/Enum type, no inline tuples). The DB uses one named domain or a named constraint (`exchange_valid`) on **every** table with an `exchange` column, global tables included. Adding an exchange is **one migration + one story** that widens all of them together. Feature stories may not widen a subset.

## Pair 3 — The AI cache key and the user's locale contradict each other (AD-12 vs AD-13)

- **Unit A: Epic 15 / D2 (English AI text).** Following AD-13 ("server-generated text: AI takes its language from `user_metadata.locale`"), it passes `locale` to the prompt.
- **Unit B: any AI unit following AD-12** (11.7 crypto AI, the 13.x note, the existing 9.x reports): "same key, version and day are reused".
- **Clash (grounded):** `ai_reports` has `unique (symbol, exchange, report_type)` (`0009_ai_reports.sql:13`). `save_report` uses `ON CONFLICT … DO UPDATE` (`ai_reports.py:160`). `symbol_insights` has `unique (symbol, exchange, insight_date)` with a single `note` column (`0013:37`). Today the prompts hard-code Turkish (`ai_fundamental.py:31`, `ai_combined.py:31`, `bulletins.py:59`, `insight_runner` notes), so AD-13 is already broken. If D2 follows AD-13 literally, the EN and TR outputs overwrite each other in the same row. Users then see the language flip back and forth, and Gemini calls double through cache thrash. The `symbol_insights` note can't hold two languages at all. Push text is already localized (`insight_text.py:92`), but the note it links to is not.
- **Proposed AD fix: tighten AD-12 and AD-13 together:**
  > A stored AI output's cache key is `(subject, type, locale, prompt_family_version)`. The locale is part of the key (a `locale` column + unique constraint), or the product explicitly decides "AI is Turkish only" and AD-13 lists AI as an exception. The cache-hit rule is spelled out (today it is a TTL in hours, `ai_fundamental.py:25`, `ai_combined.py:26`, not the "same day" the AD states).

## Pair 4 — One `PROMPT_VERSION` for every prompt family

- **Unit A: Story 11.7.** Following AD-11, it writes a new crypto prompt, and "a version change regenerates the output", so it bumps `PROMPT_VERSION`.
- **Unit B: Epic 9 / 13 stored outputs.**
- **Clash (grounded):** `PROMPT_VERSION = 2` is one global integer (`ai_reports.py:52`). Fundamental, technical and combined reports and the insights notes all use it (`insight_runner.py:26,239,318`). Bumping it for crypto expires **every** stock report at once (`ai_reports.py:149`). That is a Gemini spike on a quota that is already at risk. The reverse also breaks: a `COMPLIANCE_RULES` change that needs a global regeneration can be "versioned" in only one family. Insights notes never regenerate on a version bump (`insights_missing_note` selects only `note IS NULL`), and `sector_bulletins` are append-only by design (`0010` header). Both contradict AD-11's "eski çıktı yeniden üretilir" (stale output is regenerated).
- **Proposed AD fix: tighten AD-11:**
  > Versioning has two levels: `COMPLIANCE_VERSION` (any change regenerates every stored AI output, or hides it until regenerated) and `PROMPT_VERSION[<family>]` per prompt family. Archive tables (bulletins, past insights) are not regenerated after a compliance bump. They are shown with a "generated under the old rules" mark or withdrawn. The AD lists which tables are archives.

## Pair 5 — Finnhub has no single gateway, so the Epic 15 limiter misses half the traffic

- **Unit A: Epic 15 / H2.** Following the ticket ("a process-wide Finnhub token bucket in `market_data.py`") and AD-5 (only `market_data.py` calls Finnhub), it adds a limiter there.
- **Unit B: Story 13.7** (adding watchlist symbols to the scan) and **11.1** (if Finnhub's crypto endpoints are picked).
- **Clash (grounded):** AD-5 is **already false** in the live code. `fundamentals.py:8-9,114` (stock/metric, peers) and `insight_sources.py:20,46-56` (company-news, earnings, calendar, filings) call Finnhub directly with their own `httpx` clients. `screener.py:145-158` and `highlights.py:41-50` fan out through `fundamentals` under their own semaphores. A limiter in `market_data.py` covers neither path. 13.7 enlarges the insights universe (up to 300 symbols × 3–4 Finnhub calls). During US hours the 15-minute price-alert run (`setup_alerts_cron.sql`) also runs and quotes Finnhub, and screener bursts come on top. The 60/min limit is spread across modules that can't see each other.
- **Proposed AD fix: tighten AD-5 and add a budget rule:**
  > Every outbound market-data HTTP call (Finnhub: quote, profile, metric, peers, news, earnings, filings; Twelve Data; any crypto source) is made only from `market_data.py` (or a `market_data_*` submodule). `fundamentals.py` and `insight_sources.py` move behind it. Each provider has **one** process-wide budget with two lanes: `interactive`, which is protected, and `background`, which may only use what is left. Background runners take the `background` lane.

## Pair 6 — Crypto's Twelve Data share vs FR-120 "don't eat into the stock quota"

- **Unit A: Story 11.1.** If it picks Twelve Data (one of the epic's open questions), AD-5 *requires* it to go through "a single throttle lock", which means sharing the same 8/min with stocks.
- **Unit B: FR-120 / Epic 11 Done-when #2.** "Crypto calls don't use the stock pages' data quota."
- **Clash:** the two can't both be met. A single lock means a single budget (`market_data.py:41-58`). 11.3/FR-122 then wants crypto signals 7/24, so a new cron job adds load. At 05:15 the `signal-alerts` job (`setup_alerts_cron.sql`) and at 05:30 the insights scan (`setup_insights_cron.sql`, paced at 15 s/symbol, so 300 symbols ≈ 75 min, past the 06:30 re-fire) already share these 8 slots with interactive users.
- **Proposed AD fix: tighten AD-5:**
  > An asset class that can't take a share of an existing provider's budget gets its own provider/adapter and budget. Crypto doesn't use Twelve Data, or a separate key and budget is defined for it. Record this choice before 11.1 starts.

## Pair 7 — The same signal reaches the same user twice in the same morning

- **Unit A: Story 14.2 signal alerts.** 05:15 UTC, AD-14 compliant: a single notification from the run that wins `UPDATE … WHERE status='active'` (`signal_alerts.py:101-102`).
- **Unit B: Stories 13.6 + 13.7 insights push.** From 05:30 UTC, AD-14 compliant: the once-a-day claim is `insight_push_log` with `INSERT … ON CONFLICT DO NOTHING` (`insights.py:log_push`).
- **Clash (grounded):** the insights detector turns `golden_cross` / `death_cross` into a `technical` event (`insight_detectors.py:39,147-149`, built on the same `evaluate_signals`). A user with a `golden_cross` signal alert on AAPL who also holds AAPL gets **two pushes** for the same candle: "Sinyal alarmı" at 05:15 and "Portföyünde 1 gelişme" at ~05:30. 13.7 adds watchlist symbols to insights, and people usually put signal alerts on watchlist symbols, so the overlap grows. Both units also fetch the same symbol's daily candles **separately** from Twelve Data, 15 minutes apart. No candle cache exists (`market_data.get_us_candles` has no cache), even though AD-6 claims "kept in an in-process cache". That claim is false in the code. AD-14's "once per trigger" is scoped to one module's status row and does nothing across modules.
- **Proposed AD fix: tighten AD-14 and add a provider-call reuse rule:**
  > A trigger's identity is `(user, symbol, exchange, event_kind, candle_date)`. All notification paths (alerts, signal_alerts, insights, future crypto) claim through one ledger owned by `notifications.py`, `notification_log(user_id, dedupe_key, sent_on)`. An insights event already covered by a signal alert is dropped from the push, though it still shows on the screen. Background jobs on the same schedule window share a run-scoped candle/quote cache in `market_data`, keyed by `(symbol, exchange, timeframe, candle_date)`. AD-6's text is corrected.

## Pair 8 — Schedules assume US market hours, crypto needs 7/24

- **Unit A: Story 14.2 (live).** `price-alerts '*/15 13-21 * * 1-5'`, `signal-alerts '15 5 * * 2-6'` (`setup_alerts_cron.sql`). The single-flight lock is per `kind` (`alert_runner.py:22,75-87`).
- **Unit B: Story 11.3/11.4 (FR-122 "7/24").** Following AD-8, it adds a new `pg_cron` job, either (a) the same `kind=price` under another schedule or (b) a new `kind=crypto`.
- **Clash:** (a) If the runner query becomes `exchange IN ('US','CRYPTO')`, the 7/24 job quotes US stocks 96 times a day outside market hours (wasted Finnhub budget) while the US job quotes crypto. (b) With a new kind, the "same type" single-flight in AD-8 no longer holds. Both runs work the same `price_alerts` table at the same time. AD-14's conditional UPDATE prevents a double send, but provider calls double. AD-8 doesn't define what "the same type" is. The insights scan carries a US calendar assumption too: `symbol_scan_state.last_candle_date` ("cron runs at weekends too, so Friday's candle isn't counted twice on Sunday", `0013:17-19`) and `candle_date(c) < today` (`insight_runner.py:117`). If crypto is added to the scan, the weekend candles and the 00:00 UTC close break that logic.
- **Proposed AD fix: tighten AD-8:**
  > A job is identified by `(context, exchange-group)`. Its schedule comes from the exchange's trading calendar, defined in `market_data` (`market_calendar(exchange)`). The runner selects only the exchanges in its group. The single-flight key is `job_id`, and the same table may be worked by concurrent runs only for disjoint exchange groups. Each `setup_<iş>_cron.sql` job name includes the exchange group (`price-alerts-us`, `price-alerts-crypto`).

## Pair 9 — Google sign-up creates an account without consent

- **Unit A: Story 14.4 (Google sign-in, web).** Following AD-10, identity is Supabase Auth and the profile lives in `user_metadata`. `signInWithOAuth`, then `/auth/oauth` does `exchangeCodeForSession` (`apps/web/src/app/auth/oauth/route.ts:23-27`). Compliant.
- **Unit B: Epic 12 (KVKK) / the existing email sign-up.** `legal_accepted_at` and `legal_version` are written only in the email sign-up `options.data` (`apps/web/src/app/login/actions.ts:91-95`, `apps/mobile/screens/AuthScreen.tsx:95`).
- **Clash (grounded):** a user who first signs in with Google gets an account **without consent metadata**. Nothing on the API side checks `legal_accepted_at`, and grep finds no use of it under `apps/api`. AD-10 only lists the profile fields. AD-11/AD-15 cover output and deletion, not consent. Raising `LEGAL_VERSION` has the same gap: no re-consent flow exists. 14.5 (Apple) inherits the same hole, and the mobile OAuth flow (AD-16 parity) could solve it a third way. Google also writes `full_name`, `name` and `avatar_url` into `user_metadata`. That fits `displayNameFrom` (`packages/shared/src/auth/display-name.ts`) but no AD says the `locale` default is also written at sign-up.
- **Proposed AD fix: tighten AD-10 with a consent invariant:**
  > Every account-creation path (email, OAuth, future providers, web and mobile) ends with the same "profile complete" condition: `legal_accepted_at`, `legal_version = LEGAL_VERSION` and `locale` are present. If they are missing or the version is old, the session sends the user to a single consent screen (`/onboarding/consent`) and the API rejects user-data endpoints with 403 `consent_required`. The check lives in one shared helper (`hasCurrentConsent(metadata)`).

## Pair 10 — Bypassing module boundaries is how the system already works (AD-1)

- **Unit A: Story 13.7.** It copies the existing pattern: `insights.portfolio_universe` joins `positions`/`portfolios` directly (`insights.py:239-254`), and `push_recipients` joins `positions`, `portfolios`, `user_notification_settings` and `auth.users` (`insights.py:341-358`). 13.7 adds `watchlists`/`watchlist_items` to the same SQL.
- **Unit B: Epic 15 / M3 (async DB, pool).** It changes `watchlists.py`/`portfolios.py` access to async functions.
- **Clash:** AD-1 says "other contexts' data is reached through that module's functions". The live code reads at least four other modules' tables plus `auth.users.raw_user_meta_data` (`alerts.py:113-114`, `signal_alerts.py:117-118`, `insights.py:346-352`). The same "who holds/watches this symbol, and with which locale" question is answered three times in three SQL statements. 13.7 extends the universe to watchlists, but `push_recipients` still joins only `positions`. The scan and the push then disagree about who is interested: insights are produced for watchlist symbols, but watchlist owners never get a push. That is the shape of the bug 13.7's AC ("lower priority after portfolio symbols") seems to hide. When M3 changes the functions, the raw SQL copies don't follow.
- **Proposed AD fix: tighten AD-1:**
  > Reads are covered too: cross-context SQL joins are forbidden. Exception: read-only **interest queries** live in one place. `audience.py` (or `watchlists`/`portfolios` exporting `symbols_of_interest()` and `holders_of(symbol, exchange)`) answers "who is interested in this symbol and how". Profile fields (email, locale, legal) are read only through `auth.get_profile(user_id)` / `auth.profiles_for(user_ids)`. Code that joins `auth.users` directly is limited to `account.py` and `auth.py`.

---

## Smaller holes / spine–code mismatches

| # | Finding | Proposed change |
| --- | --- | --- |
| S1 | AD-11 says "every notification carries the disclaimer". The alert email has it (`notifications.py:137-144`), but push bodies (`alerts.price_alert_message`, `insight_text.push_text`) don't. A crypto push would follow the same pattern. | AD-11: the disclaimer is required in email and in-app detail screens. Push is exempt for length but must deep-link to a screen that shows the disclaimer. Pick one and write it down. |
| S2 | Epic 15 / L2 switches quantity arithmetic to `Decimal`. Pydantic v2 serializes `Decimal` to JSON as a **string**, while models use `quantity: float` (`simulations.py:36-37`). With crypto's fractional amounts (11.4/11.5), the web/mobile clients (AD-2, hand-mirrored) and the "server returns raw numbers" convention break. | Convention: the API returns numbers as JSON `number`. `Decimal` is used only inside computation and the DB, and is cast to `float` at the response-model boundary. Display precision per exchange (crypto has 8 decimals) comes from the shared formatter. |
| S3 | M4 adds an in-process lock for "page-load bulletin generation". A second, unwritten background-generation pattern appears alongside AD-8 (pg_cron). The insights page-load fallback (`main.py:1244-1247`) is in the same category. | AD-8: "page-load fallback" is a sanctioned variant. It uses the same single-flight registry and `*_runs` table as cron. |
| S4 | AD-8 "same type, one at a time": two separate registries hold in-process state (`alert_runner._running`, `insight_runner._running_task`). After a Render restart this resets, and with two instances it means nothing (Deferred notes this). | Single-flight is backed by a Postgres advisory lock (`pg_try_advisory_lock(hashtext(job_id))`). It is free and works across instances. |
| S5 | AD-15 says "every user-owned table cascades". OAuth identities are handled by Supabase, but no rule covers future crypto-specific user tables (e.g. a "favourite pairs" table) or `insight_reads` for watchlist-based insights. | Fine as is. Just add "migrations under review: grep for `user_id` without `on delete cascade`" to the CI lint. |
| S6 | 14.3 (corporate MX) vs 14.1 (Resend bounce MX `send.`): DNS work, not code. No AD is needed, but the spine's Structural Seed doesn't show DNS ownership. | Add a "DNS records and who owns them" table to the Structural Seed. |

## Proposed AD summary

| Change | Type | Closes |
| --- | --- | --- |
| AD-5: dispatch only in `market_data` (`get_quote/get_candles(symbol, exchange)`); every cache keyed by `(symbol, exchange)`; an unknown exchange raises an error | tighten | 1 |
| New AD: exchange registry (shared + Py single list, named DB constraint on every table, one widening story) | new | 2 |
| AD-12/13: `locale` in the AI cache key, or an explicit "AI is Turkish only" exception; the hit rule made explicit | tighten | 3 |
| AD-11: `COMPLIANCE_VERSION` + per-family `PROMPT_VERSION`; archive-table policy | tighten | 4 |
| AD-5: all market-data HTTP (fundamentals and insight_sources included) behind the gateway; one budget per provider with interactive/background lanes | tighten | 5, 6 |
| AD-14: cross-module notification ledger with a `(user, symbol, exchange, event_kind, candle_date)` dedupe key; run-scoped candle cache; correct the AD-6 text | tighten | 7 |
| AD-8: job identity = `(context, exchange-group)`; schedule from `market_calendar(exchange)`; advisory-lock single-flight | tighten | 8, S3, S4 |
| AD-10: "profile complete" consent invariant for every sign-up path + `consent_required` gate | tighten | 9 |
| AD-1: cross-module reads forbidden; the `audience`/`holders_of` + `auth.get_profile` exception | tighten | 10 |
| Convention: JSON numbers stay `number`; `Decimal` only internally | tighten | S2 |
