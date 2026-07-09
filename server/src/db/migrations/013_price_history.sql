-- Storico append-only dei prezzi degli asset: a ogni aggiornamento automatico
-- (scheduler) viene registrato il prezzo corrente, cosi' resta traccia nel tempo
-- (a differenza di market_cache, che e' una cache sovrascritta).
create table if not exists price_history (
  id           uuid primary key default gen_random_uuid(),
  ticker       text not null,
  price        numeric(14, 4) not null,
  recorded_at  timestamptz not null default now()
);

create index if not exists idx_price_history_ticker on price_history(ticker, recorded_at desc);
