const CACHE_NAME = "my-pwa-v4";
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
  if (event.data?.type !== "schedule-midnight") return;

  const responsePort = event.ports[0];
  event.waitUntil((async () => {
    try {
      const readableTime = await scheduleNextMidnight();
      responsePort?.postMessage({ ok: true, readableTime });
    } catch (error) {
      responsePort?.postMessage({
        ok: false,
        error: error instanceof Error
          ? error.message
          : "Could not schedule the reminder."
      });
    } finally {
      responsePort?.close();
    }
  })());
});

async function scheduleNextMidnight() {
  if (typeof TimestampTrigger !== "function") {
    throw new Error("Notification scheduling is not supported by this browser.");
  }
  if (Notification.permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const now = new Date();
  const scheduledAt = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  const readableTime = `${new Date(scheduledAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  })} UTC`;

  await self.registration.showNotification("Daily reminder", {
    body: `Scheduled for ${readableTime}.`,
    showTrigger: new TimestampTrigger(scheduledAt),
    tag: "scheduled-reminder"
  });

  return readableTime;
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const scopeUrl = new URL(self.registration.scope);
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });
    const appWindow = windows.find((client) => {
      const clientUrl = new URL(client.url);
      return clientUrl.origin === scopeUrl.origin &&
        clientUrl.pathname.startsWith(scopeUrl.pathname);
    });

    let targetWindow = appWindow;
    if (targetWindow) {
      await targetWindow.focus();
    } else {
      targetWindow = await self.clients.openWindow(scopeUrl.href);
    }

    try {
      await scheduleNextMidnight();
    } catch (error) {
      if (targetWindow) {
        targetWindow.postMessage({
          type: "reminder-scheduling-error",
          error: error instanceof Error
            ? error.message
            : "Could not schedule the next reminder."
        });
      } else {
        console.error(error);
      }
    }
  })());
});
