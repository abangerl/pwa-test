const CACHE_NAME = "my-pwa-v2";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "schedule-reminder" || !event.ports[0]) return;

  const responsePort = event.ports[0];
  event.waitUntil((async () => {
    try {
      if (typeof TimestampTrigger !== "function") {
        throw new Error("Notification scheduling is not supported by this browser.");
      }

      const { scheduledAt, readableTime } = event.data;
      if (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now()) {
        throw new Error("Choose a date and time in the future.");
      }

      await self.registration.showNotification("Scheduled reminder", {
        body: `This reminder was scheduled for ${readableTime}.`,
        showTrigger: new TimestampTrigger(scheduledAt),
        tag: "scheduled-reminder"
      });
      responsePort.postMessage({ ok: true });
    } catch (error) {
      responsePort.postMessage({
        ok: false,
        error: error instanceof Error
          ? error.message
          : "Could not schedule the reminder."
      });
    } finally {
      responsePort.close();
    }
  })());
});
