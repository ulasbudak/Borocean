---
title: "Epic 13 — Portfolio Insight Tracking (Background AI Scan): Decision Note"
status: draft
created: 2026-09-28
updated: 2026-09-28
author: Bob (BMAD Scrum Master) — at the user's request, 2026-09-28
relatedDocs: ["docs/PRD.en.md §5.15", "docs/epics.en.md §17 (Epic 13)", "docs/compliance.md", "docs/architecture.en.md AD-8"]
language: en
translationOf: docs/product-brief-epic13-portfolio-insights.md
---

# Epic 13 — Portfolio Insight Tracking (Background AI Scan): Decision Note

*This is the English translation of [`docs/product-brief-epic13-portfolio-insights.md`](product-brief-epic13-portfolio-insights.md), which remains the source of truth.*

## The request

The user (2026-09-28): "When the daily AI reports of the stocks in the portfolio catch an important detail in the background, it should show up in the portfolio and on the user page."

Today, AI reports (Epic 9) are generated only when the user presses "Generate Report" on a stock page. For a user to notice that a company in their portfolio reported earnings, made a sharp price move or filed an important SEC document, they have to open every stock one by one. The request is for the app to do this **on its own, every day**, and to put it in front of the user only when something **important** happens.

## Key decisions

### 1. Who decides what is "important"? — Rules first, then AI

- **Options:** (a) generate a full AI report for every stock every day and let the LLM decide whether it matters; (b) deterministic rules catch "events", and the LLM only writes an explanation for stocks that have events.
- **Decision: (b).**
  - (a) means `number of symbols × 3` LLM calls a day, which Gemini's free quota and cost cannot carry.
  - With (a), the "important" decision can't be explained or reproduced: it might call the same data "important" one day and "unimportant" the next.
  - (a) is also riskier for SPK: a model saying "watch this stock!" is more directive than a rule saying "daily change -7.2%".
  - (b) matches the existing philosophy: Story 3.5's signal engine is deterministic, and AI is only an explanation layer.
- **Event types (first-version proposal):**

| Event | Source | Default threshold (calibrated in Story 13.1) |
|---|---|---|
| Sharp price move | daily candles (existing `get_us_candles`) | \|daily change\| ≥ max(5%, 2.5× the last 60 days' daily volatility) |
| Unusual volume | daily candles | volume ≥ 3× the 20-day average |
| 52-week high/low | daily candles | close is the 52-week high/low |
| Major technical event | Story 3.5 `evaluate_signals` | only Golden/Death Cross and Bollinger breakouts triggered today |
| Earnings reported | Finnhub `stock/earnings` | when a new period appears; with the surprise percentage |
| Upcoming earnings | Finnhub `calendar/earnings` | within 3 days (informational, low importance) |
| Important SEC filing | Finnhub `stock/filings` | new 8-K (material event), 10-Q/10-K |
| Fundamental metric change | existing `get_us_fundamentals` | above-threshold change in P/E, debt-to-equity, net margin or EPS growth vs the previous snapshot |
| Insider transaction cluster | Finnhub `stock/insider-transactions` | **second phase**: noisy, needs threshold calibration |

- Every event has a deterministic **importance score**. A day counts as "important" when at least one event scores above the threshold. **Target:** on an ordinary day, fewer than about 10% of portfolio symbols should be flagged, or the cards turn into noise. Thresholds are calibrated against historical data in Story 13.1.

### 2. Who runs it in the background? — Supabase `pg_cron` + `pg_net`

The project has had no scheduled jobs so far. AD-8 (Celery + Redis) was never set up; everything is computed at request time. This epic is the first feature that needs a real scheduler.

| Option | Cost | Reliability | Note |
|---|---|---|---|
| GitHub Actions cron | 0 | **Poor** | Tried with `keep-api-warm.yml`: ran 3 times in ~14 h instead of every 10 minutes; removed on 2026-09-26 |
| Render Cron Job | paid | Good | Not on the free plan; the user prefers $0 cost |
| Celery + Redis (AD-8) | Redis + worker instance | Good | No separate worker on free Render; excessive infrastructure |
| At request time (when the portfolio opens) | 0 | — | Doesn't meet the "in the background" request; makes the first open wait 10+ seconds |
| **Supabase `pg_cron` + `pg_net`** | **0** | Good | Both extensions are available in the dev project (not installed; verified 2026-09-28). The database's own scheduler sends an HTTP request to the API |

- **Decision: `pg_cron` + `pg_net`.** Every day after the US close (22:30 UTC, 01:30 Turkey time), `pg_net.http_post` calls the API's `POST /internal/insights/run` endpoint.
- **The endpoint:**
  - It is protected by a shared-secret header (`X-Cron-Secret`).
  - It returns `202` immediately and runs the work in the background (`BackgroundTasks`).
  - **It is idempotent:** it skips symbols already processed that day. So triggering it again at 23:30 and 00:30 the same night finishes any work left half-done (if Render restarts or a quota runs out).
- **Safety net:** if today's run never started when a user opens their portfolio, a notice is shown and the run is triggered.
- This decision should be recorded in `docs/architecture.md` as a new decision that effectively replaces AD-8 (Story 13.2).

### 3. Cost and quota budget

- **Universe:** the **distinct** US symbols across all users' portfolios (BIST is currently disabled). A report is generated once per symbol and shown to everyone who holds that stock (Story 9.1's global cache pattern). Cost is driven by the number of symbols, not the number of users.
- **Twelve Data (candles):** free plan is 8 requests per minute and 800 per day, shared with live users. The nightly run uses at most 4 requests per minute and is capped per day (starting proposal: 300 symbols). Past the cap, symbols are prioritized: the ones held by the most users come first.
- **Finnhub (earnings, filings, fundamentals):** 60 requests per minute; 3–4 calls per symbol. 300 symbols ≈ 20 minutes, no problem.
- **Gemini:** called only for symbols with events. There is a daily cap (starting value: 50 notes). Events past the cap are shown without a note, as the deterministic event list only.

### 4. Where does it show up?

- **Portfolio page (web + mobile):** a badge ("New update") on the row of any position with an update. Clicking it opens the update card: events, AI note, date, link to the stock page. Under the portfolio header, a strip listing the last 7 days' updates.
- **User page:** a "Updates in your portfolio" card on the dashboard (web `/dashboard`, mobile `HomeScreen`), with the unread count and the latest updates. *Assumption:* the "user page" is the home page after login, i.e. the dashboard. See open question 1.
- **Stock detail page:** a "Recent updates" section (same data; a free extra surface).
- **Read state:** per user. Unread updates are highlighted with the badge; once seen, the badge goes away.

### 5. Compliance (Epic 12 / `docs/compliance.md`)

- The update card says **what happened**, never **what to do**. Phrases like "review your position", "consider selling" or "opportunity" are forbidden. The AI note is generated with `COMPLIANCE_RULES` and follows the structure "What happened / What it changes in the data / Risks to be aware of".
- An event's impact may be classified as "positive / negative / neutral". This is the kind of analysis the shared assessment cites as an example for KAP announcements. A "negative" label must not turn into a call to sell, though.
- **Data not to be used:** Finnhub `stock/recommendation` (analysts' strong buy/buy/hold/sell counts). Relaying someone else's buy/sell advice is also direction.
- **News:** headline, source and link only; no copying of article text (copyright). The commercial-use terms of Finnhub's free plan are already an open item in `docs/compliance.md` §4.
- **Showing by portfolio:** selecting which updates to show based on the user's positions is personalized information, not a personal investment recommendation. This distinction should still be added to the lawyer review (compliance §4, item 1).
- **KVKK:** the only new personal data is the read state. "Showing updates about the stocks in your portfolio" should be added to the purposes in the privacy notice. The read table must `ON DELETE CASCADE` from `auth.users` (consistent with account deletion).

### 6. Freemium

`ALL_FEATURES_FREE` is on right now. The mechanism is still built in from the start (Story 8.1 pattern):
- The deterministic event list is open to everyone.
- The AI note requires `Entitlement.ai_reports`.

When the flag is turned off, free users still see the update but not the AI explanation. That makes a natural reason to upgrade.

## Decisions (2026-09-28, user)

1. **User page = the dashboard** (web `/dashboard`, mobile `HomeScreen`).
2. **Scope: portfolio first.** Watchlist later (Story 13.7).
3. **Notifications:** for stock updates, **mobile push yes, email no**. Story 13.6 moves into the first version; at most one summary push a day.
4. **Scan frequency: once a day, in the morning before the open.**
   - Time: **05:30 UTC (08:30 Turkey time)**. The previous US session is closed, and it is before both the BIST (10:00 TR) and US (16:30 TR) opens, so updates are ready as the user starts the day.
   - Re-triggered at 06:30 and 07:30 UTC to finish leftover work.
   - Trade-off: US earnings released pre-market are caught in the next morning's scan.
   - This replaces the 22:30 UTC proposal in §2.
5. **News headlines will be shown**, with the source name and a link to the original article. Only the headline is shown; no text is copied. Headlines don't trigger events; they are added as context to the card of stocks that have events (at most 3 headlines from the last 48 hours).

## Next step

`docs/stories/story-13.1.md` is opened. Its first task is calibrating the thresholds against historical data and verifying the "<10% of portfolio symbols on an ordinary day" target.
