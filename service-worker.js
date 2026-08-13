const CACHE_NAME =
  "achel-pos-v8";


const STATIC_FILES = [

  "./",

  "./index.html",

  "./manifest.json",

  "./admin.js"

];



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

    );


    self.clients.claim();

  }
);



self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method
      !==
      "GET"
    ) {

      return;

    }



    /*
      PAGINA'S:
      ALTIJD EERST ONLINE CONTROLEREN
    */

    if (
      event.request.mode
      ===
      "navigate"
    ) {

      event.respondWith(

        fetch(
          event.request
        )

          .catch(
            () =>
              caches.match(
                "./index.html"
              )
          )

      );


      return;

    }



    /*
      ANDERE BESTANDEN:
      NETWORK FIRST
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
