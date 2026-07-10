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
  ```

### 1. Clonare il progetto
Apri il terminale e clona la repository sul tuo computer:

```Bash
git clone [https://github.com/0ftt/Divide_et_Quantifica.git](https://github.com/0ftt/Divide_et_Quantifica.git)
cd Divide_et_Quantifica
```

### 2. Configurare le chiavi (file `.env`)
Per motivi di sicurezza il file `server/.env` **non è incluso** nel repository: contiene password e chiavi private che non vanno condivise. Prima di avviare il backend devi quindi crearne uno tuo nella cartella `server/`, partendo dal modello `.env.example`:

```bash
cd server
cp .env.example .env      # su Windows PowerShell: Copy-Item .env.example .env
```

Poi apri `.env` e inserisci le tue chiavi. Le tre da procurarsi sono:

| Variabile | Obbligatoria | Come procurarsela |
| :--- | :---: | :--- |
| `DATABASE_URL` | Sì | Stringa di connessione a un database PostgreSQL. Crea un progetto gratuito su [Supabase](https://supabase.com) e copia la connection string da *Project Settings → Database* (deve includere `?sslmode=require`). |
| `JWT_SECRET` | Sì | Stringa casuale lunga per firmare i token di accesso. Generala tu, ad es. con `openssl rand -hex 32` oppure `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `MAIL_USER` / `MAIL_PASS` / `MAIL_FROM` | No | Credenziali Gmail per l'invio delle email di recupero password. `MAIL_USER` è l'indirizzo Gmail; `MAIL_PASS` **non** è la password normale ma una *App Password* di 16 caratteri: prima attiva la **verifica in due passaggi** sull'account Google, poi generala da *Account Google → Sicurezza → Password per le app*. `MAIL_FROM` è il mittente mostrato (di solito lo stesso indirizzo). Senza queste, l'app funziona comunque: solo l'invio email resta disattivato. |

Le altre variabili (`PORT`, `CORS_ORIGIN`, `PREMIUM_PRICE`, `QUOTE_CACHE_MINUTES`, `JWT_EXPIRES_IN`, `FRONTEND_URL`) hanno già un valore di default.

### 3. Creare le tabelle del database (migrazioni)
Un database Supabase appena creato è **vuoto**: le tabelle non si creano da sole all'avvio del server. La prima volta (o dopo aver cambiato database) vanno quindi eseguite le migrazioni:

```bash
cd server
npm install
npm run migrate
```

Il comando applica in ordine tutti gli script SQL in `server/src/db/migrations/` (sono idempotenti: usano `CREATE TABLE IF NOT EXISTS`, quindi si possono rilanciare senza problemi) e crea l'intero schema, inserendo anche alcune azioni di default nel listino.

> **Nota:** su un database nuovo non esistono gli account di test elencati sotto. Il **primo utente che si registra diventa automaticamente admin**; gli altri sono utenti standard.

### 4. Avviare il Server (Backend)
Sempre nella cartella `server/`:

```bash
npm run dev      # sviluppo con tsx (ricarica automatica)
# oppure
npm run build && npm run start   # build + avvio della versione compilata
```

Il server si avvierà sulla porta configurata nel file `.env` (default `3000`).

### 5. Avviare il Client (Frontend)
Apri un nuovo terminale sempre nella cartella principale del progetto e digita:

```Bash
cd client
npm install
npm fund
npm audit fix
ionic serve o ionic serve --external
```

Usare `--external` (oppure `ng serve --host 0.0.0.0`) rende il frontend raggiungibile dalla rete a cui è collegato il PC: utile per testare da mobile.

L'applicazione si apre automaticamente nel browser su `http://localhost:8100` (o `http://localhost:4200`). **Per accedere da un altro dispositivo** (es. il telefono, sulla stessa rete Wi-Fi) usa l'indirizzo **IPv4 indicato nella console all'avvio del client**: all'avvio, `ionic serve` / `ng serve` elenca gli URL di rete (voce *Network* / *On Your Network*). Se il PC ha più schede di rete ne compaiono **due — una per l'ethernet e una per il wireless**: usa quella dell'interfaccia collegata alla stessa rete del dispositivo (di solito il wireless), ad esempio `http://192.168.1.58:8100`.

> Il backend non richiede alcuna configurazione dell'IP: il frontend deriva in automatico l'indirizzo dell'API dall'host da cui viene aperto.

## 🧪 Account di Test

Al fine di consentire una rapida valutazione del sistema e delle logiche di autorizzazione, il database include i seguenti account pre-configurati:

| Email | Password | Ruolo | Scopo del Test |
| :--- | :--- | :---: | :--- |
| **`admin@gmail.com`** | `adminadmin` | Admin | Account principale. Accesso completo al Pannello Admin per la gestione degli utenti e del listino asset. |
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
