-- Ticket 15.11 / AD-12 — AI text is generated in the user's UI language (user decision
-- 2026-10-09). The language becomes part of the cache key so Turkish and English outputs
-- never overwrite each other. Existing rows are Turkish. Idempotent; apply to prod BEFORE
-- deploying the API that reads `locale`.

alter table ai_reports add column if not exists locale text not null default 'tr';
alter table ai_reports drop constraint if exists ai_reports_locale_check;
alter table ai_reports add constraint ai_reports_locale_check check (locale in ('tr', 'en'));
alter table ai_reports drop constraint if exists ai_reports_symbol_exchange_report_type_key;
alter table ai_reports drop constraint if exists ai_reports_symbol_exchange_report_type_locale_key;
alter table ai_reports add constraint ai_reports_symbol_exchange_report_type_locale_key
    unique (symbol, exchange, report_type, locale);

alter table sector_bulletins add column if not exists locale text not null default 'tr';
alter table sector_bulletins drop constraint if exists sector_bulletins_locale_check;
alter table sector_bulletins add constraint sector_bulletins_locale_check
    check (locale in ('tr', 'en'));
alter table sector_bulletins drop constraint if exists sector_bulletins_bulletin_date_key;
alter table sector_bulletins drop constraint if exists sector_bulletins_bulletin_date_locale_key;
alter table sector_bulletins add constraint sector_bulletins_bulletin_date_locale_key
    unique (bulletin_date, locale);
