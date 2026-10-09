-- Story 14.2 — background evaluation of price and signal alerts (Supabase pg_cron + pg_net).
--
-- Run once in the Supabase SQL editor of the production project, AFTER
-- setup_insights_cron.sql (it reuses that script's Vault secret 'insights_cron_secret',
-- which is the API's CRON_SECRET). Nothing to fill in.
--
-- Schedules (UTC):
--   price  — every 15 minutes, Monday–Friday 13:00–21:45. Covers the US session in both
--            summer (13:30–20:00) and winter (14:30–21:00) time; checks outside the
--            session only re-read an unchanged price.
--   signal — 05:15 Tuesday–Saturday, i.e. after each US trading day closed, just before the
--            05:30 portfolio scan.

create or replace function public.trigger_alerts_run(kind text) returns bigint
language sql security definer set search_path = public, extensions as $$
    select net.http_post(
        url := 'https://trendus-api.onrender.com/internal/alerts/run?kind=' || kind,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Cron-Secret', (
                select decrypted_secret from vault.decrypted_secrets
                where name = 'insights_cron_secret'
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
    );
$$;

revoke all on function public.trigger_alerts_run(text) from public, anon, authenticated;

select cron.schedule('price-alerts', '*/15 13-21 * * 1-5', $$select public.trigger_alerts_run('price')$$);
select cron.schedule('signal-alerts', '15 5 * * 2-6', $$select public.trigger_alerts_run('signal')$$);

-- Check:   select jobname, schedule, active from cron.job order by jobname;
-- History: select * from cron.job_run_details order by start_time desc limit 10;
-- Manual:  select public.trigger_alerts_run('price');
