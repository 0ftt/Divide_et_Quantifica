# Backend — Divide et Quantifica

Backend Node.js + Express + TypeScript per Divide et Quantifica. Fornisce:

- Autenticazione **JWT con ruoli** (`user` / `admin`) — il primo utente registrato diventa admin.
- **Credito** con ricarica tramite **Stripe MOCKUP** (nessun pagamento reale: il credito viene accreditato direttamente).
- **Licenza Premium** acquistabile scalando 5 € dal credito.
- **Portafoglio simulato** (buy/sell) con ledger delle transazioni.
- **Asset di mercato** immessi dall'admin e validati/prezzati tramite **Yahoo Finance** (con cache ~20 minuti per non superare i limiti).
- Persistenza su **Supabase (Postgres)**.

## Requisiti

- Node.js 18+ (usa la `fetch` nativa per Yahoo Finance)
- Un progetto Supabase

## Configurazione Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un progetto (annota la password del database).
2. Nel progetto: **Project Settings → Database → Connection string → URI**. Copia la stringa (di solito porta `5432` per la connessione diretta, `6543` per il pooling).
3. Nella cartella `backend/`, copia `.env.example` in `.env` e incolla la stringa in `DATABASE_URL` (aggiungi `?sslmode=require` se non presente).
4. Imposta un `JWT_SECRET` lungo e casuale.

## Avvio

```bash
cd backend
npm install
npm run migrate     # crea le tabelle su Supabase (idempotente)
npm run dev         # avvia il backend su http://localhost:3000
```

## Endpoint principali

| Metodo | Path | Ruolo | Descrizione |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | pubblico | Registrazione (primo utente = admin) |
| POST | `/api/auth/login` | pubblico | Login, restituisce il JWT |
| GET | `/api/me` | auth | Profilo (credito, premium, ruolo) |
| GET | `/api/credit` | auth | Saldo credito |
| POST | `/api/credit/recharge` | auth | Ricarica credito (Stripe mock) |
| POST | `/api/premium/purchase` | auth | Acquisto Premium (−5 €) |
| GET | `/api/assets` | auth | Listino asset |
| GET | `/api/assets/search?q=` | admin | Ricerca ticker su Yahoo Finance |
| POST | `/api/assets` | admin | Aggiunge un asset (validato su Yahoo) |
| DELETE | `/api/assets/:ticker` | admin | Rimuove un asset |
| GET | `/api/assets/:ticker/quote` | auth | Quotazione (cache ~20 min) |
| GET | `/api/portfolio` | auth | Portafoglio + valutazione |
| POST | `/api/portfolio/buy` | auth | Acquisto simulato |
| POST | `/api/portfolio/sell` | auth | Vendita simulata |

Tutte le richieste autenticate richiedono l'header `Authorization: Bearer <token>`.

> Nota: la ricarica credito e' una **simulazione** a scopo d'esame — non viene effettuato alcun pagamento reale.
