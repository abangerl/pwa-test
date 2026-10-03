# My PWA

A minimal, dependency-free progressive web app with an offline app shell and a
single scheduled local reminder.

Serve this directory over `localhost` or HTTPS to use the service worker and
install the app. For example, run `npx serve .` from the repository root, then
open the shown local URL in your browser.

Scheduled reminders use the experimental Notification Triggers API through the
service worker. They are local notifications, not Web Push, so no backend or
push service is involved. Browser support is limited; unsupported browsers show
an explanation and do not schedule a fallback timer. The browser must allow
notifications, and Android notification settings may affect delivery. The
scheduled notification includes its local date and time for testing.
Tapping a notification focuses an open app window or opens the app if none is
already open.