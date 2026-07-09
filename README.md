# Divide_et_Quantifica
Divide et Quantifica (DeQ) è un ecosistema full-stack per l'analisi finanziaria visiva e la simulazione di trading. Sfrutta una Infinite Canvas a nodi vettoriali per esplorare dati di mercato in tempo reale, combinata con un terminale broker completo.

```mermaid
erDiagram
    users ||--o{ holdings : possiede
    users ||--o{ transactions : registra
    users ||--o{ workspaces : salva
    users ||--o{ leaderboard_entries : condivide
    users ||--o{ leaderboard_history : storicizza
    users ||--o{ password_resets : richiede
    users ||--o{ leaderboard_reviews : "recensito (entry_user_id)"
    users ||--o{ leaderboard_reviews : "autore (author_id)"
    users |o--o{ assets : "added_by"
    users |o--o{ asset_events : "actor_id"
    assets ||--o{ holdings : quotato_in

    users {
        uuid id PK
        text email UK
        text username UK
        text password_hash
        text display_name
        text role "user|admin"
        numeric credit
        boolean is_premium
        text avatar_data_url
        text phone
        text address
        text city
        text postal_code
        int token_version
        float current_roi
        timestamptz created_at
    }

    assets {
        text ticker PK
        text name
        text currency
        numeric last_price
        timestamptz updated_at
        uuid added_by FK
    }

    holdings {
        uuid id PK
        uuid user_id FK
        text ticker FK
        numeric quantity
        numeric avg_price
    }

    transactions {
        uuid id PK
        uuid user_id FK
        text type "recharge|premium|buy|sell"
        text ticker
        numeric quantity
        numeric amount
        text note
        timestamptz created_at
    }

    workspaces {
        uuid id PK
        uuid user_id FK
        text name
        float camera_x
        float camera_y
        float camera_zoom
        jsonb widget
        timestamptz updated_at
    }

    leaderboard_entries {
        uuid id PK
        uuid user_id FK
        text label
        text display_name
        numeric score
        timestamptz shared_at
    }

    leaderboard_history {
        uuid id PK
        uuid user_id FK
        numeric score
        timestamptz shared_at
    }

    leaderboard_reviews {
        uuid id PK
        uuid entry_user_id FK
        uuid author_id FK
        text body
        timestamptz created_at
    }

    password_resets {
        uuid id PK
        uuid user_id FK
        text token_hash
        timestamptz expires_at
        boolean used
        timestamptz created_at
    }

    asset_events {
        uuid id PK
        text ticker
        text name
        text action "add|remove"
        uuid actor_id FK
        text actor_name
        timestamptz created_at
    }

    app_revenue {
        uuid id PK
        text kind "premium|fee"
        numeric amount
        timestamptz created_at
    }

    market_cache {
        uuid id PK
        text ticker
        text timeframe
        jsonb data
        timestamptz last_fetched
    }

    price_history {
        uuid id PK
        text ticker
        numeric price
        timestamptz recorded_at
    }
```
    
Legenda relazioni (chiavi esterne)

users → holdings / transactions / workspaces / leaderboard_entries / leaderboard_history / password_resets: ON DELETE CASCADE (eliminando l'utente si eliminano i suoi dati).

users → leaderboard_reviews: due FK — entry_user_id (utente recensito) e author_id (utente autore), entrambe CASCADE.

users → assets (added_by) / asset_events (actor_id): ON DELETE SET NULL (lo storico resta anche se l'admin viene eliminato).

assets → holdings (ticker): CASCADE.

Vincoli di unicità: users.email, users.username; holdings (user_id, ticker); market_cache (ticker, timeframe); leaderboard_entries (user_id, label) → è ciò che consente più schede per profilo.

Note (relazioni "logiche" senza FK)

Alcune tabelle referenziano un asset per stringa ticker senza vincolo FK (così restano valide anche per ticker non più nel listino):

market_cache, price_history, asset_events, e il campo transactions.ticker → puntano logicamente ad assets.ticker.

app_revenue è indipendente (nessuna FK): persiste anche dopo l'eliminazione di utenti/asset.

Tabelle standalone / append-only: app_revenue, price_history, leaderboard_history, asset_events, market_cache.
