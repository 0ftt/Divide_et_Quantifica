-- =============================================================================
-- Numero di telefono opzionale dell'utente: raccolto (facoltativo) in fase di
-- registrazione e modificabile dal profilo.
-- =============================================================================

alter table users add column if not exists phone text;
