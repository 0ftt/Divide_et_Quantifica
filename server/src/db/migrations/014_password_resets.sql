-- Token di recupero password: si salva solo l'hash del token (il valore in
-- chiaro va solo nel link via email), con scadenza e flag "usato".
create table if not exists password_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_password_resets_hash on password_resets(token_hash);
