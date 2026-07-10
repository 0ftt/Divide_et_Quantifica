# 📈 DeQ: Divide et Quantifica

**Divide et Quantifica (DeQ)** è un ecosistema full-stack per l'analisi finanziaria visiva e la simulazione di trading. Sfrutta una *Infinite Canvas* a nodi vettoriali per esplorare dati di mercato in tempo reale, combinata con un terminale broker completo per testare le proprie strategie sul mercato.

---

## 🛠️ Stack Tecnologico

* **Client (Frontend):** Angular 21 (Standalone & Signals) + Ionic 8 + ECharts (Grafici) + Transloco (i18n)
* **Server (Backend):** Node.js + Express 4 (REST API + Smart Caching + JWT Auth)
* **Modulo Condiviso:** Zod (Validazione simmetrica payload Client/Server)
* **Database:** PostgreSQL gestito tramite Supabase (driver `pg`)
* **API Esterne:** Yahoo Finance (Quotazioni live e serie storiche)

---

## Come Avviare il Progetto Localmente

### Prerequisiti
Assicurati di avere installato sul tuo computer:
* [Node.js](https://nodejs.org/) (v18 o superiore)
* Angular CLI e Ionic CLI installati globalmente:
  ```bash
  npm install -g @angular/cli @ionic/cli
1. Clonare il progetto
Apri il terminale e clona la repository sul tuo computer:

```Bash
git clone [https://github.com/0ftt/Divide_et_Quantifica.git](https://github.com/0ftt/Divide_et_Quantifica.git)
cd Divide_et_Quantifica
```

2. Avviare il Server (Backend)
Apri il terminale nella cartella del server e digita:

```Bash
cd server
npm install
npm run dev o npm run start
```

Il server si avvierà in modalità di sviluppo tramite tsx (di default sulla porta configurata nel file .env).

3. Avviare il Client (Frontend)
Apri un nuovo terminale sempre nella cartella principale del progetto e digita:

```Bash
cd client
npm install
ionic serve o ionic serve --external
```

Utilizzare --external permette al frontend di essere accessibile tramite la rete a cui è allacciato il pc. Utile per testare su mobile.
L'applicazione aprirà automaticamente una scheda nel tuo browser (di default su http://localhost:8100 o anche http://localhost:4200).

## 🧪 Account di Test

Al fine di consentire una rapida valutazione del sistema e delle logiche di autorizzazione, il database include i seguenti account pre-configurati:

| Email | Password | Ruolo | Scopo del Test |
| :--- | :--- | :---: | :--- |
| **`admin@gmail.com`** | `admin` | Admin | Account principale. Accesso completo al Pannello Admin per la gestione degli utenti e del listino asset. |
| **`adminriserva@gmail.com`** | `adminriserva` | Admin | Account di backup con privilegi amministrativi elevati. |
| **`carola@gmail.com`** | `carolauser` | Utente | Account standard. Ideale per testare la creazione di workspace sulla canvas, l'acquisto simulato nel Terminale Broker e la pubblicazione nella Leaderboard. |
| **`emanuele@gmail.com`** | `emanueleuser` | Utente | Account standard secondario. Essenziale per testare le interazioni tra utenti (es. scrivere recensioni sulle schede condivise) e la concorrenza. |
| **`daniela@gmail.com`** | `danielauser` | Utente | Ulteriore account standard. Utile per testare il popolamento e l'ordinamento dinamico della Leaderboard simulando un ambiente multi-utente realistico. |
| **`michele@gmail.com`** | `micheleuser` | Utente | Account standard aggiuntivo. Consigliato per testare le transazioni avanzate, l'upgrade alla licenza Premium e l'acquisto in blocco dei portafogli altrui dalla classifica. |
| **`giuseppe@gmail.com`** | `giuseppeuser` | Utente | Account standard. Focalizzato sul test del sistema di linking vettoriale, la creazione di percorsi logici tra widget e l'utilizzo degli aggregatori matematici. |

📊 Schema dei Dati
L'infrastruttura di persistenza è modellata su PostgreSQL. Oltre al link esterno alla board visuale su DrawSQL, di seguito è riportato lo schema logico e relazionale del database.

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

In alternativa è visualizzabile da https://drawsql.app/teams/0ftt/diagrams/deq

Account da testing



🔑 Legenda Relazioni e Vincoli
Propagazione Eliminazioni (ON DELETE CASCADE): Eliminando un utente dalla tabella users, vengono eliminati a cascata i record associati in holdings, transactions, workspaces, leaderboard_entries, leaderboard_history, password_resets e leaderboard_reviews (sia come autore che come utente recensito). L'eliminazione di un asset distrugge le relative holdings.

Mantenimento Storico (ON DELETE SET NULL): Le relazioni verso assets (added_by) e asset_events (actor_id) preservano lo storico di auditing anche qualora l'account amministratore venga rimosso.

Vincoli di Unicità: Sono applicati vincoli univoci su users.email, users.username, sulle posizioni in portafoglio holdings (user_id, ticker), sulla cache market_cache (ticker, timeframe) e sulle strategie condivise leaderboard_entries (user_id, label) per consentire configurazioni di rete multiple per lo stesso utente.

Disaccoppiamento Logico (Senza FK): Tabelle come market_cache, price_history e asset_events referenziano logicamente il ticker tramite stringa di testo senza costrizioni di chiave esterna, garantendo l'integrità dei dati pregressi anche in caso di delisting dell'asset dal database. app_revenue è un'entità del tutto autonoma e append-only per preservare il tracciamento degli incassi storici.
