# PayAlert v2 — Promemoria scadenze pagamenti

PWA per iOS/Android e desktop che ti ricorda le scadenze dei pagamenti.
Tema **dark & oro**, drawer dei mesi apribile a sinistra con lo **swipe del dito**
(con snap automatico), all'avvio si apre sul **mese corrente**, notifiche push
incluse. Nessun login: ogni dispositivo ha il suo identificativo.

Questa versione è una **PWA statica senza build**: niente `npm install`, niente
bundler. Si pubblica così com'è. Il backend resta su Vercel Serverless + Supabase.

---

## Cosa contiene

```
index.html                 markup dell'app (PWA, safe-area iOS, font)
assets/styles.css          tema dark+oro, drawer, sheet, safe-area-inset
assets/app.js              tutta la logica (vanilla JS, nessuna dipendenza)
sw.js                      service worker: offline app-shell + push
manifest.webmanifest       manifest PWA (tema scuro, icone)
icon-192.png / icon-512.png / apple-touch-icon.png / favicon.ico
api/                       Vercel Serverless Functions
  payments.js              GET/POST/PUT/DELETE pagamenti
  push/subscribe.js        registra l'iscrizione push del dispositivo
  push/test.js             invia una notifica di prova
  cron/send-reminders.js   cron: promemoria 7/3/1 giorni prima + il giorno stesso
  _supabase.js             client Supabase (service role)
supabase-schema.sql        schema DB (idempotente)
vercel.json                cron + header di caching
```

---

## 1) Database (Supabase)

1. Crea un progetto su Supabase.
2. Apri **SQL Editor** e incolla tutto `supabase-schema.sql`, poi esegui.
   Lo script è **idempotente**: si può rilanciare su un DB esistente senza
   perdere dati (aggiunge la colonna `is_paid` se manca, aggiorna i vincoli e
   le policy).
3. Da **Project Settings → API** copia:
   - `Project URL` → variabile `SUPABASE_URL`
   - `service_role` key → variabile `SUPABASE_SERVICE_ROLE_KEY`

> La `service_role` key è segreta: vive solo lato server (le funzioni in `api/`),
> mai nel client.

---

## 2) Chiavi push (VAPID)

Servono per le notifiche Web Push. Genera una coppia di chiavi VAPID:

```bash
npx web-push generate-vapid-keys
```

Otterrai una **public key** e una **private key**.
La public key va messa anche nel client: in `assets/app.js`, costante
`VAPID_PUBLIC_KEY` (in alto nel file). Verifica che corrisponda a quella che
imposti nelle variabili d'ambiente.

---

## 3) Variabili d'ambiente (Vercel)

In **Vercel → Project → Settings → Environment Variables** imposta:

| Variabile                   | Valore                                            |
|-----------------------------|---------------------------------------------------|
| `SUPABASE_URL`              | URL del progetto Supabase                         |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key di Supabase                      |
| `VAPID_PUBLIC_KEY`          | chiave pubblica VAPID                             |
| `VAPID_PRIVATE_KEY`         | chiave privata VAPID                              |
| `CRON_SECRET`               | una stringa segreta a tua scelta (protegge i cron)|

> Il `CRON_SECRET` deve combaciare con quello atteso dalla funzione cron:
> Vercel chiama l'endpoint cron passando l'header di autorizzazione, e la
> funzione rifiuta le chiamate senza il segreto corretto.

---

## 4) Deploy su Vercel

Essendo statica **non serve build**:

- Framework Preset: **Other**
- Build Command: *(vuoto)*
- Output Directory: *(vuoto / root)*

Collega il repo (o trascina la cartella) e fai **Deploy**. Vercel servirà
`index.html` dalla root e le funzioni dalla cartella `api/`.

I cron sono già definiti in `vercel.json`:

- **19:00** ogni giorno → promemoria a **7 / 3 / 1 giorni** dalla scadenza
- **08:00** ogni giorno → promemoria del **giorno stesso** (d0)

(Gli orari sono in UTC: regolali se vuoi un fuso diverso.)

---

## 5) Installazione su iPhone (PWA)

1. Apri il sito pubblicato in **Safari**.
2. Tocca **Condividi** → **Aggiungi a Home**.
3. Apri l'app dall'icona in Home (parte a tutto schermo).
4. Vai in **Impostazioni** dentro l'app → **Attiva notifiche** e concedi il
   permesso. Su iOS le notifiche push funzionano **solo** se l'app è stata
   aggiunta alla Home (non dalla scheda Safari).

L'interfaccia rispetta le **safe-area** di iOS (notch / Dynamic Island / barra
di stato in alto e home indicator in basso): i contenuti non finiscono mai sotto
la batteria o la tacca.

---

## Uso

- **Drawer dei mesi**: trascina dal bordo sinistro verso destra (oppure tocca
  l'icona ☰). Si chiude con lo swipe inverso o toccando fuori; fa **snap** da
  solo. Nel drawer scegli il mese e cambi anno con le frecce.
- **Aggiungi pagamento**: pulsante **+** in basso a destra.
- **Modifica**: tocca una scheda. **Elimina**: swipe verso sinistra sulla
  scheda (oppure dal foglio di modifica).
- **Segna come pagato**: tocca il cerchio sulla scheda. La barra in alto mostra
  il totale da pagare e i progressi del mese.
- **Filtri**: Tutti / Da pagare / Pagati.

---

## Note tecniche

- Nessun build step: HTML/CSS/JS serviti statici. `vercel.json` imposta
  `Service-Worker-Allowed: /` e disabilita la cache su `sw.js`, `index.html` e
  `/assets` (i file non hanno hash nel nome, quindi niente cache immutabile).
- Importi salvati in centesimi; formattazione `it-IT` in EUR.
- Identificativo dispositivo in `localStorage` (`payalert_device_id`): nessun
  account, i dati sono legati al dispositivo.
- Per cambiare la grafica del logo più avanti basta sostituire i file
  `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` e `favicon.ico`.

## Anteprima

`PayAlert-v2-anteprima.html` (fornito a parte) è una versione dimostrativa
autonoma con dati finti in memoria: si apre in qualsiasi browser per vedere
l'interfaccia, senza backend e senza notifiche reali.
