-- Storico delle modifiche al listino asset (aggiunte/rimozioni) fatte dagli admin.
-- Serve alla sezione "Storico listino" del pannello di amministrazione.
create table if not exists asset_events (
  id          uuid primary key default gen_random_uuid(),
  ticker      text not null,
  name        text not null default '',
  action      text not null check (action in ('add', 'remove')),
  actor_id    uuid references users(id) on delete set null,
  actor_name  text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_asset_events_created on asset_events(created_at desc);
