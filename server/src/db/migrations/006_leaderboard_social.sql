-- =============================================================================
-- Aspetti sociali della classifica: storico reale dei punteggi condivisi
-- (una riga per ogni condivisione, non solo l'ultima) e recensioni testuali
-- lasciate da altri utenti su una entry condivisa
-- =============================================================================

-- Storico: ogni "condividi in classifica" aggiunge una riga qui, in aggiunta
-- all'upsert su leaderboard_entries (che resta lo snapshot corrente per la
-- classifica). Permette di disegnare un grafico reale dell'andamento nel tempo.
create table if not exists leaderboard_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  score       numeric(14, 2) not null default 0,
  shared_at   timestamptz not null default now()
);

create index if not exists idx_leaderboard_history_user on leaderboard_history(user_id, shared_at);

-- Recensioni: commenti liberi di un utente su una entry condivisa da un altro
create table if not exists leaderboard_reviews (
  id          uuid primary key default gen_random_uuid(),
  entry_user_id uuid not null references users(id) on delete cascade,
  author_id   uuid not null references users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_leaderboard_reviews_entry on leaderboard_reviews(entry_user_id, created_at desc);
