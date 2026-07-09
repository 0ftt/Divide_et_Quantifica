-- =============================================================================
-- Sessione singola: versione del token per utente. Ogni login la incrementa,
-- invalidando i token emessi in precedenza (le altre sessioni vengono
-- disconnesse alla richiesta successiva).
-- =============================================================================

alter table users add column if not exists token_version integer not null default 0;
