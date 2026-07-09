-- Indirizzo di spedizione dell'utente: serve per recapitare l'accessorio
-- fidelity incluso nella licenza Premium.
alter table users add column if not exists address     text not null default '';
alter table users add column if not exists city        text not null default '';
alter table users add column if not exists postal_code text not null default '';
