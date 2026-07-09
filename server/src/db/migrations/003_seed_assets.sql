-- =============================================================================
-- Seed: 5 azioni finte per la simulazione.
-- Prezzi plausibili ma statici; in produzione verrebbero aggiornati da Yahoo.
-- "on conflict do nothing" rende il seed idempotente.
-- =============================================================================

insert into assets (ticker, name, currency, last_price, updated_at) values
  ('AAPL', 'Apple Inc.',            'USD', 189.30, now()),
  ('MSFT', 'Microsoft Corp.',       'USD', 420.15, now()),
  ('NVDA', 'NVIDIA Corp.',          'USD', 850.10, now()),
  ('TSLA', 'Tesla Inc.',            'USD', 244.50, now()),
  ('UNH',  'UnitedHealth Group Inc.','USD', 495.20, now())
on conflict (ticker) do nothing;
