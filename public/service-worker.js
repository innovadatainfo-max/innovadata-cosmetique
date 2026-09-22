// ============================================================================
// InnovaData Cosmétique - Service Worker
// Stratégie : App Shell caché (offline-first pour l'UI),
// réseau prioritaire pour les données Supabase (jamais mises en cache).
// ============================================================================

const CACHE_VERSION = "innovadata-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Installation : on pré-cache l'app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Stratégie de fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne jamais intercepter les appels API Supabase : toujours réseau direct
  if (url.hostname.endsWith("supabase.co")) {
    return;
  }

  // Navigation (changement de page SPA) : réseau d'abord, fallback cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Assets statiques : cache d'abord, puis réseau (et mise à jour du cache)
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// Notifications push (optionnel : ex. "Votre commande est en cours de livraison")
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "InnovaData", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: data.url ? { url: data.url } : {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
