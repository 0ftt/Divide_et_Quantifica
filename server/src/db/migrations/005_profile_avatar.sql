-- =============================================================================
-- Profilo utente: immagine avatar (data URL base64, nessuno storage esterno
-- necessario per una demo simulata)
-- =============================================================================

alter table users add column if not exists avatar_data_url text;
