-- =============================================================================
-- Storico/cache dei dati di mercato + salvataggio workspace (dashboard)
-- Ispirato allo schema originale (market_cache, workspaces).
-- =============================================================================

-- Storico persistente dei dati Yahoo Finance: evita chiamate ripetute.
-- Per ogni (ticker, timeframe) conserviamo l'ultimo payload e quando e' stato
-- scaricato. Il backend rilegge da qui finche' il dato e' "fresco".
create table if not exists market_cache (
  id            uuid primary key default gen_random_uuid(),
  ticker        text not null,
  timeframe     text not null default 'quote',
  data          jsonb not null,
  last_fetched  timestamptz not null default now(),
  unique (ticker, timeframe)
);

create index if not exists idx_market_cache_ticker on market_cache(ticker);

-- Salvataggio dello stato della dashboard per utente (camera + widget).
create table if not exists workspaces (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  name         text not null default 'Analisi Alfa',
  camera_x     double precision not null default 0,
  camera_y     double precision not null default 0,
  camera_zoom  double precision not null default 1,
  widget       jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

create index if not exists idx_workspaces_user on workspaces(user_id);

-- Rendimento corrente del portafoglio (ROI), come nello schema originale.
alter table users add column if not exists current_roi double precision not null default 0;
