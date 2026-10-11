# Deferred work

- source_plan: `docs/initiative-borocean/epic-ux-improvements/story-karslama-sayfasn-gercek-bir-tantm-sayfasna-donusturmek-plan.md`
  summary: Signed-in e2e `dashboard.spec.ts › without positions the portfolio insights panel stays hidden` fails on main — the panel title renders while loading and `GET /insights` never reaches the local API after its CORS preflight (only OPTIONS logged).
  evidence: Reproduced twice on 2026-10-11 against a fresh disposable dev account with the 16.8 tree; the same failure occurs with the landing-page change excluded (test touches /dashboard only). Belongs to the 13.7 watchlist-insights review.
