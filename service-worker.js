const CACHE_NAME =
  "achel-pos-cache";


const STATIC_FILES = [

  "./",

  "./index.html",

  "./manifest.json",

  "./admin.js",

  "./wholesale.js",

  "./achel-kluis-home.jpg",

  "./achel-logo.png",

  "./achel-header-logo.png",

  "./achel-glas.png",

  "./achel-icon-192.png",

  "./achel-icon-512.png"

];


/* ============================================================
   INSTALL
============================================================ */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )
        .then(
          cache =>
            cache.addAll(
              STATIC_FILES
            )
        )

    );


    self.skipWaiting();

  }
);


/* ============================================================
   ACTIVATE
============================================================ */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(
          names =>
            Promise.all(

              names

                .filter(
                  name =>
                    name !==
                    CACHE_NAME
                )

                .map(
                  name =>
                    caches.delete(
                      name
                    )
                )

            )
        )
        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


/* ============================================================
   FETCH
   Snelle PWA-strategie:
   - eigen appbestanden: cache-first
   - netwerk werkt op achtergrond de cache bij
   - externe CDN/API requests: normale netwerkrequest
============================================================ */

self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !==
      "GET"
    ) {

      return;

    }


    const requestUrl =
      new URL(
        event.request.url
      );


    const isSameOrigin =
      requestUrl.origin ===
      self.location.origin;


    /*
      Supabase/CDN en andere externe requests
      niet door onze app-cache laten vertragen.
    */
    if (
      !isSameOrigin
    ) {

      return;

    }


    event.respondWith(

      caches
        .match(
          event.request
        )
        .then(
          cachedResponse => {

            const networkUpdate =
              fetch(
                event.request
              )
                .then(
                  response => {

                    if (
                      response &&
                      response.ok
                    ) {

                      const copy =
                        response.clone();


                      caches
                        .open(
                          CACHE_NAME
                        )
                        .then(
                          cache =>
                            cache.put(
                              event.request,
                              copy
                            )
                        );

                    }


                    return response;

                  }
                )
                .catch(
                  () =>
                    cachedResponse
                );


            /*
              Staat het bestand al lokaal?
              Toon het onmiddellijk.
              De verse versie wordt ondertussen
              op de achtergrond opgeslagen.
            */
            if (
              cachedResponse
            ) {

              event.waitUntil(
                networkUpdate
              );


              return cachedResponse;

            }


            return networkUpdate
              .then(
                response => {

                  if (
                    response
                  ) {

                    return response;

                  }


                  if (
                    event.request.mode ===
                    "navigate"
                  ) {

                    return caches.match(
                      "./index.html"
                    );

                  }


                  throw new Error(
                    "Bestand niet beschikbaar."
                  );

                }
              );

          }
        )

    );

  }
);


/* ============================================================
   PUSH BERICHT ONTVANGEN
============================================================ */

self.addEventListener(
  "push",
  event => {

    let payload = {

      title:
        "Achel POS",

      body:
        "Je hebt een nieuwe melding.",

      target_url:
        "./"

    };


    if (
      event.data
    ) {

      try {

        payload =
          event.data.json();

      }

      catch (
        error
      ) {

        payload.body =
          event.data.text();

      }

    }


    const title =
      payload.title ||
      "Achel POS";


    const options = {

      body:

        payload.body ||
        "",

      icon:
        "./achel-logo.png",

      badge:
        "./achel-logo.png",

      data: {

        target_url:

          payload.target_url ||
          "./",

        order_id:

          payload.order_id ||
          null,

        notification_type:

          payload.notification_type ||
          null

      },

      tag:

        payload.notification_type &&
        payload.order_id

          ? `${payload.notification_type}-${payload.order_id}`

          : undefined,

      renotify:
        false

    };


    event.waitUntil(

      self.registration
        .showNotification(
          title,
          options
        )

    );

  }
);


/* ============================================================
   KLIK OP MELDING
============================================================ */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();


    const targetUrl =

      event.notification
        .data
        ?.target_url

      ||

      "./";


    event.waitUntil(

      clients
        .matchAll({
          type:
            "window",
          includeUncontrolled:
            true
        })
        .then(
          windowClients => {

            for (
              const client
              of windowClients
            ) {

              if (
                "focus"
                in client
              ) {

                client.navigate?.(
                  targetUrl
                );


                return client.focus();

              }

            }


            if (
              clients.openWindow
            ) {

              return clients.openWindow(
                targetUrl
              );

            }

          }
        )

    );

  }
);
