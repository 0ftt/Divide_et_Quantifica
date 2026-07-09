-- =============================================================================
-- Classifica (leaderboard): patrimonio simulato condiviso su richiesta
-- dell'utente (pulsante "condividi in classifica"). Uno snapshot per utente,
-- aggiornato ad ogni condivisione.
-- =============================================================================

create table if not exists leaderboard_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  display_name text not null default '',
  score        numeric(14, 2) not null default 0,
  shared_at    timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_leaderboard_score on leaderboard_entries(score desc);
