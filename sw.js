// Offline shell + push. Only static app files are precached; Supabase/API calls and any user data are never cached.
const CACHE = "nv-shell-v3";
const SHELL = ["index.html", "css/global.css", "css/news.css", "js/app.js", "js/auth.js", "js/site.js", "js/news.js", "js/home.js", "js/supabase.js", "icons/icon.svg"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || "NEWSVERSE", { body: d.body || "", icon: "icons/icon.svg", badge: "icons/icon.svg", image: d.image || undefined, data: { url: d.url || "notifications.html" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  let u; try { u = new URL((e.notification.data && e.notification.data.url) || "index.html", self.registration.scope); } catch (_) { u = new URL("index.html", self.registration.scope); }
  if (!(u.origin === location.origin || u.protocol === "https:")) u = new URL("index.html", self.registration.scope);
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => { for (const c of l) if (c.url === u.href && "focus" in c) return c.focus(); return clients.openWindow(u.href); }));
});
