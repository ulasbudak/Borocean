-- Epic 13 / Story 13.2 — morning portfolio scan schedule (Supabase pg_cron + pg_net).
--
-- Run once in the Supabase SQL editor of the project whose database the API uses
-- (prod: ztchiibpegvmtdafyhxa), AFTER migrations/0013_portfolio_insights.sql.
-- Before running:
--   1. Pick a long random secret (e.g. `openssl rand -hex 32`).
--   2. Set it on Render as the CRON_SECRET environment variable of the API service.
--   3. Replace <CRON_SECRET> below with the same value. It is stored in Supabase Vault, so
--      it never appears in plain text in cron.job.
--
-- Schedule: 05:30 UTC (08:30 TR), before the BIST and US opens; re-fired at 06:30 and 07:30
-- UTC to finish leftovers. The endpoint is idempotent (already-scanned symbols are skipped),
-- so the extra triggers only do unfinished work.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<CRON_SECRET>', 'insights_cron_secret');

create or replace function public.trigger_insights_run() returns bigint
language sql security definer set search_path = public, extensions as $$
    select net.http_post(
        url := 'https://trendus-api.onrender.com/internal/insights/run',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Cron-Secret', (
                select decrypted_secret from vault.decrypted_secrets
                where name = 'insights_cron_secret'
            )
        ),
        body := '{}'::jsonb,
        -- Render's free instance can take a while to answer if it was asleep.
        timeout_milliseconds := 60000
    );
$$;

revoke all on function public.trigger_insights_run() from public, anon, authenticated;

select cron.schedule('portfolio-insights-0530', '30 5 * * *', 'select public.trigger_insights_run()');
select cron.schedule('portfolio-insights-0630', '30 6 * * *', 'select public.trigger_insights_run()');
select cron.schedule('portfolio-insights-0730', '30 7 * * *', 'select public.trigger_insights_run()');

-- Check:   select jobname, schedule, active from cron.job;
-- History: select * from cron.job_run_details order by start_time desc limit 10;
-- HTTP:    select id, status_code, content from net._http_response order by created desc limit 5;
-- Run results are in public.insight_runs.
-- Manual trigger for a test: select public.trigger_insights_run();
