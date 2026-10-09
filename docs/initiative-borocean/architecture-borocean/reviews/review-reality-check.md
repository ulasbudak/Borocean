# Review — Reality Check (versions, existence, live defaults)

- **Spine:** `docs/initiative-borocean/architecture-borocean/architecture-borocean.md` (draft, 2026-10-09)
- **Lens:** Was each committed decision checked against the repo and current vendor docs, or written from memory?
- **Date checked:** 2026-10-09
- **Method:** Compared against `apps/web/package.json`, `apps/mobile/package.json`, `packages/shared/package.json`, root `package.json`, `apps/api/pyproject.toml`, `.github/workflows/ci.yml`, `pnpm-lock.yaml`, `apps/web/vercel.json`, `apps/api/app/*.py`, and `apps/api/scripts/*.sql`. Checked against vendor docs and web search on the same date.

## Verdict

The Stack table matches the repo exactly, and every named technology exists and works as described. Two vendor-licensing facts are missing from the spine, though, and they put the "managed platforms" premise at risk in production. Twelve Data's free Basic plan allows internal non-display use only. Finnhub's free plan is for personal use only. The Gemini free tier also uses submitted content to improve Google's products, which is a KVKK concern. A few rules also state things the code does not do (AD-2, AD-5) or leave out live defaults the design depends on.

## Findings

### F1 — HIGH — Data-provider licences do not permit a public app (AD-5, Deferred "BIST veri sağlayıcısı")
- **Fact:** Twelve Data's pricing page lists the free **Basic** plan as "8 API (800 a day)" and **"Internal non-display usage"**. Its terms define non-display use as use that does not show data to people. Showing data to external users requires a business plan (Venture, about $499/mo, for external display). Finnhub's registration says free use is for a "qualified non-professional (personal use)" unless Finnhub approves otherwise in writing. Third-party summaries of Finnhub's ToS say plans are personal-only and redistribution needs approval. The Finnhub items come from third-party sources plus the sign-up page; I could not fetch the Finnhub terms page itself.
- **Spine:** It treats Finnhub and Twelve Data as the production providers for a live public product (borocean.com) and treats only BIST licensing as an open business decision.
- **Fix:** Add a Deferred/open item named "US data licensing", alongside BIST. Record the plan tier needed for external display from each provider (Twelve Data Venture+, Finnhub commercial). Until that is decided, either mark AD-5's providers as "dev-grade licences" or check with the providers. Also note in docs/compliance.md that the current plans are non-display or personal-use only.

### F2 — MEDIUM — Twelve Data daily cap and Finnhub limits are missing (AD-5)
- **Fact:** Twelve Data Basic allows 8 credits/min **and 800/day**. `market_data.py` throttles only per minute (`TWELVEDATA_RATE_LIMIT_PER_MINUTE = 8`). Finnhub free allows 60/min, with a reported burst cap of 30/sec. The code has no Finnhub limiter.
- **Also:** The rule "only `market_data.py` calls Finnhub" is false in the current code. `fundamentals.py` (`/stock/metric`, `/stock/peers`), `insight_sources.py` (`FINNHUB_BASE_URL`) and `screener.py` also call Finnhub.
- **Fix:** In AD-5, name both quotas (8/min + 800/day; 60/min). Either narrow the rule to "Twelve Data only via market_data.py; Finnhub via market_data.py, fundamentals.py, insight_sources.py" or mark the other Finnhub call sites as a known deviation to fold back in. Decide where the 800/day budget is enforced or monitored.

### F3 — MEDIUM — The Gemini free tier trains on submitted content; the model is pinned in config but not in the spine (AD-11, AD-12)
- **Fact:** `config.py` sets `gemini_model = "gemini-3.6-flash"` and calls `v1beta/models/{model}:generateContent`. Google's model list shows 3.6 Flash as stable and "previous generation" (3.7 and 3.8 Flash are newer). 2.0 and 2.5 Flash are already shut down, so model churn is real. On the pricing page, the free tier says "Used to improve our products: Yes". Insights prompts include user portfolio positions.
- **Fix:** Add the model ID and API version to the Stack table. In AD-11, state which tier is used. If it is the free tier, record the KVKK cross-border transfer and training-use exposure in docs/compliance.md, or move to the paid tier. Add a Deferred trigger: "re-check model deprecation at each PROMPT_VERSION bump".

### F4 — MEDIUM — AD-2 says "no OpenAPI type generation", but the tooling is still in the repo
- **Fact:** `packages/shared/package.json` still has `"generate:types": "openapi-typescript …"` and the devDependency `openapi-typescript 7.13.0`. No `src/api-types.ts` exists, and nothing imports it. The old docs/architecture.md (line 106) committed to generating types.
- **Fix:** Either delete the script and dependency so the repo matches AD-2, or add to AD-2: "`generate:types` is unused; do not reintroduce without a new AD".

### F5 — LOW — Stack table: the versions match the repo but leave out drift that matters
- **Confirmed against the repo and lockfile:** Python 3.13 (CI), FastAPI 0.141.1, psycopg 3.3.5, PyJWT 2.14.0, onnxruntime 1.30.0, Node 24, pnpm 12.4.1, Turbo 2.10.13, Next 16.3.5, React 19.2.8 (web), @supabase/ssr 0.12.7, supabase-js 2.116.0, lightweight-charts 5.2.1 (lock), Expo ~57.0.22, RN 0.86.3, TS 5.9.3 (shared).
- **Not in the table:**
  - The mobile app uses **React 19.2.3** and **TypeScript 6.0.3**. The web app uses React 19.2.8 and `typescript ^5` (5.9.3). The lockfile holds two React versions and two TS majors, so "TypeScript (shared) 5.9.3" hides a TS 6 / TS 5 split.
  - The mobile chart loads `https://unpkg.com/lightweight-charts@5.2.1/...` from a CDN at runtime (`apps/mobile/screens/PriceChartWebView.tsx:56`). AD-9 does not mention this. It adds a runtime dependency on unpkg and needs network access.
  - The **production** Python version is not pinned for Render. There is no `PYTHON_VERSION`, `.python-version` or `runtime.txt`, and `requires-python = ">=3.11"`, so CI (3.13) and prod can differ.
- **Upstream currency (2026-10-09):** Next.js 16.4.0 is "Latest" (released Oct 6–7). Next 15 security support ends 2026-10-21, so 16.x is correct. FastAPI 0.143.0 (Oct 8) has **breaking changes**; 0.141.1 is pinned. Expo SDK 57 / RN 0.86 is the current stable; SDK 58 (RN 0.88) is in beta and close to release. lightweight-charts 5.2.1 is the latest core release.
- **Fix:** Add rows for React (mobile) 19.2.3, TypeScript (mobile) 6.0.3, Python (Render prod), Gemini model, and "lightweight-charts (mobile, unpkg CDN) 5.2.1". Pin `PYTHON_VERSION=3.13.x` on Render. Optionally bundle the chart script into the WebView HTML.

### F6 — LOW — AD-8 leans on live defaults it does not name
- **Confirmed:** On hosted Supabase, pg_cron + pg_net + Vault work as the documented pattern (`vault.decrypted_secrets` read inside the cron function). Supabase recommends this because `ALTER DATABASE … SET` is denied. pg_cron is 1.6.4 and allows at most 32 concurrent jobs.
- **Defaults the rule depends on:**
  - The pg_net `http_post` default `timeout_milliseconds` is **2000 ms**. Both setup scripts override it to 60000. Render free cold start takes about 1 minute, which is right at that 60 s limit.
  - pg_net is still documented as beta and its signatures may change.
  - Responses are kept in unlogged `net._http_response` for 6 h.
- **Fix:** In AD-8, require each setup script to set `timeout_milliseconds` explicitly. Record that Render's cold start (about 60 s) is the reason the UptimeRobot ping exists.

### F7 — LOW — Render free plan: confirmed, plus two unstated limits
- **Confirmed (render.com/docs/free):** A free web service spins down after 15 min without inbound traffic, takes about 1 min to spin up, and is limited to a single instance. Render "might restart a Free web service at any time". The account gets 750 free instance hours per month, and **all** free services suspend when they run out.
- **Missing from the spine:**
  - With UptimeRobot keeping the API up 24/7, one service uses about 744 h/month. Any second free service in the same workspace would exhaust the hours and suspend both.
  - Random restarts kill in-process `asyncio` jobs (AD-8 202+task pattern) partway through. That is acceptable only because jobs are idempotent and re-runnable, so the spine should say so.
- **Fix:** In the Structural Seed or Deferred, note: "keep-alive consumes ~744 of 750 free hours — no second free Render service". In AD-8, note: "a mid-run restart loses the job; next cron tick must recover".

### F8 — LOW — Expo Push and Resend: endpoints confirmed, but the spine omits required practices
- **Expo:** `https://exp.host/--/api/v2/push/send` is current. Batches hold at most 100 messages, and the limit is 600 notifications/s per project. Expo docs say you **must** check push receipts and stop sending to `DeviceNotRegistered` tokens. `notifications.py` has no receipt handling. An access token is optional but recommended.
- **Resend:** `POST https://api.resend.com/emails` is current. It supports an `Idempotency-Key` header with a 24 h TTL, which `notifications.py` does not use. The key would back up AD-14's "once per trigger" guarantee if a request is retried.
- **Fix:** Add to AD-14: "push receipts are checked and dead tokens pruned; Resend calls send `Idempotency-Key` = trigger id". Alternatively, list both as known gaps.

### Confirmed with no change needed
- **Next.js 16 `proxy.ts`:** `middleware` is deprecated and renamed `proxy` since v16.0.0. The file may live in `src/` and defaults to the Node.js runtime. The repo has `apps/web/src/proxy.ts`, which exports `proxy`. Matches.
- **Vercel `fra1`:** `apps/web/vercel.json` sets `"regions": ["fra1"]`. Matches.
- **lightweight-charts v5:** 5.2.1 is the latest core release. The v5 API uses `addSeries` and markers as plugins.
- **Supabase Vault + pg_cron + pg_net:** These are the documented pattern (see F6 for the defaults).

## Sources
- https://render.com/docs/free
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://nextjs.org/blog/next-16-4 ; https://endoflife.date/nextjs
- https://supabase.com/docs/guides/database/extensions/pg_net
- https://supabase.com/docs/guides/troubleshooting/pgcron-debugging-guide-n1KTaz
- https://twelvedata.com/pricing ; https://twelvedata.com/pricing-business ; https://twelvedata.com/terms ; https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
- https://finnhub.io/register ; https://www.moneyflock.com/contents/articles/free-stock-api-commercial-use-licensing (third-party)
- https://ai.google.dev/gemini-api/docs/models ; https://ai.google.dev/gemini-api/docs/pricing
- https://docs.expo.dev/push-notifications/sending-notifications/
- https://resend.com/docs/api-reference/emails/send-email
- https://github.com/tradingview/lightweight-charts/releases
- https://expo.dev/changelog/sdk-57 ; https://expo.dev/changelog/sdk-58-beta
- https://pypi.org/project/fastapi/
