-- =============================================================================
-- Username pubblico (handle) dell'utente: scelto in iscrizione e modificabile
-- dal profilo, mostrato agli altri utenti. Nullable per gli account gia'
-- esistenti (potranno impostarlo dal profilo). Unicita' case-insensitive.
-- =============================================================================

alter table users add column if not exists username text;

create unique index if not exists users_username_lower_key
  on users (lower(username))
  where username is not null;
