# My PWA

A minimal, dependency-free progressive web app with an offline app shell and a
best-effort daily local reminder at UTC midnight.

Serve this directory over `localhost` or HTTPS to use the service worker and
install the app. For example, run `npx serve .` from the repository root, then
open the shown local URL in your browser.

Reminders use the experimental Notification Triggers API through the service
worker. They are local notifications, not Web Push, so no backend or push
service is involved. The app schedules the next UTC midnight when opened and
again when a reminder is tapped. Triggers are one-shot, so reminders can stop
if the app is never opened and a notification is ignored. Unsupported browsers
show a large `!?` and do not schedule a fallback timer. Notification permission
and Android notification settings affect delivery. Each notification includes
its scheduled UTC timestamp. Tapping a notification focuses an open app window
or opens the app if none is already open.