"use strict";
{
	// Check compatibility for the browser we're running this in
	if ("serviceWorker" in navigator) {
		if (navigator.serviceWorker.controller) {
			console.log("[PWA] Service worker already found, skipping register");
		} else {
			// Register the service worker
			// The browser will try to fetch a new service worker on every load
			navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).then(() => {
				console.log("[PWA] Service worker has been registered");
			});
		}
	} else {
		console.log("[PWA] Service workers are not supported");
	}
}
