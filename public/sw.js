// Offline support + instant launches.
// Versioned files (?v=…) are cache-first (they never change). The page itself is served from cache
// immediately and refreshed in the background, so opening the app doesn't wait on the network.
const CACHE = "brainboro-72463e9c94";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(async (c) => {
        await c.addAll(SHELL);
        // Pre-cache the exact app + CSS versions this page uses.
        const html = await (await fetch("index.html", { cache: "no-store" })).text();
        const assets = [...new Set([...html.matchAll(/(?:src|href)="((?:dist\/app\.js|css\/styles\.css)\?v=[\w]+)"/g)].map((m) => m[1]))];
        await c.addAll(assets);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// "Share to BrainBoro" from the phone's share sheet (Android): stash the photo, open Answer.
async function shareTarget(request) {
  const form = await request.formData();
  const file = form.get("image");
  if (file && file.size) {
    const c = await caches.open("brainboro-share");
    await c.put("/shared-image", new Response(file, { headers: { "Content-Type": file.type || "image/jpeg" } }));
  }
  return Response.redirect("./#/answer?shared=1", 303);
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.pathname.endsWith("/share-target")) return e.respondWith(shareTarget(e.request));
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;

  if (url.searchParams.has("v")) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    })));
    return;
  }

  // Stale-while-revalidate for the page and everything else.
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request, { ignoreSearch: e.request.mode === "navigate" });
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        })
        .catch(() => hit || c.match("index.html"));
      return hit || fresh;
    }),
  );
});
