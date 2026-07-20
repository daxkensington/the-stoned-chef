/**
 * Service Worker — Lightweight offline-first caching strategy
 * 
 * Strategy:
 * - Static assets (JS, CSS, images, fonts): Cache-first with network fallback
 * - API calls: Network-first with cache fallback
 * - Navigation: Network-first, serve offline page on failure
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const PRECACHE_URLS = ["/", "/offline"];

// ─── Install ────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Deliberately not cache.addAll: it rejects atomically, so ONE missing
      // URL aborts the whole install and nothing is cached at all. "/offline"
      // does not exist on every site that shares this worker, which silently
      // disabled precaching entirely. Cache each entry independently.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[sw] precache skipped", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Activate — clean old caches ────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API routes, tRPC, auth, and external URLs
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|avif|svg|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Navigation: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }
});


// ─── Push Notifications ────────────────────────────────────────────
// There was no push handler here, so a delivered notification woke the worker,
// found nothing listening, and displayed nothing — silently defeating any
// push the server sent.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch { data = { title: "Notification", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/badge-72.png",
      // Per-message tag from the sender; a constant would make every alert
      // replace the previous one.
      tag: data.tag || "app-notification",
      renotify: true,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Resolve relative payload URLs against the origin, or the open-tab
  // comparison below never matches and every click spawns a new window.
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === target && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
