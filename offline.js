/* ============================================================
   ACHEL POS - OFFLINE LAAG
   ------------------------------------------------------------
   Dit bestand zorgt ervoor dat de app blijft werken bij slecht
   of geen internet. Het moet geladen worden NA de Supabase-
   bibliotheek en VOOR de eigen app-scripts van een pagina.

   Wat het doet:
   1. LEZEN   - Alles wat de app uit Supabase ophaalt (klanten,
                artikelen, voorraad, bestellingen...) wordt op het
                toestel bewaard. Zonder internet (of als het te
                traag gaat) krijgt de app de laatst bewaarde versie.
   2. OPSLAAN - Wat je zonder internet bewaart (bestelling,
                inschrijving, onkost, e-mail...) komt in een
                wachtrij op het toestel. De app krijgt meteen
                "gelukt" terug, zodat je gewoon verder kunt.
   3. SYNC    - Zodra er weer internet is, wordt de wachtrij in
                de juiste volgorde automatisch doorgestuurd.
   4. STATUS  - Een klein balkje bovenaan toont of je offline
                bent en hoeveel acties nog wachten. Tik erop voor
                de details.

   De bestaande app-code hoeft hiervoor (bijna) niet aangepast
   te worden: deze laag zit tussen de app en Supabase in.
============================================================ */

(function () {
  "use strict";

  if (window.__achelOffline) {
    return;
  }

  /* ============================================================
     INSTELLINGEN
  ============================================================ */

  // Tabellen waarvan het id een UUID is. Bij een nieuwe rij maakt de
  // app zelf al het id aan, zodat een bestelling offline meteen een
  // vast nummer heeft en nooit dubbel kan worden opgeslagen.
  const UUID_TABLES = [
    "b2b_days", "b2b_followups", "b2b_quotas", "b2b_registrations",
    "event_delivery_proofs", "event_material_returns", "expenses",
    "fair_contacts", "fair_order_items", "fair_orders",
    "free_beer_registrations", "orders", "push_subscriptions",
    "wholesale_order_proofs", "wholesale_orders"
  ];

  // Serverfuncties die een nieuw id teruggeven. Offline krijgt de app
  // een tijdelijk id; na synchronisatie wordt dat in de rest van de
  // wachtrij (bv. de e-mail) vervangen door het echte id.
  const RPC_RETURNS_NEW_ID = ["create_signed_wholesale_order"];

  // Leesbare namen voor het detailoverzicht.
  const LABELS = {
    orders: "Aanvraag",
    order_items: "Artikelen van aanvraag",
    order_status_history: "Statuswijziging",
    fair_orders: "Beursbestelling",
    fair_order_items: "Artikelen van beursbestelling",
    fair_contacts: "Beurscontact",
    expenses: "Onkost",
    free_beer_registrations: "Registratie gratis bier",
    b2b_registrations: "B2B-inschrijving",
    b2b_followups: "Commerciële opvolging",
    b2b_days: "B2B-dag",
    b2b_quotas: "B2B-quotum",
    products: "Artikel / voorraad",
    profiles: "Gebruikersprofiel",
    push_subscriptions: "Meldingen-instelling",
    event_material_returns: "Eventmateriaal retour",
    event_delivery_proofs: "Leveringsbewijs event",
    create_signed_wholesale_order: "Groothandelbestelling (ondertekend)",
    save_event_material_returns: "Eventmateriaal retour",
    reset_event_material_returns: "Eventmateriaal retour (reset)",
    "send-order-mail": "E-mail",
    "b2b-confirmation-email": "Bevestigingsmail naar klant",
    "b2b-reminder-email": "Herinneringsmail"
  };

  const READ_TIMEOUT_MS = 7000;   // daarna: bewaarde gegevens tonen
  const WRITE_TIMEOUT_MS = 15000; // daarna: in wachtrij (alleen als dat veilig is)
  const SYNC_INTERVAL_MS = 20000;
  const FAKE_SESSION_SECONDS = 120;
  const MAX_CACHE_ENTRIES = 400;

  const originalFetch = window.fetch.bind(window);
  const supabaseClients = [];
  const FAKE_AUTH_FLAG = "achel-offline-session-extended";
  let fakeAuthUsed = false;
  try {
    fakeAuthUsed = localStorage.getItem(FAKE_AUTH_FLAG) === "1";
  } catch (error) {
    fakeAuthUsed = false;
  }

  function setFakeAuth(value) {
    fakeAuthUsed = value;
    try {
      if (value) localStorage.setItem(FAKE_AUTH_FLAG, "1");
      else localStorage.removeItem(FAKE_AUTH_FLAG);
    } catch (error) {
      /* niets */
    }
  }

  /* ============================================================
     KLEINE HULPFUNCTIES
  ============================================================ */

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function decodeJwt(token) {
    try {
      const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "="))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  function userIdFromHeaders(headers) {
    const auth = headers.authorization || headers.Authorization || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const claims = token ? decodeJwt(token) : null;
    return (claims && claims.role === "authenticated" && claims.sub) || "anon";
  }

  function headersToObject(headers) {
    const result = {};
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    return result;
  }

  function isNetworkError(error) {
    return (
      error &&
      (error.name === "TypeError" ||
        error.name === "AbortError" ||
        error.message === "achel-timeout")
    );
  }

  function timeoutRace(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("achel-timeout")), ms);
      promise.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); }
      );
    });
  }

  function jsonResponse(data, status, extraHeaders) {
    return new Response(
      data === undefined ? null : JSON.stringify(data),
      {
        status: status || 200,
        headers: Object.assign(
          { "content-type": "application/json; charset=utf-8", "x-achel-offline": "1" },
          extraHeaders || {}
        )
      }
    );
  }

  function emptyResponse(status) {
    return new Response(null, { status: status || 204, headers: { "x-achel-offline": "1" } });
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ============================================================
     OPSLAG OP HET TOESTEL (IndexedDB)
  ============================================================ */

  let dbPromise = null;

  function openDb() {
    if (dbPromise) {
      return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("achel-offline", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("queue")) {
          db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  function idb(storeName, mode, action) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, mode);
          const store = tx.objectStore(storeName);
          let result;
          const request = action(store);
          if (request) {
            request.onsuccess = () => { result = request.result; };
          }
          tx.oncomplete = () => resolve(result);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        })
    );
  }

  const cacheStore = {
    get: (key) => idb("cache", "readonly", (s) => s.get(key)),
    put: (key, value) => idb("cache", "readwrite", (s) => s.put(value, key)),
    all: () =>
      openDb().then(
        (db) =>
          new Promise((resolve, reject) => {
            const items = [];
            const tx = db.transaction("cache", "readonly");
            const cursorRequest = tx.objectStore("cache").openCursor();
            cursorRequest.onsuccess = () => {
              const cursor = cursorRequest.result;
              if (cursor) {
                items.push({ key: cursor.key, value: cursor.value });
                cursor.continue();
              }
            };
            tx.oncomplete = () => resolve(items);
            tx.onerror = () => reject(tx.error);
          })
      ),
    remove: (key) => idb("cache", "readwrite", (s) => s.delete(key))
  };

  const queueStore = {
    all: () => idb("queue", "readonly", (s) => s.getAll()).then((items) => items || []),
    add: (item) => idb("queue", "readwrite", (s) => s.add(item)),
    put: (item) => idb("queue", "readwrite", (s) => s.put(item)),
    remove: (id) => idb("queue", "readwrite", (s) => s.delete(id))
  };

  const metaStore = {
    get: (key) => idb("meta", "readonly", (s) => s.get(key)),
    put: (key, value) => idb("meta", "readwrite", (s) => s.put(value, key))
  };

  async function pruneCache() {
    try {
      const entries = await cacheStore.all();
      if (entries.length <= MAX_CACHE_ENTRIES) {
        return;
      }
      entries.sort((a, b) => (a.value.savedAt || 0) - (b.value.savedAt || 0));
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
      for (const entry of toRemove) {
        await cacheStore.remove(entry.key);
      }
    } catch (error) {
      console.warn("Offline: opruimen bewaarde gegevens mislukt", error);
    }
  }

  /* ============================================================
     SOORT VERZOEK BEPALEN
  ============================================================ */

  function classify(url, method) {
    if (!/\.supabase\.co$/i.test(url.hostname)) {
      return null;
    }

    const path = url.pathname;
    let match;

    if ((match = path.match(/^\/rest\/v1\/rpc\/([^/]+)$/))) {
      const name = match[1];
      if (/^get_/.test(name)) {
        return { kind: "read", name, rpc: true };
      }
      return { kind: "write", type: "rpc", name };
    }

    if ((match = path.match(/^\/rest\/v1\/([^/]+)$/))) {
      const table = match[1];
      if (method === "GET" || method === "HEAD") {
        return { kind: "read", name: table };
      }
      return { kind: "write", type: "table", name: table };
    }

    if ((match = path.match(/^\/functions\/v1\/([^/]+)$/)) && method === "POST") {
      return { kind: "write", type: "function", name: match[1] };
    }

    if (path === "/auth/v1/user" && method === "GET") {
      return { kind: "read", name: "auth-user", authUser: true };
    }

    if (path === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      return { kind: "auth-refresh" };
    }

    return null;
  }

  /* Verlopen login (bv. na een lange periode offline): eerst een
     nieuwe sessie ophalen en het verzoek één keer opnieuw sturen. */
  async function retryWithFreshLogin(url, init) {
    await refreshRealSession(true);
    const token = await currentAccessToken();
    if (!token) {
      return null;
    }
    const headers = Object.assign({}, init.headers, { authorization: `Bearer ${token}` });
    return originalFetch(url, Object.assign({}, init, { headers }));
  }

  /* ============================================================
     1. LEZEN - netwerk eerst, anders de bewaarde versie
  ============================================================ */

  function cacheKeyFor(userId, method, url, body) {
    return `${userId}|${method}|${url}|${body || ""}`;
  }

  function responseFromCache(entry) {
    return new Response(entry.body === null ? null : entry.body, {
      status: entry.status,
      headers: Object.assign({}, entry.headers, { "x-achel-offline": "1" })
    });
  }

  function storedSession() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(key)) {
          const value = JSON.parse(localStorage.getItem(key));
          return value && (value.currentSession || value);
        }
      }
    } catch (error) {
      /* niets */
    }
    return null;
  }

  async function handleRead(request, info) {
    const headers = headersToObject(request.headers);
    const body = request.method === "POST" ? await request.clone().text() : "";
    const key = cacheKeyFor(userIdFromHeaders(headers), request.method, request.url, body);

    let cached = null;
    try {
      cached = await cacheStore.get(key);
    } catch (error) {
      cached = null;
    }

    // Serverberekening (bv. voorraad voor andere data) nog nooit met
    // deze gegevens opgevraagd: dan de meest recente versie gebruiken.
    if (!cached && info.rpc) {
      try {
        const prefix = cacheKeyFor(userIdFromHeaders(headers), request.method, request.url, "");
        const entries = (await cacheStore.all()).filter((e) => String(e.key).startsWith(prefix));
        entries.sort((a, b) => (b.value.savedAt || 0) - (a.value.savedAt || 0));
        if (entries.length) {
          cached = entries[0].value;
          cached.approximate = true;
        }
      } catch (error) {
        /* niets */
      }
    }

    const offlineFallback = () => {
      if (cached) {
        markOfflineRead();
        return responseFromCache(cached);
      }
      if (info.authUser) {
        const session = storedSession();
        if (session && session.user) {
          markOfflineRead();
          return jsonResponse(session.user, 200);
        }
      }
      return null;
    };

    if (navigator.onLine === false) {
      const fallback = offlineFallback();
      if (fallback) {
        return fallback;
      }
    }

    const readInit = {
      method: request.method,
      headers,
      body: request.method === "POST" ? body : undefined
    };

    const network = originalFetch(request.url, readInit).then(async (response) => {
      if (response.status === 401 && headers.authorization) {
        const retried = await retryWithFreshLogin(request.url, readInit).catch(() => null);
        if (retried) {
          response = retried;
        }
      }
      if (response.ok) {
        try {
          const text = request.method === "HEAD" ? null : await response.clone().text();
          const keep = {};
          ["content-type", "content-range", "preference-applied"].forEach((name) => {
            const value = response.headers.get(name);
            if (value) {
              keep[name] = value;
            }
          });
          await cacheStore.put(key, {
            status: response.status,
            headers: keep,
            body: text,
            savedAt: Date.now(),
            table: info.name,
            rpc: !!info.rpc,
            // Nodig om deze gegevens later op de achtergrond te verversen.
            req: {
              method: request.method,
              url: request.url,
              body: request.method === "POST" ? body : null,
              headers: Object.keys(headers)
                .filter((name) => name !== "authorization")
                .reduce((acc, name) => { acc[name] = headers[name]; return acc; }, {})
            }
          });
        } catch (error) {
          console.warn("Offline: gegevens bewaren mislukt", error);
        }
        setConnectionState(true);
      }
      return response;
    });

    try {
      const response = cached ? await timeoutRace(network, READ_TIMEOUT_MS) : await network;

      // Login nog steeds niet geldig: toon liever de bewaarde gegevens.
      if (response.status === 401 && cached) {
        return responseFromCache(cached);
      }
      return response;
    } catch (error) {
      network.catch(() => null);
      if (!isNetworkError(error)) {
        throw error;
      }
      if (error.message !== "achel-timeout") {
        setConnectionState(false);
      }
      const fallback = offlineFallback();
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  }

  /* ============================================================
     SESSIE: offline ingelogd blijven
     Een login-sessie verloopt na een uur. Zonder internet kan die
     niet vernieuwd worden, waardoor de app je zou uitloggen. Daarom
     wordt de bewaarde sessie offline tijdelijk verlengd; zodra er
     weer internet is, wordt een echte nieuwe sessie opgehaald.
  ============================================================ */

  async function handleAuthRefresh(request) {
    const bodyText = await request.clone().text();
    try {
      const response = await originalFetch(request);
      if (response.ok) {
        setFakeAuth(false);
      }
      return response;
    } catch (error) {
      let refreshToken = null;
      try {
        refreshToken = JSON.parse(bodyText).refresh_token;
      } catch (parseError) {
        refreshToken = null;
      }
      const session = storedSession();
      if (!session || !session.user || !session.access_token || !refreshToken) {
        throw error;
      }
      setConnectionState(false);
      setFakeAuth(true);
      const now = Math.round(Date.now() / 1000);
      return jsonResponse(
        {
          access_token: session.access_token,
          token_type: session.token_type || "bearer",
          expires_in: FAKE_SESSION_SECONDS,
          expires_at: now + FAKE_SESSION_SECONDS,
          refresh_token: refreshToken,
          user: session.user
        },
        200
      );
    }
  }

  let refreshingSession = null;

  function refreshRealSession(force) {
    if (refreshingSession) {
      return refreshingSession;
    }
    if (navigator.onLine === false || (!force && !fakeAuthUsed)) {
      return Promise.resolve();
    }
    const client = supabaseClients[0];
    if (!client) {
      return Promise.resolve();
    }
    refreshingSession = client.auth
      .refreshSession()
      .then((result) => {
        if (!result.error) {
          setFakeAuth(false);
        }
      })
      .catch(() => null)
      .finally(() => {
        refreshingSession = null;
      });
    return refreshingSession;
  }

  /* ============================================================
     2. OPSLAAN - direct versturen of in de wachtrij zetten
  ============================================================ */

  function describe(info, method, bodyObject) {
    const base = LABELS[info.name] || info.name;
    if (info.type === "function" && bodyObject) {
      if (bodyObject.action === "createCalendarEvent") return "Agenda-item (Outlook)";
      if (bodyObject.action === "deleteCalendarEvent") return "Agenda-item verwijderen";
      if (bodyObject.subject) return `${base}: ${bodyObject.subject}`;
    }
    if (info.type === "table") {
      if (method === "PATCH") return `${base} (wijziging)`;
      if (method === "DELETE") return `${base} (verwijderen)`;
    }
    return base;
  }

  function injectIds(bodyObject) {
    if (Array.isArray(bodyObject)) {
      return bodyObject.map((row) => (row && typeof row === "object" && !row.id ? Object.assign({ id: uuid() }, row) : row));
    }
    if (bodyObject && typeof bodyObject === "object" && !bodyObject.id) {
      return Object.assign({ id: uuid() }, bodyObject);
    }
    return bodyObject;
  }

  async function pendingCount() {
    const items = await queueStore.all();
    return items.filter((item) => item.status !== "failed").length;
  }

  async function handleWrite(request, info) {
    const headers = headersToObject(request.headers);
    let bodyText = request.method === "GET" ? "" : await request.clone().text();
    let bodyObject = null;
    try {
      bodyObject = bodyText ? JSON.parse(bodyText) : null;
    } catch (error) {
      bodyObject = null;
    }

    const prefer = headers.prefer || "";
    const isUpsert = /resolution=/.test(prefer);
    let idempotent = false;
    let requestUrl = request.url;

    // Nieuwe rij in een UUID-tabel: id zelf aanmaken.
    if (
      info.type === "table" &&
      request.method === "POST" &&
      !isUpsert &&
      UUID_TABLES.includes(info.name) &&
      bodyObject
    ) {
      bodyObject = injectIds(bodyObject);
      bodyText = JSON.stringify(bodyObject);
      idempotent = true;

      // Bij meerdere rijen tegelijk geeft Supabase een lijst "columns"
      // mee; het id moet daar ook in staan, anders wordt het genegeerd.
      const url = new URL(requestUrl);
      const columns = url.searchParams.get("columns");
      if (columns && !/(^|,)"?id"?(,|$)/.test(columns)) {
        url.searchParams.set("columns", `${columns},"id"`);
        requestUrl = url.toString();
      }
    }

    if (info.type === "table" && (request.method === "PATCH" || request.method === "DELETE" || isUpsert)) {
      idempotent = true;
    }

    const entry = {
      url: requestUrl,
      method: request.method,
      headers: Object.keys(headers)
        .filter((name) => name !== "authorization")
        .reduce((acc, name) => { acc[name] = headers[name]; return acc; }, {}),
      authorization: headers.authorization || "",
      body: bodyText,
      info,
      idempotent,
      userId: userIdFromHeaders(headers),
      label: describe(info, request.method, bodyObject),
      createdAt: Date.now(),
      status: "pending",
      attempts: 0
    };

    // Zolang er nog iets in de wachtrij staat, komt alles achteraan in
    // de wachtrij - zo blijft de volgorde (eerst bestelling, dan de
    // artikelen, dan de mail) altijd juist.
    const waiting = await pendingCount().catch(() => 0);

    if (navigator.onLine === false || waiting > 0) {
      return enqueue(entry, bodyObject, headers);
    }

    const sendHeaders = Object.assign({}, entry.headers);
    if (entry.authorization) {
      sendHeaders.authorization = entry.authorization;
    }

    const network = originalFetch(requestUrl, {
      method: request.method,
      headers: sendHeaders,
      body: bodyText || undefined
    });

    try {
      let response = idempotent ? await timeoutRace(network, WRITE_TIMEOUT_MS) : await network;
      if (response.status === 401 && sendHeaders.authorization) {
        const retried = await retryWithFreshLogin(requestUrl, {
          method: request.method,
          headers: sendHeaders,
          body: bodyText || undefined
        }).catch(() => null);
        if (retried) {
          response = retried;
        }
      }
      setConnectionState(true);
      return response;
    } catch (error) {
      network.catch(() => null);
      if (!isNetworkError(error)) {
        throw error;
      }
      if (error.message !== "achel-timeout") {
        setConnectionState(false);
      }
      return enqueue(entry, bodyObject, headers);
    }
  }

  async function findCachedRow(table, id) {
    if (!id) {
      return null;
    }
    try {
      const entries = await cacheStore.all();
      entries.sort((a, b) => (b.value.savedAt || 0) - (a.value.savedAt || 0));
      for (const entry of entries) {
        if (entry.value.table !== table || !entry.value.body) continue;
        let data;
        try {
          data = JSON.parse(entry.value.body);
        } catch (error) {
          continue;
        }
        const rows = Array.isArray(data) ? data : [data];
        const row = rows.find((r) => r && String(r.id) === String(id));
        if (row) {
          return row;
        }
      }
    } catch (error) {
      /* niets */
    }
    return null;
  }

  async function fakeWriteResponse(entry, bodyObject, headers) {
    const info = entry.info;
    const accept = headers.accept || "";
    const prefer = headers.prefer || "";
    const wantsObject = /vnd\.pgrst\.object/.test(accept);
    const wantsRows = /return=representation/.test(prefer);

    if (info.type === "function") {
      return { response: jsonResponse({ success: true, queued: true, offline: true }, 200) };
    }

    if (info.type === "rpc") {
      if (RPC_RETURNS_NEW_ID.includes(info.name)) {
        const tempId = uuid();
        return { response: jsonResponse(tempId, 200), tempId };
      }
      return { response: emptyResponse(204) };
    }

    // Tabellen
    let rows = [];
    if (entry.method === "POST") {
      const nowIso = new Date().toISOString();
      rows = (Array.isArray(bodyObject) ? bodyObject : [bodyObject]).map((row) =>
        Object.assign({ created_at: nowIso }, row || {})
      );
    } else {
      const url = new URL(entry.url);
      const idFilter = url.searchParams.get("id");
      const id = idFilter && idFilter.startsWith("eq.") ? idFilter.slice(3) : null;
      const existing = await findCachedRow(info.name, id);
      const merged = Object.assign({}, existing || {}, id ? { id } : {}, entry.method === "PATCH" ? bodyObject || {} : {});
      rows = [merged];
    }

    if (!wantsRows && !wantsObject) {
      return { response: emptyResponse(entry.method === "POST" ? 201 : 204) };
    }
    const status = entry.method === "POST" ? 201 : 200;
    return { response: jsonResponse(wantsObject ? rows[0] : rows, status) };
  }

  async function enqueue(entry, bodyObject, headers) {
    const { response, tempId } = await fakeWriteResponse(entry, bodyObject, headers);
    if (tempId) {
      entry.tempId = tempId;
    }
    await queueStore.add(entry);
    showToast("Geen (goede) verbinding: bewaard op dit toestel. Wordt automatisch verstuurd zodra er internet is.");
    refreshStatus();
    requestBackgroundSync();
    return response;
  }

  /* ============================================================
     3. SYNCHRONISEREN - de wachtrij doorsturen
  ============================================================ */

  let syncing = false;
  let lastSyncResult = null;

  async function currentAccessToken() {
    for (const client of supabaseClients) {
      try {
        const { data } = await client.auth.getSession();
        if (data && data.session && data.session.access_token) {
          return data.session.access_token;
        }
      } catch (error) {
        /* volgende proberen */
      }
    }
    const session = storedSession();
    return session ? session.access_token : null;
  }

  function applyIdMap(text, idMap) {
    if (!text) {
      return text;
    }
    let result = text;
    Object.keys(idMap).forEach((tempId) => {
      const realId = idMap[tempId];
      result = result.split(tempId).join(realId);
      result = result
        .split(tempId.slice(0, 8).toUpperCase())
        .join(realId.slice(0, 8).toUpperCase());
    });
    return result;
  }

  async function sendQueued(item, token, idMap) {
    const headers = Object.assign({}, item.headers, { authorization: `Bearer ${token}` });
    return originalFetch(applyIdMap(item.url, idMap), {
      method: item.method,
      headers,
      body: applyIdMap(item.body, idMap) || undefined
    });
  }

  async function afterSent(item, response, idMap) {
    // Tijdelijk id vervangen door het echte id in de rest van de wachtrij.
    if (item.tempId) {
      try {
        const realId = await response.clone().json();
        if (typeof realId === "string" && realId) {
          idMap[item.tempId] = realId;
          await metaStore.put("idMap", idMap);
        }
      } catch (error) {
        /* niets */
      }
    }

    // Agenda-item offline aangemaakt: het Outlook-id alsnog bij de
    // aanvraag bewaren (zoals de app online ook doet).
    if (item.info.type === "function" && item.body) {
      try {
        const body = JSON.parse(item.body);
        if (body.action === "createCalendarEvent" && body.orderId) {
          const data = await response.clone().json();
          if (data && data.eventId) {
            const base = new URL(item.url).origin;
            const token = await currentAccessToken();
            await originalFetch(`${base}/rest/v1/orders?id=eq.${encodeURIComponent(body.orderId)}`, {
              method: "PATCH",
              headers: {
                apikey: item.headers.apikey,
                authorization: `Bearer ${token}`,
                "content-type": "application/json",
                prefer: "return=minimal"
              },
              body: JSON.stringify({ outlook_event_id: data.eventId })
            });
          }
        }
      } catch (error) {
        console.warn("Offline: agenda-koppeling bijwerken mislukt", error);
      }
    }
  }

  async function errorText(response) {
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return json.message || json.error || json.msg || text;
      } catch (error) {
        return text || `Fout ${response.status}`;
      }
    } catch (error) {
      return `Fout ${response.status}`;
    }
  }

  async function syncNow() {
    if (syncing || navigator.onLine === false) {
      return;
    }

    const run = async () => {
      syncing = true;
      refreshStatus();
      let sentCount = 0;
      let failedCount = 0;
      let stoppedOffline = false;

      try {
        if (fakeAuthUsed) {
          await refreshRealSession();
        }

        const idMap = (await metaStore.get("idMap").catch(() => null)) || {};
        const items = (await queueStore.all()).filter((item) => item.status !== "failed");

        if (!items.length) {
          return;
        }

        let token = await currentAccessToken();
        const currentUser = token ? userIdFromHeaders({ authorization: `Bearer ${token}` }) : "anon";

        for (const item of items) {
          // Acties van een andere gebruiker op dit toestel wachten tot
          // die gebruiker weer inlogt.
          if (item.userId !== "anon" && item.userId !== currentUser) {
            continue;
          }

          let response;
          try {
            response = await timeoutRace(
              sendQueued(item, token || "", idMap),
              item.idempotent ? WRITE_TIMEOUT_MS : 60000
            );
          } catch (error) {
            stoppedOffline = true;
            setConnectionState(false);
            break;
          }

          if (response.status === 401) {
            await refreshRealSession(true);
            token = await currentAccessToken();
            try {
              response = await sendQueued(item, token || "", idMap);
            } catch (error) {
              stoppedOffline = true;
              break;
            }
          }

          if (response.ok || (response.status === 409 && item.idempotent && item.method === "POST")) {
            await afterSent(item, response, idMap);
            await queueStore.remove(item.id);
            sentCount++;
            continue;
          }

          if (response.status >= 500 || response.status === 429 || response.status === 408) {
            // Server tijdelijk niet beschikbaar: later opnieuw.
            item.attempts = (item.attempts || 0) + 1;
            item.lastError = await errorText(response);
            await queueStore.put(item);
            break;
          }

          item.status = "failed";
          item.attempts = (item.attempts || 0) + 1;
          item.lastError = await errorText(response);
          await queueStore.put(item);
          failedCount++;
        }

        if (!stoppedOffline) {
          setConnectionState(true);
        }
      } catch (error) {
        console.error("Offline: synchroniseren mislukt", error);
      } finally {
        syncing = false;
        if (sentCount || failedCount) {
          lastSyncResult = { sentCount, failedCount, at: Date.now() };
          window.dispatchEvent(new CustomEvent("achel-offline-synced", { detail: lastSyncResult }));
          if (sentCount && !failedCount) {
            showToast(`✓ ${sentCount} ${sentCount === 1 ? "actie" : "acties"} verstuurd. Alles is gesynchroniseerd.`, {
              actionLabel: "Vernieuwen",
              action: () => window.location.reload()
            });
          } else if (failedCount) {
            showToast(`${failedCount} ${failedCount === 1 ? "actie kon" : "acties konden"} niet verstuurd worden. Tik op het balkje bovenaan voor details.`);
          }
        }
        refreshStatus();
      }
    };

    if (navigator.locks && navigator.locks.request) {
      // Voorkomt dat twee open schermen tegelijk dezelfde wachtrij versturen.
      await navigator.locks.request("achel-offline-sync", { ifAvailable: true }, async (lock) => {
        if (lock) {
          await run();
        }
      });
    } else {
      await run();
    }
  }

  function requestBackgroundSync() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.sync && registration.sync.register("achel-offline-sync"))
      .catch(() => null);
  }

  /* ============================================================
     BEWAARDE GEGEVENS VERVERSEN
     Met internet worden alle eerder bekeken gegevens op de
     achtergrond opnieuw opgehaald, zodat de offline versie zo
     recent mogelijk is - ook van schermen die je vandaag niet opent.
  ============================================================ */

  let refreshingKnown = false;

  async function refreshKnown() {
    if (refreshingKnown || navigator.onLine === false) {
      return;
    }
    refreshingKnown = true;
    try {
      const token = await currentAccessToken();
      if (!token) {
        return;
      }
      const userId = userIdFromHeaders({ authorization: `Bearer ${token}` });
      const lastRun = await metaStore.get(`refreshKnown:${userId}`).catch(() => 0);
      if (lastRun && Date.now() - lastRun < 10 * 60 * 1000) {
        return;
      }
      await metaStore.put(`refreshKnown:${userId}`, Date.now());

      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const entries = (await cacheStore.all()).filter(
        (e) =>
          String(e.key).startsWith(`${userId}|`) &&
          e.value.req &&
          (e.value.savedAt || 0) > monthAgo &&
          Date.now() - (e.value.savedAt || 0) > 2 * 60 * 1000
      );

      for (const entry of entries) {
        if (navigator.onLine === false) {
          break;
        }
        const req = entry.value.req;
        try {
          const response = await timeoutRace(
            originalFetch(req.url, {
              method: req.method,
              headers: Object.assign({}, req.headers, { authorization: `Bearer ${token}` }),
              body: req.body || undefined
            }),
            READ_TIMEOUT_MS
          );
          if (response.ok) {
            const text = req.method === "HEAD" ? null : await response.text();
            const keep = {};
            ["content-type", "content-range", "preference-applied"].forEach((name) => {
              const value = response.headers.get(name);
              if (value) {
                keep[name] = value;
              }
            });
            await cacheStore.put(entry.key, Object.assign({}, entry.value, {
              status: response.status,
              headers: keep,
              body: text,
              savedAt: Date.now()
            }));
          }
        } catch (error) {
          if (isNetworkError(error)) {
            break;
          }
        }
      }
    } catch (error) {
      console.warn("Offline: verversen bewaarde gegevens mislukt", error);
    } finally {
      refreshingKnown = false;
    }
  }

  /* ============================================================
     DE FETCH-WISSEL: alle verkeer naar Supabase loopt hierlangs
  ============================================================ */

  window.fetch = async function achelOfflineFetch(input, init) {
    let request;
    try {
      request = new Request(input, init);
    } catch (error) {
      return originalFetch(input, init);
    }

    let url;
    try {
      url = new URL(request.url);
    } catch (error) {
      return originalFetch(input, init);
    }

    const info = classify(url, request.method);
    if (!info) {
      return originalFetch(input, init);
    }

    try {
      if (info.kind === "read") return await handleRead(request, info);
      if (info.kind === "write") return await handleWrite(request, info);
      if (info.kind === "auth-refresh") return await handleAuthRefresh(request);
    } catch (error) {
      if (isNetworkError(error)) {
        throw error;
      }
      console.error("Offline-laag: onverwachte fout, rechtstreeks versturen", error);
      return originalFetch(input, init);
    }
    return originalFetch(input, init);
  };

  // Supabase-verbindingen van de pagina onthouden (nodig om de sessie
  // te vernieuwen en om de wachtrij met de juiste login te versturen).
  function wrapCreateClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function" || window.supabase.__achelWrapped) {
      return;
    }
    const createClient = window.supabase.createClient;
    window.supabase.createClient = function () {
      const client = createClient.apply(this, arguments);
      supabaseClients.push(client);
      try {
        client.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            setTimeout(syncNow, 500);
          }
        });
      } catch (error) {
        /* niets */
      }
      return client;
    };
    window.supabase.__achelWrapped = true;
  }
  wrapCreateClient();

  /* ============================================================
     4. STATUSBALKJE EN MELDINGEN
  ============================================================ */

  let isOnline = navigator.onLine !== false;
  let usedOfflineData = false;

  function setConnectionState(online) {
    if (online === isOnline) {
      return;
    }
    isOnline = online;
    if (online) {
      usedOfflineData = false;
      setTimeout(syncNow, 300);
    }
    refreshStatus();
  }

  function markOfflineRead() {
    if (!usedOfflineData) {
      usedOfflineData = true;
      refreshStatus();
    }
  }

  const STYLE = `
  .achel-offline-pill{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);transform:translateX(-50%);z-index:2147483000;display:none;align-items:center;gap:8px;max-width:calc(100vw - 32px);padding:7px 14px;border-radius:999px;background:#182019;color:#f6f0e3;border:1px solid rgba(201,155,67,.55);box-shadow:0 6px 20px rgba(0,0,0,.25);font:600 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .achel-offline-pill.is-visible{display:flex}
  .achel-offline-dot{width:9px;height:9px;border-radius:50%;flex:none;background:#2f7449}
  .achel-offline-pill.is-offline .achel-offline-dot{background:#d99a3e}
  .achel-offline-pill.is-failed .achel-offline-dot{background:#c75c5c}
  .achel-offline-pill.is-syncing .achel-offline-dot{background:#e0b85f;animation:achelPulse 1s infinite}
  @keyframes achelPulse{50%{opacity:.3}}
  .achel-offline-toast{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 48px);transform:translateX(-50%);z-index:2147483001;width:min(420px,calc(100vw - 32px));padding:12px 14px;border-radius:14px;background:#182019;color:#f6f0e3;border:1px solid rgba(201,155,67,.4);box-shadow:0 10px 30px rgba(0,0,0,.3);font:500 14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;gap:12px;align-items:center}
  .achel-offline-toast button{flex:none;background:#c99b43;color:#121813;border:0;border-radius:10px;padding:8px 12px;font:700 13px/1 inherit;cursor:pointer}
  .achel-offline-sheet-bg{position:fixed;inset:0;z-index:2147483002;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
  .achel-offline-sheet{width:min(560px,100vw);max-height:80vh;overflow:auto;background:#121813;color:#f6f0e3;border-radius:20px 20px 0 0;padding:20px 16px calc(env(safe-area-inset-bottom,0px) + 20px);font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .achel-offline-sheet h3{margin:0 0 4px;font-size:18px;color:#e0b85f}
  .achel-offline-sheet p{margin:0 0 14px;color:rgba(246,240,227,.7)}
  .achel-offline-item{border:1px solid rgba(201,155,67,.25);border-radius:12px;padding:10px 12px;margin-bottom:8px;background:rgba(255,255,255,.03)}
  .achel-offline-item b{display:block}
  .achel-offline-item small{color:rgba(246,240,227,.6)}
  .achel-offline-item .err{color:#e89a9a;margin-top:4px;font-size:13px}
  .achel-offline-item .row{display:flex;gap:8px;margin-top:8px}
  .achel-offline-sheet button{background:rgba(201,155,67,.15);color:#f6f0e3;border:1px solid rgba(201,155,67,.5);border-radius:10px;padding:9px 12px;font:600 13px/1 inherit;cursor:pointer}
  .achel-offline-sheet button.primary{background:#c99b43;color:#121813;border-color:#c99b43}
  .achel-offline-sheet .actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  `;

  let pill = null;
  let toastEl = null;
  let toastTimer = null;

  function ensureUi() {
    if (pill || !document.body) {
      return !!pill;
    }
    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    pill = document.createElement("div");
    pill.className = "achel-offline-pill";
    pill.setAttribute("role", "status");
    pill.innerHTML = '<span class="achel-offline-dot"></span><span class="achel-offline-text"></span>';
    pill.addEventListener("click", openSheet);
    document.body.appendChild(pill);
    return true;
  }

  let refreshQueued = false;
  function refreshStatus() {
    if (refreshQueued) {
      return;
    }
    refreshQueued = true;
    setTimeout(async () => {
      refreshQueued = false;
      if (!ensureUi()) {
        return;
      }
      let items = [];
      try {
        items = await queueStore.all();
      } catch (error) {
        items = [];
      }
      const waiting = items.filter((item) => item.status !== "failed").length;
      const failed = items.filter((item) => item.status === "failed").length;
      const offline = !isOnline || navigator.onLine === false;

      let text = "";
      pill.className = "achel-offline-pill";

      if (syncing && waiting) {
        text = `Synchroniseren… (${waiting})`;
        pill.classList.add("is-syncing");
      } else if (offline) {
        text = waiting
          ? `Offline · ${waiting} ${waiting === 1 ? "actie wacht" : "acties wachten"}`
          : "Offline · laatst bewaarde gegevens";
        pill.classList.add("is-offline");
      } else if (failed) {
        text = `${failed} ${failed === 1 ? "actie" : "acties"} niet verstuurd · tik voor details`;
        pill.classList.add("is-failed");
      } else if (waiting) {
        text = `${waiting} ${waiting === 1 ? "actie wacht" : "acties wachten"} op verzending`;
        pill.classList.add("is-offline");
      } else if (usedOfflineData) {
        text = "Trage verbinding · laatst bewaarde gegevens";
        pill.classList.add("is-offline");
      }

      if (text) {
        pill.querySelector(".achel-offline-text").textContent = text;
        pill.classList.add("is-visible");
      }
    }, 50);
  }

  function showToast(message, options) {
    if (!ensureUi()) {
      return;
    }
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "achel-offline-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span style="flex:1">${escapeHtml(message)}</span>`;
    if (options && options.actionLabel) {
      const button = document.createElement("button");
      button.textContent = options.actionLabel;
      button.addEventListener("click", options.action);
      toastEl.appendChild(button);
    }
    toastEl.style.display = "flex";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.style.display = "none";
    }, options && options.actionLabel ? 8000 : 5000);
  }

  function formatTime(timestamp) {
    try {
      return new Date(timestamp).toLocaleString("nl-BE", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
      });
    } catch (error) {
      return "";
    }
  }

  async function openSheet() {
    const items = await queueStore.all().catch(() => []);
    const offline = !isOnline || navigator.onLine === false;

    const background = document.createElement("div");
    background.className = "achel-offline-sheet-bg";
    background.addEventListener("click", (event) => {
      if (event.target === background) background.remove();
    });

    const list = items.length
      ? items
          .map(
            (item) => `
        <div class="achel-offline-item">
          <b>${escapeHtml(item.label)}</b>
          <small>Bewaard op ${escapeHtml(formatTime(item.createdAt))} · ${item.status === "failed" ? "niet gelukt" : "wacht op verzending"}</small>
          ${item.status === "failed" ? `<div class="err">${escapeHtml(item.lastError || "Onbekende fout")}</div>
          <div class="row">
            <button data-retry="${item.id}">Opnieuw proberen</button>
            <button data-remove="${item.id}">Verwijderen</button>
          </div>` : ""}
        </div>`
          )
          .join("")
      : "<p>Er wacht niets op verzending. Alles is gesynchroniseerd.</p>";

    background.innerHTML = `
      <div class="achel-offline-sheet">
        <h3>${offline ? "Je bent offline" : "Synchronisatie"}</h3>
        <p>${offline
          ? "Je ziet de laatst bewaarde gegevens. Wat je nu opslaat, wordt automatisch verstuurd zodra er internet is."
          : "Acties die zonder internet werden opgeslagen, worden automatisch verstuurd."}</p>
        ${list}
        <div class="actions">
          ${items.length && !offline ? '<button class="primary" data-sync="1">Nu synchroniseren</button>' : ""}
          <button data-close="1">Sluiten</button>
        </div>
      </div>`;

    background.addEventListener("click", async (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.dataset.close) {
        background.remove();
      } else if (target.dataset.sync) {
        background.remove();
        syncNow();
      } else if (target.dataset.retry) {
        const item = items.find((i) => String(i.id) === target.dataset.retry);
        if (item) {
          item.status = "pending";
          await queueStore.put(item);
        }
        background.remove();
        syncNow();
      } else if (target.dataset.remove) {
        if (window.confirm("Deze actie definitief verwijderen? Ze wordt dan nooit verstuurd.")) {
          await queueStore.remove(Number(target.dataset.remove));
          background.remove();
          refreshStatus();
        }
      }
    });

    document.body.appendChild(background);
  }

  /* ============================================================
     OPSTARTEN
  ============================================================ */

  window.addEventListener("online", () => setConnectionState(true));
  window.addEventListener("offline", () => setConnectionState(false));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncNow();
  });
  setInterval(syncNow, SYNC_INTERVAL_MS);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "achel-offline-sync") syncNow();
    });

    // Ook schermen die rechtstreeks geopend worden (B2B, beurzen,
    // onkosten...) registreren de offline-bewaring.
    try {
      const script = document.currentScript && document.currentScript.src;
      if (script) {
        const base = new URL("./", script);
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register(new URL("service-worker.js", base).href, { scope: base.href, updateViaCache: "none" })
            .catch(() => null);
        });
      }
    } catch (error) {
      /* niets */
    }
  }

  const start = () => {
    refreshStatus();
    setTimeout(syncNow, 1500);
    setTimeout(pruneCache, 5000);
    // Schermen buiten de hoofdapp (B2B, beurzen, onkosten) verversen
    // zelf de bewaarde gegevens; de hoofdapp doet dit na het voorladen.
    if (window.top === window) {
      setTimeout(refreshKnown, 20000);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.__achelOffline = {
    syncNow,
    refreshKnown,
    openSheet,
    pendingCount,
    isOnline: () => isOnline && navigator.onLine !== false
  };
})();
