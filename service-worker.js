const CACHE_NAME =
  "achel-pos-v23";


const STATIC_FILES = [

  "./",

  "./index.html",

  "./manifest.json",

  "./admin.js",

  "./wholesale.js",

  "./achel-kluis-home.jpg",

  "./achel-logo.png"

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
   NETWORK FIRST
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


    /*
      HTML + JS:
      altijd eerst nieuwste versie online proberen.
    */

    const isImportantFile =

      event.request.mode ===
      "navigate"

      ||

      requestUrl.pathname.endsWith(
        ".js"
      )

      ||

      requestUrl.pathname.endsWith(
        ".html"
      );


    if (
      isImportantFile
    ) {

      event.respondWith(

        fetch(
          event.request,
          {
            cache:
              "no-store"
          }
        )

          .then(
            response => {

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


              return response;

            }
          )

          .catch(
            async () => {

              const cached =
                await caches.match(
                  event.request
                );


              if (
                cached
              ) {

                return cached;

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
                "Bestand niet beschikbaar"
              );

            }
          )

      );


      return;

    }


    /*
      Afbeeldingen / overige bestanden:
      cache mag gebruikt worden,
      maar online versie krijgt voorkeur.
    */

    event.respondWith(

      fetch(
        event.request
      )

        .then(
          response => {

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


            return response;

          }
        )

        .catch(
          () =>
            caches.match(
              event.request
            )
        )

    );

  }
);
