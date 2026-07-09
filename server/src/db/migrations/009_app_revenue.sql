-- =============================================================================
-- Credito finanziario dell'app: registro dei ricavi simulati, indipendente dagli
-- utenti (persiste anche se un account viene eliminato). Alimentato dagli
-- acquisti Premium e dall'1% di commissione sulle operazioni di trading.
-- =============================================================================

create table if not exists app_revenue (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('premium', 'fee')),
  amount      numeric(12, 2) not null,
  created_at  timestamptz not null default now()
);
