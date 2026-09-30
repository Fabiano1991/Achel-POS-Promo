// Verhoog deze versie bij elke release waarin gecachete bestanden wijzigen
// (bv. na het vervangen van een afbeelding), anders houden geïnstalleerde
// PWA's de oude versie vast.
const CACHE_VERSION = "v6-offline";
const CACHE_NAME = `achel-pos-cache-${CACHE_VERSION}`;

// Externe bibliotheken (Supabase, Excel, PDF, grafieken, zip) krijgen een
// eigen cache die NIET gewist wordt bij een nieuwe app-versie: ze zijn groot
// en veranderen zelden.
const LIB_CACHE_NAME = "achel-pos-libs-v1";

// Kleine, essentiële bestanden: moeten allemaal succesvol gecachet worden
// voordat de installatie als geslaagd geldt. Houd deze lijst klein en licht -
// als één bestand hier faalt, faalt de hele installatie.
const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.js",
  "./admin.js",
  "./wholesale.js",
  "./event-overzicht.js",
  "./achel-icon-192.png",
  "./achel-icon-512.png"
];

// Alle andere schermen en afbeeldingen: best effort, zodat een trage of
// mislukte download van één bestand de rest niet blokkeert.
const OPTIONAL_FILES = [
  "./achel-kluis-home.jpg",
  "./achel-logo.png",
  "./achel-header-logo.png",
  "./achel-glas.png",
  "./achel-logo-print.png",
  "./b2b.css",
  "./b2b/index.html",
  "./b2b/b2b.css",
  "./b2b/b2b.js",
  "./b2b/admin.html",
  "./b2b/admin-dag-bewerken.html",
  "./b2b/admin-quota.html",
  "./b2b/bewerken.html",
  "./b2b/dagen.html",
  "./b2b/inschrijven.html",
  "./b2b/mijn-inschrijvingen.html",
  "./b2b/opvolging.html",
  "./b2b/opvolging-bewerken.html",
  "./beurzen/index.html",
  "./beurzen/beurzen.css",
  "./beurzen/beurzen.js",
  "./onkosten/index.html",
  "./onkosten/onkosten.css",
  "./onkosten/onkosten.js",
  "./onkosten/onkosten-template.xlsx",
  "./toegang/index.html"
];

const LIB_FILES = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"
];

const LIB_HOSTS = ["cdn.jsdelivr.net", "cdn.sheetjs.com"];

// Bij slecht internet niet eindeloos wachten op de server: na deze tijd
// wordt de bewaarde versie getoond (de download loopt op de achtergrond
// verder en vervangt de bewaarde versie voor de volgende keer).
const NETWORK_TIMEOUT_MS = 4000;

/* ============================================================
   INSTALL
============================================================ */

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_FILES);
      await Promise.allSettled(
        OPTIONAL_FILES.map((url) => cache.add(url))
      );

      const libCache = await caches.open(LIB_CACHE_NAME);
      await Promise.allSettled(
        LIB_FILES.map(async (url) => {
          if (!(await libCache.match(url))) {
            await libCache.add(new Request(url, { mode: "cors" }));
          }
        })
      );
    })()
  );

  self.skipWaiting();
});

/* ============================================================
   ACTIVATE
============================================================ */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME && name !== LIB_CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ============================================================
   FETCH

   HTML, JavaScript, CSS en JSON van de app:
   eerst de nieuwste online versie proberen. Bij geen internet,
   of als het langer dan NETWORK_TIMEOUT_MS duurt, de bewaarde versie.

   Afbeeldingen en externe bibliotheken:
   onmiddellijk uit de bewaarde versie, op de achtergrond bijwerken.

   Gegevens van Supabase worden hier NIET behandeld: dat doet
   offline.js in de pagina zelf (wachtrij + laatst bekende gegevens).
============================================================ */

function putInCache(cacheName, request, response) {
  if (!response || !(response.ok || response.type === "opaque")) {
    return Promise.resolve();
  }
  const copy = response.clone();
  return caches.open(cacheName).then((cache) => cache.put(request, copy));
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  /* ---------- Externe bibliotheken (CDN) ---------- */
  if (!isSameOrigin) {
    if (!LIB_HOSTS.includes(requestUrl.hostname)) {
      return;
    }

    event.respondWith(
      caches.open(LIB_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request, { ignoreVary: true });
        const network = fetch(event.request)
          .then((response) => {
            if (response && (response.ok || response.type === "opaque")) {
              cache.put(event.request, response.clone());
            }
            return response;
          });

        if (cached) {
          event.waitUntil(network.catch(() => null));
          return cached;
        }
        return network;
      })
    );
    return;
  }

  /* ---------- Eigen app-bestanden ---------- */
  const pathname = requestUrl.pathname.toLowerCase();

  const needsFreshVersion =
    event.request.mode === "navigate" ||
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    pathname.endsWith(".html") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".json");

  if (needsFreshVersion) {
    // "no-cache" = altijd bij de server checken of er een nieuwere
    // versie is, maar als het bestand niet gewijzigd is krijgen we een
    // piepklein "niet gewijzigd"-antwoord i.p.v. alles opnieuw te
    // downloaden.
    const network = fetch(event.request, { cache: "no-cache" }).then(
      (response) => {
        if (response && response.ok) {
          event.waitUntil(putInCache(CACHE_NAME, event.request, response));
        }
        return response;
      }
    );

    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(event.request, {
          ignoreSearch: event.request.mode === "navigate"
        });

        try {
          // Alleen een tijdslimiet als er een bewaarde versie is om op
          // terug te vallen; anders gewoon op het netwerk wachten.
          return cachedResponse
            ? await withTimeout(network, NETWORK_TIMEOUT_MS)
            : await network;
        } catch (error) {
          event.waitUntil(network.catch(() => null));

          if (cachedResponse) {
            return cachedResponse;
          }

          if (event.request.mode === "navigate") {
            const fallback = await caches.match("./index.html");
            if (fallback) {
              return fallback;
            }
          }

          throw error;
        }
      })()
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkRequest = fetch(event.request).then((response) => {
        if (response && response.ok) {
          event.waitUntil(putInCache(CACHE_NAME, event.request, response));
        }

        return response;
      });

      if (cachedResponse) {
        event.waitUntil(networkRequest.catch(() => null));
        return cachedResponse;
      }

      return networkRequest;
    })
  );
});

/* ============================================================
   OFFLINE WACHTRIJ: pagina's vragen om te synchroniseren
   (Background Sync, waar de browser dit ondersteunt - Android/Chrome).
   De eigenlijke verzending gebeurt in offline.js in een open pagina.
============================================================ */

self.addEventListener("sync", (event) => {
  if (event.tag !== "achel-offline-sync") {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        windowClients.forEach((client) =>
          client.postMessage({ type: "achel-offline-sync" })
        );
      })
  );
});

/* ============================================================
   PUSH BERICHT ONTVANGEN
============================================================ */

self.addEventListener("push", (event) => {
  let payload = {
    title: "Achel POS",
    body: "Je hebt een nieuwe melding.",
    target_url: "./"
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload.body = event.data.text();
    }
  }

  const title = payload.title || "Achel POS";

  const options = {
    body: payload.body || "",
    icon: "./achel-icon-192.png",
    badge: "./achel-icon-192.png",
    data: {
      target_url: payload.target_url || "./",
      order_id: payload.order_id || null,
      notification_type: payload.notification_type || null
    },
    tag:
      payload.notification_type && payload.order_id
        ? `${payload.notification_type}-${payload.order_id}`
        : undefined,
    renotify: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ============================================================
   KLIK OP MELDING
============================================================ */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.target_url || "./";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate?.(targetUrl);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
