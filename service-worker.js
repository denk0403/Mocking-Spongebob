// Use a cacheName for cache versioning
const cacheName = "mockSpongebob-v1.2.2";

// Assets to be used for offline availability
const precachedAssets = [
	// Image files
	"./img/spongebob.jpg",
	"./img/icon.png",
	"./img/icon-144.png",
	"./img/icon-192.png",
	"./img/icon-512.png",
	"./img/apple_app_icon.png",
	"./img/webp/camera-icon.webp",
	"./img/webp/camera-icon-active.webp",
	"./img/webp/camera-trigger.webp",
	"./img/webp/camera-flip.webp",
	"./img/webp/microphoneOff.webp",
	"./img/webp/microphoneOn.webp",

	// Display files
	"./css/styles.css",
	"./index.html",

	// JS files
	"./js/controller.js",
	"./js/sw-registrator.js",
	"./js/camera.js",
	"./js/math.js",
	"./js/webSpeech.js",
	"./js/mockTypes.js",
	"./js/demonstration.js",

	// MathJax
	"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js",

	// Other
	"./",
	"./manifest.json",
];

// During the installation phase, you'll usually want to cache static assets.
self.addEventListener("install", (e) => {
	self.skipWaiting(); // forces this service worker to become the active service worker.

	// delete old cache, then
	// precache updated assets
	const refreshCacheTask = caches
		.keys()
		.then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
		.then(() => caches.open(cacheName))
		.then((cache) => cache.addAll(precachedAssets));

	e.waitUntil(refreshCacheTask);
});

// Allow service worker to control current page on next load
self.addEventListener("activate", (e) => {
	console.log("Activating new service worker");
	e.waitUntil(clients.claim());
});

// Intercepts when the browser fetches a URL to check cache
self.addEventListener("fetch", (e) => e.respondWith(cacheFirst(e.request)));

// Returns a match from the cache first, only making a network request if necessary
async function cacheFirst(req) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(req);
	return cached ?? networkAndCache(cache, req);
}

// Makes the network request immediately if possible,
// and saves the result in cache for future offline use
async function networkAndCache(cache, req) {
	try {
		const fresh = await fetch(req);
		await cache.put(req, fresh.clone()); // must clone before use
		return fresh;
	} catch (e) {
		console.error(e);
		return;
	}
}
