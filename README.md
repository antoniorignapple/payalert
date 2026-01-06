# PayAlert 💳

PWA per gestire pagamenti e ricevere notifiche push prima delle scadenze.

## 🚀 Features

- ✅ Aggiungi pagamenti con titolo, data scadenza e importo opzionale
- ✅ Lista pagamenti ordinata per scadenza
- ✅ Badge colorati per stato (scaduto, oggi, 3gg, 7gg)
- ✅ Notifiche push a 7, 3, 1 e 0 giorni dalla scadenza
- ✅ Device ID univoco per ogni dispositivo
- ✅ PWA installabile su iOS/Android/Desktop
- ✅ Design mobile-first responsive

## 🛠️ Stack Tecnologico

- **Frontend**: Vite + React + TailwindCSS
- **PWA**: vite-plugin-pwa
- **Backend**: Supabase (PostgreSQL)
- **API**: Vercel Serverless Functions
- **Push**: Web Push con VAPID
- **Cron**: Vercel Cron Jobs

## 📁 Struttura Progetto

```
payalert/
├── api/                      # Vercel Serverless Functions
│   ├── _supabase.js         # Supabase client helper
│   ├── payments.js          # GET/POST/DELETE payments
│   ├── push/
│   │   └── subscribe.js     # Push subscription endpoint
│   └── cron/
│       └── send-reminders.js # Cron job per notifiche
├── public/
│   ├── sw-push.js           # Service worker push handler
│   └── icon.svg             # App icon
├── src/
│   ├── lib/
│   │   ├── device.js        # Device ID management
│   │   ├── api.js           # API client
│   │   └── push.js          # Push notifications helper
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind + custom styles
├── supabase-schema.sql      # Database schema
├── vite.config.js           # Vite + PWA config
├── tailwind.config.js       # Tailwind config
├── vercel.json              # Vercel cron config
└── package.json
```

## 📋 Setup Step-by-Step

### 1. Clona e installa dipendenze

```bash
git clone <repo-url>
cd payalert
npm install
```

### 2. Setup Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Vai su **SQL Editor** ed esegui il contenuto di `supabase-schema.sql`
3. Vai su **Settings > API** e copia:
   - **Project URL** → sarà `SUPABASE_URL`
   - **service_role key** (sotto "Project API keys") → sarà `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE**: Non esporre MAI la `service_role` key al client!

### 3. Genera chiavi VAPID

Le chiavi VAPID sono necessarie per le notifiche push. Generale con:

```bash
# Installa web-push globalmente
npm install -g web-push

# Genera le chiavi
web-push generate-vapid-keys
```

Output esempio:
```
Public Key: BPxxx...xxx
Private Key: xxx...xxx
```

### 4. Configura variabili d'ambiente

**Locale** - Crea `.env.local`:
```env
VITE_VAPID_PUBLIC_KEY=BPxxx...tua_chiave_pubblica
```

**Vercel** - Vai su Project Settings > Environment Variables:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
VAPID_PUBLIC_KEY=BPxxx...
VAPID_PRIVATE_KEY=xxx...
CRON_SECRET=genera_un_secret_random_qui
```

Per generare un CRON_SECRET sicuro:
```bash
openssl rand -hex 32
```

### 5. Sviluppo locale

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

**Nota**: Le API serverless funzionano solo su Vercel. Per testare localmente puoi usare:
```bash
npm install -g vercel
vercel dev
```

### 6. Deploy su Vercel

```bash
# Login (se non già fatto)
vercel login

# Deploy
vercel

# Deploy in produzione
vercel --prod
```

### 7. Crea icone PWA

L'app include un placeholder SVG. Per una PWA completa, genera icone PNG:

1. Usa [realfavicongenerator.net](https://realfavicongenerator.net/) o simile
2. Carica il tuo logo/icona
3. Scarica e sostituisci i file in `/public`:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `apple-touch-icon.png` (180x180)
   - `favicon.ico`

## 🧪 Test End-to-End

### Test 1: Aggiungi pagamento

1. Apri l'app
2. Inserisci titolo: "Test Pagamento"
3. Seleziona data: domani
4. Clicca "Salva"
5. ✅ Il pagamento appare nella lista con badge "1g"

### Test 2: Attiva notifiche

1. Clicca "Attiva notifiche" nell'header
2. Accetta il permesso del browser
3. ✅ Dovrebbe mostrare "Attive" in verde

### Test 3: Test Cron manuale

```bash
# Sostituisci con il tuo URL e secret
curl -X POST "https://tuo-progetto.vercel.app/api/cron/send-reminders?secret=TUO_CRON_SECRET"
```

Risposta attesa:
```json
{
  "success": true,
  "timestamp": "2024-...",
  "results": {
    "checked": 1,
    "sent": 0,
    "skipped": 1,
    "errors": []
  }
}
```

### Test 4: Verifica PWA

1. Apri Chrome DevTools > Application
2. Verifica "Service Workers" attivo
3. Verifica "Manifest" caricato
4. Su mobile, dovrebbe apparire "Aggiungi a Home"

## 🔧 API Reference

### GET /api/payments
```
GET /api/payments?device_id=xxx-xxx
Response: [{ id, device_id, title, due_date, amount_cents, notes, created_at }]
```

### POST /api/payments
```
POST /api/payments
Body: { device_id, title, due_date, amount_cents?, notes? }
Response: { id, ... }
```

### DELETE /api/payments
```
DELETE /api/payments?id=xxx&device_id=xxx
Response: { success: true }
```

### POST /api/push/subscribe
```
POST /api/push/subscribe
Body: { device_id, subscription: PushSubscription }
Response: { success: true, id }
```

### POST /api/cron/send-reminders
```
POST /api/cron/send-reminders
Header: Authorization: Bearer CRON_SECRET
Response: { success, timestamp, results }
```

## ⚠️ Note Importanti

### Limitazioni iOS
- iOS richiede che l'app sia installata come PWA per ricevere push
- Safari supporta Web Push solo da iOS 16.4+
- L'utente deve aggiungere l'app alla Home Screen

### Sicurezza
- La `service_role` key NON deve MAI essere esposta al client
- Il CRON_SECRET protegge l'endpoint cron da chiamate non autorizzate
- Tutto il traffico passa per le API serverless

### Cron Job
- Vercel Cron è disponibile solo nel piano Pro/Enterprise
- In alternativa, usa servizi esterni come:
  - [cron-job.org](https://cron-job.org)
  - [easycron.com](https://easycron.com)
  - GitHub Actions con schedule

## 📄 License

MIT

---

Creato con ❤️ per semplificare la gestione dei pagamenti
