-- =============================================================================
-- Schema iniziale di Divide et Quantifica
-- Utenti (con credito/premium/ruolo), asset di mercato, portafoglio, ledger.
-- =============================================================================

-- Estensione per gli UUID (disponibile su Supabase)
create extension if not exists "pgcrypto";

-- Utenti dell'applicazione
create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  email          text unique not null,
  password_hash  text not null,
  display_name   text not null default '',
  role           text not null default 'user' check (role in ('user', 'admin')),
  credit         numeric(12, 2) not null default 0,
  is_premium     boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Asset di mercato negoziabili (immessi dall'admin, validati su Yahoo Finance)
create table if not exists assets (
  ticker      text primary key,
  name        text not null default '',
  currency    text not null default 'USD',
  last_price  numeric(14, 4) not null default 0,
  updated_at  timestamptz not null default now(),
  added_by    uuid references users(id) on delete set null
);

-- Portafoglio simulato: quantita' possedute per utente/asset
create table if not exists holdings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  ticker     text not null references assets(ticker) on delete cascade,
  quantity   numeric(18, 6) not null default 0,
  avg_price  numeric(14, 4) not null default 0,
  unique (user_id, ticker)
);

-- Ledger delle operazioni (ricariche, premium, acquisti, vendite)
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('recharge', 'premium', 'buy', 'sell')),
  ticker      text,
  quantity    numeric(18, 6),
  amount      numeric(12, 2) not null,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_holdings_user on holdings(user_id);
create index if not exists idx_transactions_user on transactions(user_id);
