# Divide et Quantifica

Dashboard di trading **simulato** a widget: canvas infinito con grafici ECharts,
portafoglio virtuale, credito con ricarica mock (Stripe), licenza Premium e
asset presi da Yahoo Finance. Progetto a scopo d'esame.

## Struttura (monorepo)

```
Divide_et_Quantifica/
├─ frontend/   # App Ionic + Angular (standalone, ECharts)
├─ backend/    # API Node + Express + TypeScript (JWT, Supabase, Yahoo)
└─ shared/     # Tipi TypeScript condivisi tra frontend e backend
```

## Avvio rapido

Prerequisiti: Node.js 18+ e un progetto Supabase.

1. **Backend**
   ```bash
   cd backend
   cp .env.example .env      # inserisci DATABASE_URL (Supabase) e JWT_SECRET
   npm install
   npm run migrate           # crea tabelle + seed 5 azioni
   npm run dev               # http://localhost:3000
   ```
   Il primo utente registrato diventa **admin**.

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start                 # ng serve
   ```

Dalla radice, in alternativa: `npm run dev:backend` e `npm run dev:frontend`
(in due terminali), oppure `npm run install:all` per installare entrambe.

## Sicurezza / Git

- **Non committare mai `.env`** (contiene la password di Supabase e il segreto JWT):
  è gia' escluso da `.gitignore`. Si committa solo `.env.example`.
- `node_modules/`, `.angular/`, `dist/` sono rigenerabili e sono ignorati da Git.

## Note

- La ricarica del credito e' una **simulazione**: nessun pagamento reale.
- I prezzi Yahoo Finance vengono messi in cache su DB (`market_cache`, ~20 min)
  per ridurre le chiamate.
