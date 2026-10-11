---
title: 'Karşılama sayfasını (/) gerçek bir tanıtım sayfasına dönüştürmek'
type: 'feature'
ticket: 8
created: '2026-10-11'
status: 'built'
baseline_revision: '9f515458ad7e6de6fad4b4615e1241de60cbc37e'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context:
  - '{project-root}/docs/initiative-borocean/ux-borocean/EXPERIENCE.md'
  - '{project-root}/docs/compliance.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The web root (`/`) for an anonymous visitor reads like a login gate: Giriş/Kayıt buttons at the top of a `max-w-sm` column, no product screenshot, narrow and short. The content is accurate and compliant; presentation is the gap (user decision 2026-10-10).

**Approach:** Rewrite only the anonymous branch of `apps/web/src/app/page.tsx` to the 8 sections in EXPERIENCE.md › "Karşılama Sayfası (/)": top bar with a small "Giriş Yap" link, hero with one primary CTA "Ücretsiz Başla" plus a real stock-detail screenshot, problem paragraph, the 6 feature cards grouped under three `<h2>`s, "Üç Görüş", transparency band, repeated CTA, unchanged footer. New copy goes into `@borocean/shared` i18n (tr + en). The screenshot is captured from the local app (AAPL, Genel Bakış) in dark and light; the page shows the one matching the active theme.

## Boundaries & Constraints

**Always:**
- Signed-in branch (Logo + "Panele git") and the JSON-LD block behave exactly as today.
- Existing strings (`home.heroTitle/heroText/features/freeNote`, `common.disclaimer`) are reused unchanged; new keys land in `types.ts`, `tr.ts`, `en.ts` together.
- Compliance (compliance.md §3, EXPERIENCE.md row 5): Üç Görüş copy never uses "tavsiye", "sinyal", "fırsat"; no buy/sell wording or return promises.
- A11y floor: group titles and the Üç Görüş title are `<h2>`, card titles `<h3>`; decorative SVGs `aria-hidden`; "Giriş Yap" hit area ≥24×24px via padding; screenshot has a meaningful `alt`.
- Hero, feature groups and Üç Görüş collapse to one column below the existing `sm` breakpoint; theme tokens only, no hard-coded colors.

**Never:**
- Touch the mobile app; add a marketing/animation library, a sticky header, or client JS (page stays a server component).
- Change `/login`, `/signup`, SEO metadata, robots, sitemap, opengraph-image.
- Reuse the stale tagline "İki borsa, üç görüş, tek uygulama" (BIST disabled).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Anonymous, tr | no session, locale tr | "Giriş Yap" link → `/login`; h1 + text + one "Ücretsiz Başla" → `/signup`; screenshot; problem text; 3 groups / 6 cards; Üç Görüş (3 cards, "Üretimde"); transparency band with Şartlar/KVKK links; final CTA; footer | No error expected |
| Anonymous, en | locale en | Same structure, English strings | No error expected |
| Signed in | valid session | Logo + "Panele git" only; sections 1–7 not rendered | No error expected |
| Light theme | `prefers-color-scheme: light` or `[data-theme="light"]` | Light screenshot shown, dark hidden (CSS only) | No error expected |
| Narrow viewport | width 375px | Single column, `scrollWidth <= clientWidth` | No error expected |

</frozen-after-approval>

## Code Map

- `apps/web/src/app/page.tsx` -- keep `JSON_LD`, the `getClaims()` auth check, `getLocale()`, and the footer block; replace the `max-w-sm` hero and `max-w-3xl` features for the anonymous branch.
- `packages/shared/src/i18n/types.ts` (`home`, ~line 26), `messages/tr.ts` and `messages/en.ts` (line 11) -- add keys; mobile never reads `home.*`.
- `apps/web/src/components/ui/logo.tsx` -- `<Logo size="sm" />` for the top bar. `button.tsx` -- copy its CTA class language onto a `<Link>`.
- `apps/web/src/app/globals.css` lines 29–55 -- theme is `@media (prefers-color-scheme: light)` plus `:root[data-theme=…]`; add `.theme-dark-only` / `.theme-light-only` beside those selectors.
- `apps/web/src/assets/landing/stock-overview-{dark,light}.png` -- new, statically imported via `next/image` (auto width/height, no CLS); ≤ ~350 KB each, 1280px wide.
- `apps/web/scripts/capture-landing-screenshot.ts` -- new; `node` runs it (Node 24 strips types) with `chromium` from `@playwright/test`. Signs up a disposable account via `/signup` (selectors from `e2e/account.setup.ts`), opens `/stock/US/AAPL`, waits for "Güncel Fiyat" and the Metrik Puanı card, screenshots the content clip in dark then light (`data-theme`), deletes the account via `/settings` (steps from `e2e/account.teardown.ts`). Needs local web (`pnpm build && pnpm start`) and API on :8000 against dev Supabase; refuse prod like `playwright.config.ts`.
- `apps/web/e2e/public/landing-seo.spec.ts` -- first test clicks "Kayıt Ol"; rewrite. `a11y.spec.ts` already scans `/` both schemes; must stay green. `e2e/signed-in/dashboard.spec.ts` -- host the signed-in `/` check.
- `docs/initiative-borocean/ux-borocean/EXPERIENCE.md` -- resolve the two `[ASSUMPTION]` markers (container width, non-sticky bar) after build.

## Tasks & Acceptance

**Execution:**
- [ ] `packages/shared/src/i18n/{types.ts,messages/tr.ts,messages/en.ts}` -- add `home.getStarted`, `home.problemText`, `home.featureGroups: { title; features: number[] }[]` ([0,1], [2,3,4], [5]), `home.threeViews: { title; subtitle; liveBadge; cards: { title; text }[] }`, `home.transparencyText`, `home.screenshotAlt`; tr verbatim from EXPERIENCE.md rows 3, 5, 6, en faithful -- single-sourced copy.
- [ ] `apps/web/scripts/capture-landing-screenshot.ts` -- write, run, commit the two PNGs under `src/assets/landing/` -- real product shot.
- [ ] `apps/web/src/app/globals.css` -- theme-only display utilities -- screenshot swap without JS.
- [ ] `apps/web/src/app/page.tsx` -- anonymous branch → sections 1–8, `max-w-5xl` containers, `sm:` grid collapse, two `next/image`s, `lucide-react` icons `aria-hidden` -- the feature.
- [ ] `apps/web/e2e/public/landing-seo.spec.ts` -- assert one "Giriş Yap" link → `/login`, two "Ücretsiz Başla" links → `/signup`, four `h2`s incl. "Aynı hisseye üç ayrı görüş", visible hero `img` with alt, no "Kayıt Ol" button, and at 375×800 `scrollWidth <= clientWidth` -- I/O rows 1 and 5.
- [ ] `apps/web/e2e/signed-in/dashboard.spec.ts` -- `/` shows "Panele git" and no "Ücretsiz Başla" -- I/O row 3.
- [ ] `docs/initiative-borocean/ux-borocean/EXPERIENCE.md` -- replace the two `[ASSUMPTION]`s with shipped values -- keep the spine true.

**Acceptance Criteria:**
- Given an anonymous visitor on `/`, when it loads, then the only primary button is "Ücretsiz Başla", "Giriş Yap" is a small underlined top-bar link, and a real stock-detail screenshot is visible in the hero.
- Given the English locale cookie, when `/` loads, then every new section is English with no Turkish fallback.
- Given the axe scan in both schemes, when `/` is analyzed, then zero serious/critical violations and the outline is h1 → h2 → h3.
- Given a signed-in user, when `/` loads, then only Logo and "Panele git" render.

## Implementation Notes

- 2026-10-11 — Implemented directly in the planning session (full context already loaded; no cold subagent dispatched).
- Spec deviation: EXPERIENCE.md row 2 asked for "fiyat grafiği + Metrik Puanı kartı" on the Genel Bakış tab, but the price chart lives on the Teknik Analiz tab. Captured Genel Bakış as specified by tab name (stock header, score card, price row) and amended the spec row to match. Swap to the Teknik tab is a one-line change in the capture script if preferred.
- Capture script uses `page.emulateMedia({ colorScheme })` instead of `data-theme`: pre-existing bug found — `:root[data-theme="dark"]` only sets `color-scheme` and does not restore the dark tokens when the OS scheme is light, so a manual "koyu" choice on a light-OS machine renders light tokens. Out of scope here (theme toggle, Story 16.5/ui-ux); worth its own ticket.
- Dropped the "Neler yapabilirsin?" heading on the landing (the mock has none; three group `<h2>`s replace it). `home.featuresTitle` stays in i18n unused on web.
- Signed-in branch keeps Logo, hero title/text and "Panele git"; the feature grid no longer renders for signed-in users (ticket verify: "yalnızca Panele git").
- Hidden theme image: both `<Image>`s are in the DOM (`display:none` for the inactive one); the browser still fetches both optimized variants. Accepted for simplicity; axe passes.
- Unrelated pre-existing failure seen while running the signed-in project: `dashboard.spec.ts › without positions the portfolio insights panel stays hidden` — the panel title renders during loading and the `GET /insights` request never reaches the API after its preflight (only OPTIONS logged). Belongs to the 13.7 review, not this story.

## Plan Change Log

## Review Triage Log

- 2026-10-11 — quick lens, pass 1: 7 findings → high 0 / medium 3 / low 3 / false 1 / maybe-false 0. Routed: 5 patch, 2 rejected (1 false, 1 low). No intent_gap or bad_plan, no loopback.
  - `page.tsx` hero `<Image priority>` — **medium → patch.** Verified: Next 16 docs deprecate `priority`, and the light/dark pair guidance forbids preload; served HTML preloaded the hidden dark image and lazy-loaded the visible light one. Fixed: `priority` dropped, `fetchPriority="high"` on both; served HTML now has no image preload and both `<img>`s lazy with fetchPriority high.
  - `page.tsx` literal shadow colour — **low → patch.** Verified: new `rgba(0,0,0,0.6)` literal against the frozen "no hard-coded colors" rule. Fixed: Tailwind `shadow-2xl`.
  - Signed-in branch "contradiction" — **false.** EXPERIENCE.md row 1 says the landing sections are not rendered for signed-in users and the ticket's verify says they see only "Panele git"; "behave exactly as today" refers to the `isAuthenticated` branch (Logo, title, text, button), which is unchanged. One reading; test encodes it. Surfaced to the user in the summary.
  - Screenshot shows `Endüstri: Veri yok` and clips the next card — **medium → patch.** Verified in both PNGs. Fixed: capture hides "Veri yok" rows and ends the frame at the stats card edge; recaptured. The "1280px wide" remark is **low, rejected**: 800 CSS px at DPR 2 is a plan-prose mismatch with no user harm.
  - EXPERIENCE.md row 2 amended (no chart on Genel Bakış) — **low, rejected.** The frozen intent fixes the Genel Bakış tab, which has no price chart; the amendment documents reality and the Implementation Notes disclose the Teknik-tab alternative. Decision left to the user in the summary.
  - `.theme-dark-only` trusts `[data-theme="dark"]` which tokens ignored — **medium → patch.** Verified: `:root[data-theme="dark"]` only set `color-scheme`. Fixed at the root: the rule now re-declares the dark token set (same pattern as the light override), so a stored "koyu" choice on a light-OS machine renders dark everywhere; e2e asserts both override directions incl. `--tk-canvas`.
  - Locale cookie pinned to `http://localhost:3000` — **low → patch.** Fixed: cookie `url` comes from the `baseURL` fixture.

## Design Notes

- `featureGroups` holds indexes into `features` so card copy stays single-sourced; tr/en arrays stay index-aligned.
- Screenshot swap:
  ```css
  .theme-light-only { display: none; }
  @media (prefers-color-scheme: light) { .theme-dark-only { display: none; } .theme-light-only { display: block; } }
  :root[data-theme="dark"] .theme-dark-only { display: block; } :root[data-theme="dark"] .theme-light-only { display: none; }
  :root[data-theme="light"] .theme-dark-only { display: none; } :root[data-theme="light"] .theme-light-only { display: block; }
  ```
- "Üretimde" badge: `text-positive` on `bg-positive/15` plus border (Settings badge fix pattern); no "yakında" variant.

## Verification

**Commands:**
- `pnpm --filter @borocean/shared typecheck && pnpm --filter web typecheck && pnpm --filter web lint` -- expected: exit 0.
- `pnpm --filter web build` -- expected: succeeds, no image warnings.
- `cd apps/web && pnpm exec playwright test --project=public` -- expected: landing-seo, a11y (`/` dark+light), auth, legal pass.
- `cd apps/web && pnpm exec playwright test --project=signed-in dashboard` -- expected: new signed-in `/` test passes.

**Manual checks:**
- Real browser at desktop and 375px, dark and light: two-column hero on desktop, single column narrow, screenshot matches theme, "Giriş Yap" target ≥24px.
