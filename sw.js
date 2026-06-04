/* PayAlert v2 — Service Worker
   - Network-first: con connessione carica SEMPRE il codice piu' recente
     (cosi' a ogni nuovo push su Git/Vercel la PWA si aggiorna da sola)
   - La cache serve solo da fallback quando sei offline
   - Web Push per i promemoria scadenze
*/
const CACHE = "payalert-v5";              // <-- cambia questo numero a ogni release importante
const SHELL = [
  "/", "/index.html",
  "/assets/styles.css", "/assets/app.js",
  "/manifest.webmanifest",
  "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png",
  "/apple-touch-icon.png", "/favicon-32.png", "/brand-mark.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// la pagina puo' chiedere al SW di attivarsi subito
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // L'API non si cachea mai
  if (url.pathname.startsWith("/api/")) return;

  // Tutto il resto (HTML, app.js, styles.css, icone): NETWORK-FIRST.
  // Provo la rete -> aggiorno la cache -> restituisco.
  // Se sono offline -> uso la cache (o index.html come fallback).
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req).then((cached) =>
        cached || (req.mode === "navigate" ? caches.match("/index.html") : undefined)
      )
    )
  );
});

/* ---------- PUSH ---------- */
self.addEventListener("push", (event) => {
  let data = { title: "PayAlert", body: "Nuovo promemoria" };
  if (event.data) {
    try { data = event.data.json(); }
    catch (e) { data = { title: "PayAlert", body: event.data.text() }; }
  }
  const options = {
    body: data.body || "Nuovo promemoria",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    vibrate: [90, 40, 90],
    data: data.data || { url: "/" },
    tag: (data.data && data.data.paymentId) || "payalert",
    renotify: true,
    actions: [
      { action: "open", title: "Apri" },
      { action: "dismiss", title: "Ignora" }
    ]
  };
  event.waitUntil(self.registration.showNotification(data.title || "PayAlert", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.indexOf(self.location.origin) === 0 && "focus" in c) {
          c.focus(); if (c.navigate) c.navigate(url); return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
