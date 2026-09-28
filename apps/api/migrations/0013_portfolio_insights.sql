-- Epic 13 — Portföy gelişme takibi (Story 13.1–13.6), kullanıcı isteği 2026-09-28.
-- Sabah taraması (pg_cron → POST /internal/insights/run) portföylerdeki farklı sembolleri
-- tarar, deterministik olayları (app/insight_detectors.py) bulur, önemli olanları
-- symbol_insights'a yazar. Üretim global (sembol başına bir satır/gün), gösterim kişisel
-- (kullanıcının pozisyonlarıyla join). Kişisel veri yalnızca insight_reads ve
-- insight_push_log'da; ikisi de auth.users'a ON DELETE CASCADE (Story 12.2 hesap silme).
-- Önceki migration'larla aynı: elle uygulanır, RLS yalnızca "varsayılan kapalı" savunması
-- (backend postgres rolüyle bağlanır).

-- Sembol başına tarama durumu: idempotentlik (bugün tarandı mı?) ve bir sonraki taramanın
-- "yeni mi?" kararları için önceki bilanço dönemi ve temel metrikler.
create table if not exists symbol_scan_state (
    symbol text not null,
    exchange text not null,
    last_scanned_date date not null,
    -- Mum tabanlı dedektörler yalnızca yeni bir işlem günü mumu geldiğinde çalışır;
    -- cron hafta sonu da çalıştığı için cuma mumu pazar günü ikinci kez sayılmaz.
    last_candle_date date,
    last_earnings_period text,
    fundamentals jsonb,
    updated_at timestamptz not null default now(),
    primary key (symbol, exchange)
);

create table if not exists symbol_insights (
    id uuid primary key default gen_random_uuid(),
    symbol text not null,
    exchange text not null,
    insight_date date not null,
    severity smallint not null check (severity between 1 and 3),
    events jsonb not null,
    headlines jsonb not null default '[]'::jsonb,
    note text,
    note_tone text check (note_tone in ('positive', 'negative', 'neutral', 'mixed')),
    prompt_version smallint,
    created_at timestamptz not null default now(),
    unique (symbol, exchange, insight_date)
);

create index if not exists symbol_insights_symbol_date_idx
    on symbol_insights (symbol, exchange, insight_date desc);

create table if not exists insight_runs (
    id uuid primary key default gen_random_uuid(),
    run_date date not null,
    trigger text not null check (trigger in ('cron', 'fallback', 'manual')),
    status text not null default 'running' check (status in ('running', 'completed', 'failed')),
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    universe_size integer not null default 0,
    processed integer not null default 0,
    skipped integer not null default 0,
    important integer not null default 0,
    failed integer not null default 0,
    notes_generated integer not null default 0,
    pushes_sent integer not null default 0,
    error text
);

create index if not exists insight_runs_run_date_idx on insight_runs (run_date desc);

create table if not exists insight_reads (
    user_id uuid not null references auth.users(id) on delete cascade,
    insight_id uuid not null references symbol_insights(id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (user_id, insight_id)
);

-- Story 13.6: günde en fazla bir özet push.
create table if not exists insight_push_log (
    user_id uuid not null references auth.users(id) on delete cascade,
    push_date date not null,
    sent_at timestamptz not null default now(),
    primary key (user_id, push_date)
);

alter table symbol_scan_state enable row level security;
alter table symbol_insights enable row level security;
alter table insight_runs enable row level security;
alter table insight_reads enable row level security;
alter table insight_push_log enable row level security;
