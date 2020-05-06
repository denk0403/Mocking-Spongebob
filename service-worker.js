// Use a cacheName for cache versioning
const cacheName = "mockSpongebob-v2";

// Assets to be used for offline availability
const staticAssets = [
	// Image files
	"./img/background.jpg",
	"./img/icon.png",
	"./img/icon-144.png",
	"./img/apple_app_icon.png",
	"./img/camera-icon.png",
	"./img/camera-trigger.png",
	"./img/camera-flip.png",

	// Display files
	"./css/styles.css",
	"./index.html",

	// JS files
	"./js/controller.js",
	"./js/darkmode.js",
	"./js/sw-registrator.js",
	"./js/camera.js",
	"./js/math.js",
	"./js/sharedWebsiteObj.js",

	// Other
	"./",
	"./manifest.json",
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
	e.respondWith(networkAndCache(req));
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
