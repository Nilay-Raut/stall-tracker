// Stall Tracker service worker.
// This is a template: after each build, scripts/prepare-standalone.mjs fills in the
// build id and the list of built files below, and writes the result to public/sw.js.
//
// What it does:
// 1. Keeps the app's own built files (JavaScript, CSS, fonts) on the phone, so every
//    screen can open without a network. These files hold no personal data.
// 2. Keeps a copy of each page the user opens (network first, copy used offline), so
//    the installed app opens even in airplane mode. Pages can hold shop data: the copies
//    are deleted at logout and replaced on every visit with signal.
// 3. Shows the closing-time reminder (push notification) and opens Close day on tap.
// API calls are never stored or answered here.

const BUILD_ID = "__BUILD_ID__";
const PRECACHE = __PRECACHE__;
const STATIC_CACHE = `static-${BUILD_ID}`;
const PAGE_CACHE = `pages-${BUILD_ID}`;
const MAX_PAGES = 25;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE);
      await self.skipWaiting(); // a new version takes over straight away
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove files and pages from older versions so storage never grows.
      const keep = [STATIC_CACHE, PAGE_CACHE];
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => /^(static|pages)-/.test(name) && !keep.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(fromCacheFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(request));
  }
});

async function fromCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/** Fresh page when online (and keep a copy); the last copy when offline. */
async function pageNetworkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) {
      await storePage(cache, request, response.clone());
    }
    return response;
  } catch (error) {
    const copy =
      (await cache.match(request)) ??
      // The add and close screens read ?date= and ?id= in the browser, so any copy works.
      (await cache.match(request, { ignoreSearch: true })) ??
      (await cache.match("/"));
    if (copy) return copy;
    throw error;
  }
}

async function storePage(cache, request, response) {
  await cache.put(request, response);
  const keys = await cache.keys();
  for (const old of keys.slice(0, Math.max(keys.length - MAX_PAGES, 0))) {
    await cache.delete(old); // oldest first
  }
}

// The app asks for its plain screens to be stored once the user is logged in.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "store-pages" || !Array.isArray(event.data.paths)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      for (const path of event.data.paths) {
        if (typeof path !== "string" || !path.startsWith("/")) continue;
        try {
          const response = await fetch(path, { credentials: "same-origin" });
          // A redirect means "not logged in": never store the login page under this address.
          if (response.ok && !response.redirected) {
            await storePage(cache, new Request(path), response);
          }
        } catch {
          // Offline right now: the page is stored on the next visit instead.
        }
      }
    })(),
  );
});

// ---------- Closing-time reminder ----------

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Not JSON: show the default text.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Time to close the day", {
      body: data.body || "Count the drawer and close the day in Stall Tracker.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "closing-reminder", // a newer reminder replaces an older one
      data: { url: data.url || "/close/today" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        return open.navigate(target);
      }
      return self.clients.openWindow(target);
    })(),
  );
});
