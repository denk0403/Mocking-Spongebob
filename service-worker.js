// Use a cacheName for cache versioning
const cacheName = "mockSpongebob-v2";

// Assets to be used for offline availability
const staticAssets = [
  "./background.JPG",
  "./img/icon.png",
  "./img/icon-144.png",
  "./meme.css",
  "./meme.html",
  "./meme.js",
];

// During the installation phase, you'll usually want to cache static assets.
self.addEventListener("install", async (e) => {
  // Once the service worker is installed, go ahead and fetch the resources to make this work offline.
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});

// Allow service worker to control current page on next load
self.addEventListener("activate", async (e) => {
  await self.clients.claim();
});

// Intercepts when the browser fetches a URL to check cache
self.addEventListener("fetch", async (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
  } else {
    e.respondWith(networkAndCache(req));
  }
});

// Returns a match from the cache first, only making a network request if necessary
async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}

// Makes the network request immediately if possible,
// and saves the result in cache for future offline use
async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached;
  }
}
