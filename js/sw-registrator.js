(() => {
  // Check compatibility for the browser we're running this in
  if ("serviceWorker" in navigator) {
    if (navigator.serviceWorker.controller) {
      console.log("[PWA] Service Worker already found, skipping register");
    } else {
      // Register the service worker
      navigator.serviceWorker
        .register("./service-worker.js", { scope: "./" })
        .then(function (reg) {
          console.log("[PWA] Service worker has been registered");
        });
    }
  } else {
    console.log("[PWA] Service workers are not supported");
  }
})();
