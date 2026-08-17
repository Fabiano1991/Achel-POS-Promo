/* ============================================================
   ACHEL POS - ADMIN DASHBOARD V5

   FUNCTIES
   ------------------------------------------------------------
   - Actieve POS & bier aanvragen
   - Actieve evenementaanvragen
   - Materiaal momenteel buiten
   - Groothandelbestellingen
   - Rapportering per vertegenwoordiger
   - Maand / jaar rapport
   - Grafiek afgehaalde materialen
   - Excel export
   - Archief afgehandelde aanvragen
   - Evenementmateriaal terugmelden
============================================================ */


let adminOrders = [];

let adminProfiles = [];

let adminItems = [];


let adminWholesaleOrders = [];

let adminWholesaleItems = [];


let selectedAdminOrder =
  null;


let adminReportChart =
  null;



/* ============================================================
   START
============================================================ */

async function initAdminModule() {

  try {

    const {
      data: userData,
      error: userError
    } =
      await supabaseClient
        .auth
        .getUser();


    if (
      userError
      ||
      !userData.user
    ) {

      return;

    }


    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient

        .from(
          "profiles"
        )

        .select(
          "id, naam, email, rol, actief"
        )

        .eq(
          "id",
          userData.user.id
        )

        .single();


    if (
      profileError
      ||
      !profile
    ) {

      return;

    }


    if (
      profile.rol !==
      "admin"

      &&

      profile.rol !==
      "verantwoordelijke"
    ) {

      return;

    }


    createAdminScreen();

  }

  catch (
    error
  ) {

    console.log(
      "Admin module fout:",
      error
    );

  }

}



/* ============================================================
   DASHBOARD MAKEN
============================================================ */

function createAdminScreen() {

  if (
    document.getElementById(
      "adminScreen"
    )
  ) {

    return;

  }


  const appMain =
    document.getElementById(
      "appMain"
    );


  if (
    !appMain
  ) {

    return;

  }


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "adminScreen";


  section.className =
    "hidden";


  section.innerHTML = `

    <button
      class="top-back"
      type="button"
      onclick="closeAdminDashboard()"
    >
      ← Terug
    </button>



    <!-- ===============================
         DASHBOARD BOVENAAN
    ================================ -->

    <div class="card">

      <h2>
        Beheerdersdashboard
      </h2>


      <p
        style="
          color:var(--muted);
          margin-top:-5px;
        "
      >
        Centraal overzicht van aanvragen,
        materialen en rapportering.
      </p>


      <div
        id="adminStatistics"
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
          margin-top:15px;
        "
      >
      </div>

    </div>



    <!-- ===============================
         FILTERS
    ================================ -->

    <details
      class="card dashboard-fold"
      id="adminFiltersFold"
    >

      <summary>

        <span>
          Filters
        </span>

      </summary>


      <div class="dashboard-fold-body">

        <label>
          Vertegenwoordiger
        </label>


        <select
          id="adminRepFilter"
          onchange="renderAdminSections()"
        >

          <option value="">
            Alle vertegenwoordigers
          </option>

        </select>


        <label>
          Status
        </label>


        <select
          id="adminStatusFilter"
          onchange="renderAdminSections()"
        >

          <option value="">
            Alle statussen
          </option>

          <option value="nieuw">
            Nieuw
          </option>

          <option value="in_behandeling">
            In behandeling
          </option>

          <option value="klaar">
            Klaar
          </option>

          <option value="afgehaald">
            Afgehaald
          </option>

          <option value="geannuleerd">
            Geannuleerd
          </option>

        </select>


        <label>
          Zoeken
        </label>


        <input
          id="adminSearch"
          type="text"
          placeholder="Referentie, evenement, gemeente..."
          oninput="renderAdminSections()"
        >

      </div>

    </details>



    <!-- ===============================
         ACTIEVE POS / BIER
    ================================ -->

    <details
      class="card dashboard-fold"
    >

      <summary>

        <span>
          Actieve POS & bier aanvragen
        </span>


        <span
          id="adminRegularCount"
          class="dashboard-count"
        >
          0
        </span>

      </summary>


      <div class="dashboard-fold-body">

        <div id="adminRegularOrdersList">

          <div class="empty">
            Aanvragen laden...
          </div>

        </div>

      </div>

    </details>



    <!-- ===============================
         ACTIEVE EVENEMENTEN
    ================================ -->

    <details
      class="card dashboard-fold"
    >

      <summary>

        <span>
          Actieve evenementaanvragen
        </span>


        <span
          id="adminEventCount"
          class="dashboard-count"
        >
          0
        </span>

      </summary>


      <div class="dashboard-fold-body">

        <div id="adminEventOrdersList">

          <div class="empty">
            Evenementen laden...
          </div>

        </div>

      </div>

    </details>



    <!-- ===============================
         MATERIAAL BUITEN
    ================================ -->

    <details
      class="card dashboard-fold"
    >

      <summary>

        <span>
          Materiaal momenteel buiten
        </span>


        <span
          id="adminMaterialOutCount"
          class="dashboard-count"
        >
          0
        </span>

      </summary>


      <div class="dashboard-fold-body">

        <div
          id="adminMaterialOutList"
        >

          <div class="empty">
            Materialen laden...
          </div>

        </div>

      </div>

    </details>



    <!-- ===============================
         GROOTHANDEL
    ================================ -->

    <details
      class="card dashboard-fold"
    >

      <summary>

        <span>
          Groothandelbestellingen
        </span>


        <span
          id="adminWholesaleCount"
          class="dashboard-count"
        >
          0
        </span>

      </summary>


      <div class="dashboard-fold-body">

        <div
          id="adminWholesaleOrdersList"
        >

          <div class="empty">
            Bestellingen laden...
          </div>

        </div>

      </div>

    </details>



    <!-- ===============================
         RAPPORTERING
    ================================ -->

    <details
      class="card dashboard-fold"
      id="adminReportingFold"
    >

      <summary>

        <span>
          Rapportering
        </span>

      </summary>


      <div class="dashboard-fold-body">


        <label>
          Vertegenwoordiger
        </label>


        <select
          id="reportRepresentative"
          onchange="updateAdminReport()"
        >

          <option value="">
            Alle vertegenwoordigers
          </option>

        </select>



        <label>
          Rapportperiode
        </label>


        <select
          id="reportPeriodType"
          onchange="toggleReportPeriod()"
        >

          <option value="month">
            Per maand
          </option>

          <option value="year">
            Per jaar
          </option>

        </select>



        <div
          id="reportMonthBox"
        >

          <label>
            Maand
          </label>


          <select
            id="reportMonth"
            onchange="updateAdminReport()"
          >

            <option value="1">
              Januari
            </option>

            <option value="2">
              Februari
            </option>

            <option value="3">
              Maart
            </option>

            <option value="4">
              April
            </option>

            <option value="5">
              Mei
            </option>

            <option value="6">
              Juni
            </option>

            <option value="7">
              Juli
            </option>

            <option value="8">
              Augustus
            </option>

            <option value="9">
              September
            </option>

            <option value="10">
              Oktober
            </option>

            <option value="11">
              November
            </option>

            <option value="12">
              December
            </option>

          </select>

        </div>



        <label>
          Jaar
        </label>


        <select
          id="reportYear"
          onchange="updateAdminReport()"
        >
        </select>



        <div
          id="adminReportSummary"
          style="
            margin-top:18px;
          "
        >
        </div>



        <div
          style="
            margin-top:18px;
            position:relative;
            min-height:280px;
          "
        >

          <canvas
            id="adminMaterialsChart"
          >
          </canvas>

        </div>



        <button
          class="primary"
          type="button"
          onclick="exportAdminReportExcel()"
          style="
            margin-top:20px;
          "
        >
          Download Excel
        </button>


      </div>

    </details>



    <!-- ===============================
         ARCHIEF
    ================================ -->

    <details
      class="card dashboard-fold"
    >

      <summary>

        <span>
          Archief afgehandeld
        </span>


        <span
          id="adminArchiveCount"
          class="dashboard-count"
        >
          0
        </span>

      </summary>


      <div class="dashboard-fold-body">

        <div id="adminArchiveList">

          <div class="empty">
            Archief laden...
          </div>

        </div>

      </div>

    </details>



    <button
      class="secondary"
      type="button"
      onclick="loadAdminDashboard()"
      style="
        margin-bottom:25px;
      "
    >
      Dashboard vernieuwen
    </button>

  `;


  appMain.appendChild(
    section
  );


  createAdminDetailScreen();

}



/* ============================================================
   DETAIL SCREEN
============================================================ */

function createAdminDetailScreen() {

  if (
    document.getElementById(
      "adminDetailScreen"
    )
  ) {

    return;

  }


  const appMain =
    document.getElementById(
      "appMain"
    );


  if (
    !appMain
  ) {

    return;

  }


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "adminDetailScreen";


  section.className =
    "hidden";


  section.innerHTML = `

    <button
      class="top-back"
      type="button"
      onclick="backToAdminDashboard()"
    >
      ← Terug naar dashboard
    </button>


    <div
      id="adminDetailContent"
    >
    </div>

  `;


  appMain.appendChild(
    section
  );

}



/* ============================================================
   OPEN DASHBOARD
============================================================ */

async function openAdminDashboard() {

  if (
    !document.getElementById(
      "adminScreen"
    )
  ) {

    await initAdminModule();

  }


  showOnly(
    "adminScreen"
  );


  await loadAdminDashboard();

}



/* ============================================================
   SLUIT
============================================================ */

function closeAdminDashboard() {

  goHome();

}



/* ============================================================
   TERUG
============================================================ */

function backToAdminDashboard() {

  showOnly(
    "adminScreen"
  );


  renderAdminSections();

}



/* ============================================================
   DATA LADEN
============================================================ */

async function loadAdminDashboard() {

  const [
    profilesResult,
    ordersResult,
    itemsResult,
    wholesaleResult,
    wholesaleItemsResult
  ] =
    await Promise.all([


      supabaseClient

        .from(
          "profiles"
        )

        .select(
          "id, naam, email, rol, actief"
        ),



      supabaseClient

        .from(
          "orders"
        )

        .select(`
          id,
          user_id,
          referentie,
          land,
          gemeente,
          afhaaldatum,
          opmerking,
          status,
          event_naam,
          event_vanaf,
          event_tot,
          event_returned_at,
          event_returned_by,
          opened_at,
          completed_at,
          collected_at,
          created_at,
          updated_at
        `)

        .order(
          "created_at",
          {
            ascending:
              false
          }
        ),



      supabaseClient

        .from(
          "order_items"
        )

        .select(
          "order_id, product_naam, categorie, aantal"
        ),



      supabaseClient

        .from(
          "wholesale_orders"
        )

        .select(
          "id, user_id, referentie, drankenhandel, opmerking, status, created_at"
        )

        .order(
          "created_at",
          {
            ascending:
              false
          }
        ),



      supabaseClient

        .from(
          "wholesale_order_items"
        )

        .select(
          "wholesale_order_id, product_naam, eenheid, betaald_aantal, actie, gratis_aantal, totaal_aantal"
        )

    ]);


  if (
    profilesResult.error
    ||
    ordersResult.error
    ||
    itemsResult.error
  ) {

    alert(
      "Dashboard kon niet volledig worden geladen."
    );


    console.log(
      profilesResult.error,
      ordersResult.error,
      itemsResult.error
    );


    return;

  }


  adminProfiles =
    profilesResult.data
    ||
    [];


  adminOrders =
    ordersResult.data
    ||
    [];


  adminItems =
    itemsResult.data
    ||
    [];


  adminWholesaleOrders =

    wholesaleResult.error

      ? []

      : (
          wholesaleResult.data
          ||
          []
        );


  adminWholesaleItems =

    wholesaleItemsResult.error

      ? []

      : (
          wholesaleItemsResult.data
          ||
          []
        );


  fillRepresentativeFilters();


  fillReportYears();


  setCurrentReportMonth();


  renderAdminStatistics();


  renderAdminSections();


  updateAdminReport();

}



/* ============================================================
   FILTERS
============================================================ */

function fillRepresentativeFilters() {

  const selects = [

    document.getElementById(
      "adminRepFilter"
    ),

    document.getElementById(
      "reportRepresentative"
    )

  ];


  selects.forEach(
    select => {

      if (
        !select
      ) {

        return;

      }


      const value =
        select.value;


      select.innerHTML = `

        <option value="">
          Alle vertegenwoordigers
        </option>

      `;


      adminProfiles

        .filter(
          profile =>
            profile.actief
        )

        .sort(
          (
            a,
            b
          ) =>
            String(
              a.naam
              ||
              ""
            )
            .localeCompare(
              String(
                b.naam
                ||
                ""
              )
            )
        )

        .forEach(
          profile => {

            const option =
              document.createElement(
                "option"
              );


            option.value =
              profile.id;


            option.innerText =
              profile.naam;


            select.appendChild(
              option
            );

          }
        );


      select.value =
        value;

    }
  );

}



/* ============================================================
   STATISTIEKEN
============================================================ */

function renderAdminStatistics() {

  const container =
    document.getElementById(
      "adminStatistics"
    );


  if (
    !container
  ) {

    return;

  }


  const active =
    adminOrders.filter(
      order =>
        !isArchivedOrder(
          order
        )
    );


  const nieuw =
    active.filter(
      order =>
        order.status ===
        "nieuw"
    ).length;


  const processing =
    active.filter(
      order =>
        order.status ===
        "in_behandeling"
    ).length;


  const ready =
    active.filter(
      order =>
        order.status ===
        "klaar"
    ).length;


  const outside =
    getMaterialOutOrders()
      .length;


  container.innerHTML =

    adminStatCard(
      "Nieuw",
      nieuw
    )

    +

    adminStatCard(
      "In behandeling",
      processing
    )

    +

    adminStatCard(
      "Klaar",
      ready
    )

    +

    adminStatCard(
      "Materiaal buiten",
      outside
    );

}



function adminStatCard(
  label,
  value
) {

  return `

    <div
      style="
        background:var(--surface-soft);
        border:1px solid var(--border);
        border-radius:14px;
        padding:15px;
      "
    >

      <div
        style="
          font-size:27px;
          font-weight:900;
          color:var(--gold);
        "
      >
        ${value}
      </div>


      <div
        style="
          font-size:12px;
          color:var(--muted);
          margin-top:4px;
        "
      >
        ${label}
      </div>

    </div>

  `;

}



/* ============================================================
   ARCHIEFLOGICA
============================================================ */

function isArchivedOrder(
  order
) {

  /*
    Gewone POS / bier:
    afgehaald = archief.

    Evenement:
    pas archief wanneer materiaal
    effectief terug is.
  */


  if (
    order.event_naam
  ) {

    return Boolean(
      order.event_returned_at
    );

  }


  return (

    order.status ===
    "afgehaald"

    ||

    order.status ===
    "geannuleerd"

  );

}



/* ============================================================
   MATERIAAL BUITEN
============================================================ */

function getMaterialOutOrders() {

  return adminOrders.filter(
    order =>

      Boolean(
        order.event_naam
      )

      &&

      order.status ===
      "afgehaald"

      &&

      !order.event_returned_at
  );

}



/* ============================================================
   FILTER ACTIEVE ORDERS
============================================================ */

function getFilteredAdminOrders() {

  const representative =

    document
      .getElementById(
        "adminRepFilter"
      )
      ?.value

    ||

    "";


  const status =

    document
      .getElementById(
        "adminStatusFilter"
      )
      ?.value

    ||

    "";


  const search =

    (
      document
        .getElementById(
          "adminSearch"
        )
        ?.value

      ||

      ""
    )

      .trim()
      .toLowerCase();


  return adminOrders.filter(
    order => {


      if (
        representative

        &&

        order.user_id !==
        representative
      ) {

        return false;

      }


      if (
        status

        &&

        order.status !==
        status
      ) {

        return false;

      }


      if (
        search
      ) {

        const profile =
          getAdminProfile(
            order.user_id
          );


        const text =
          [

            order.referentie,

            order.land,

            order.gemeente,

            order.event_naam,

            order.opmerking,

            profile?.naam,

            profile?.email

          ]

            .filter(
              Boolean
            )

            .join(" ")

            .toLowerCase();


        if (
          !text.includes(
            search
          )
        ) {

          return false;

        }

      }


      return true;

    }
  );

}



/* ============================================================
   DASHBOARD SECTIES
============================================================ */

function renderAdminSections() {

  const filtered =
    getFilteredAdminOrders();


  const activeRegular =
    filtered.filter(
      order =>

        !order.event_naam

        &&

        !isArchivedOrder(
          order
        )
    );


  const activeEvents =
    filtered.filter(
      order =>

        Boolean(
          order.event_naam
        )

        &&

        !isArchivedOrder(
          order
        )

        &&

        order.status !==
        "afgehaald"
    );


  const materialOut =
    filtered.filter(
      order =>

        Boolean(
          order.event_naam
        )

        &&

        order.status ===
        "afgehaald"

        &&

        !order.event_returned_at
    );


  const archive =
    filtered.filter(
      order =>
        isArchivedOrder(
          order
        )
    );


  setAdminCount(
    "adminRegularCount",
    activeRegular.length
  );


  setAdminCount(
    "adminEventCount",
    activeEvents.length
  );


  setAdminCount(
    "adminMaterialOutCount",
    materialOut.length
  );


  setAdminCount(
    "adminWholesaleCount",
    adminWholesaleOrders.length
  );


  setAdminCount(
    "adminArchiveCount",
    archive.length
  );


  renderAdminOrderList(
    "adminRegularOrdersList",
    activeRegular,
    "Geen actieve POS- of bieraanvragen."
  );


  renderAdminOrderList(
    "adminEventOrdersList",
    activeEvents,
    "Geen actieve evenementaanvragen."
  );


  renderMaterialOutList(
    materialOut
  );


  renderAdminWholesaleOrders();


  renderAdminOrderList(
    "adminArchiveList",
    archive,
    "Nog geen afgehandelde aanvragen."
  );

}



/* ============================================================
   COUNT
============================================================ */

function setAdminCount(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (
    element
  ) {

    element.innerText =
      value;

  }

}



/* ============================================================
   ORDER LIST
============================================================ */

function renderAdminOrderList(
  containerId,
  orders,
  emptyMessage
) {

  const container =
    document.getElementById(
      containerId
    );


  if (
    !container
  ) {

    return;

  }


  if (
    !orders.length
  ) {

    container.innerHTML = `

      <div class="empty">
        ${adminEscapeHtml(
          emptyMessage
        )}
      </div>

    `;


    return;

  }


  container.innerHTML =

    orders

      .map(
        order =>
          adminOrderCard(
            order
          )
      )

      .join("");

}



/* ============================================================
   ORDER CARD
============================================================ */

function adminOrderCard(
  order
) {

  const representative =
    getAdminProfile(
      order.user_id
    );


  const items =
    getAdminOrderItems(
      order.id
    );


  const reference =
    createOrderReference(
      order.id,
      order.created_at
    );


  const total =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum
        +
        Number(
          item.aantal
          ||
          0
        ),
      0
    );


  return `

    <button
      type="button"
      onclick="openAdminOrder('${order.id}')"
      style="
        display:block;
        width:100%;
        text-align:left;
        border:1px solid var(--border);
        background:white;
        border-radius:16px;
        padding:14px;
        margin-top:10px;
        color:var(--text);
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:10px;
        "
      >

        <div
          style="
            font-size:12px;
            font-weight:900;
            color:var(--gold);
          "
        >
          ${reference}
        </div>


        <div
          class="status ${adminStatusClass(order.status)}"
        >
          ${formatStatus(
            order.status
          )}
        </div>

      </div>


      <div
        style="
          margin-top:9px;
          font-size:17px;
          font-weight:850;
        "
      >
        ${adminEscapeHtml(
          order.event_naam
          ||
          order.referentie
          ||
          "Geen referentie"
        )}
      </div>


      <div class="order-meta">

        ${adminEscapeHtml(
          representative?.naam
          ||
          "Onbekende gebruiker"
        )}

      </div>


      ${
        order.event_naam

          ? `

              <div class="order-meta">

                ${adminEscapeHtml(
                  order.event_vanaf
                  ||
                  ""
                )}

                t/m

                ${adminEscapeHtml(
                  order.event_tot
                  ||
                  ""
                )}

              </div>

            `

          : `

              <div class="order-meta">

                ${adminEscapeHtml(
                  order.gemeente
                  ||
                  order.land
                  ||
                  ""
                )}

              </div>

            `
      }


      <div class="order-meta">

        ${total}
        item(s)

      </div>

    </button>

  `;

}



/* ============================================================
   MATERIAAL BUITEN
============================================================ */

function renderMaterialOutList(
  orders
) {

  const container =
    document.getElementById(
      "adminMaterialOutList"
    );


  if (
    !container
  ) {

    return;

  }


  if (
    !orders.length
  ) {

    container.innerHTML = `

      <div class="info ok">

        Momenteel staat er geen evenementmateriaal buiten.

      </div>

    `;


    return;

  }


  container.innerHTML =

    orders

      .map(
        order =>
          materialOutCard(
            order
          )
      )

      .join("");

}



/* ============================================================
   MATERIAAL BUITEN CARD
============================================================ */

function materialOutCard(
  order
) {

  const representative =
    getAdminProfile(
      order.user_id
    );


  const items =
    getAdminOrderItems(
      order.id
    );


  return `

    <div
      style="
        border:1px solid var(--border);
        border-radius:16px;
        padding:14px;
        margin-top:10px;
        background:white;
      "
    >

      <div
        style="
          font-size:17px;
          font-weight:900;
        "
      >
        ${adminEscapeHtml(
          order.event_naam
        )}
      </div>


      <div class="order-meta">

        ${adminEscapeHtml(
          representative?.naam
          ||
          "Onbekend"
        )}

      </div>


      <div class="order-meta">

        Evenement:

        ${adminEscapeHtml(
          order.event_vanaf
          ||
          ""
        )}

        t/m

        ${adminEscapeHtml(
          order.event_tot
          ||
          ""
        )}

      </div>


      ${
        items

          .map(
            item => `

              <div class="summary-line">

                <span>

                  ${adminEscapeHtml(
                    item.product_naam
                  )}

                </span>


                <strong>

                  ${item.aantal}

                </strong>

              </div>

            `
          )

          .join("")
      }


      <button
        class="primary"
        type="button"
        onclick="markEventMaterialReturned('${order.id}')"
        style="
          margin-top:14px;
        "
      >
        Materiaal volledig terug
      </button>


      <button
        class="secondary"
        type="button"
        onclick="openAdminOrder('${order.id}')"
      >
        Bekijk aanvraag
      </button>

    </div>

  `;

}



/* ============================================================
   EVENT TERUG
============================================================ */

async function markEventMaterialReturned(
  orderId
) {

  const confirmed =
    window.confirm(

      "Bevestig dat al het materiaal van dit evenement terug in Achel is."

    );


  if (
    !confirmed
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient

      .rpc(
        "mark_event_material_returned",
        {
          p_order_id:
            orderId
        }
      );


  if (
    error
  ) {

    alert(

      "Materiaal kon niet als terug gemarkeerd worden: "

      +

      error.message

    );


    return;

  }


  await loadAdminDashboard();


  alert(
    "Materiaal is geregistreerd als terug."
  );

}



/* ============================================================
   EVENT TERUG ONGEDAAN
============================================================ */

async function undoEventMaterialReturned(
  orderId
) {

  const confirmed =
    window.confirm(
      "Wil je de terugmelding ongedaan maken?"
    );


  if (
    !confirmed
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient

      .rpc(
        "undo_event_material_returned",
        {
          p_order_id:
            orderId
        }
      );


  if (
    error
  ) {

    alert(
      error.message
    );


    return;

  }


  await loadAdminDashboard();

}



/* ============================================================
   GROOTHANDEL
============================================================ */

function renderAdminWholesaleOrders() {

  const container =
    document.getElementById(
      "adminWholesaleOrdersList"
    );


  if (
    !container
  ) {

    return;

  }


  if (
    !adminWholesaleOrders.length
  ) {

    container.innerHTML = `

      <div class="empty">

        Nog geen groothandelbestellingen.

      </div>

    `;


    return;

  }


  container.innerHTML =

    adminWholesaleOrders

      .map(
        order => {

          const rep =
            getAdminProfile(
              order.user_id
            );


          const items =
            adminWholesaleItems.filter(
              item =>
                item.wholesale_order_id ===
                order.id
            );


          return `

            <details
              class="wholesale-admin-order"
            >

              <summary>

                <strong>

                  ${adminEscapeHtml(
                    order.referentie
                  )}

                </strong>


                <div class="order-meta">

                  ${adminEscapeHtml(
                    rep?.naam
                    ||
                    "Onbekend"
                  )}

                  ·

                  ${adminEscapeHtml(
                    order.drankenhandel
                    ||
                    ""
                  )}

                </div>

              </summary>


              <div class="wholesale-admin-body">


                ${
                  items

                    .map(
                      item => `

                        <div class="summary-line">

                          <span>

                            ${adminEscapeHtml(
                              item.product_naam
                            )}

                          </span>


                          <strong>

                            ${Number(
                              item.totaal_aantal
                              ||
                              item.betaald_aantal
                              ||
                              0
                            )}

                          </strong>

                        </div>

                        ${
                          item.actie
                          &&
                          item.actie !==
                          "geen"

                            ? `

                                <div class="order-meta">

                                  Actie:
                                  ${adminEscapeHtml(
                                    item.actie
                                  )}

                                  · Betaald:
                                  ${item.betaald_aantal}

                                  · Gratis:
                                  ${item.gratis_aantal}

                                </div>

                              `

                            : ""
                        }

                      `
                    )

                    .join("")
                }

              </div>

            </details>

          `;

        }
      )

      .join("");

}



/* ============================================================
   ORDER OPENEN
============================================================ */

async function openAdminOrder(
  orderId
) {

  let order =
    adminOrders.find(
      item =>
        item.id ===
        orderId
    );


  if (
    !order
  ) {

    return;

  }


  /*
    Alleen NIEUW automatisch
    naar IN BEHANDELING.
  */

  if (
    order.status ===
    "nieuw"
  ) {

    const {
      data,
      error
    } =
      await supabaseClient

        .from(
          "orders"
        )

        .update({
          status:
            "in_behandeling"
        })

        .eq(
          "id",
          order.id
        )

        .select(`
          id,
          user_id,
          referentie,
          land,
          gemeente,
          afhaaldatum,
          opmerking,
          status,
          event_naam,
          event_vanaf,
          event_tot,
          event_returned_at,
          event_returned_by,
          opened_at,
          completed_at,
          collected_at,
          created_at,
          updated_at
        `)

        .single();


    if (
      !error
    ) {

      order =
        data;


      updateLocalAdminOrder(
        data
      );

    }

  }


  selectedAdminOrder =
    order;


  renderAdminDetail(
    order
  );


  showOnly(
    "adminDetailScreen"
  );


  renderAdminStatistics();

}



/* ============================================================
   DETAIL
============================================================ */

function renderAdminDetail(
  order
) {

  const container =
    document.getElementById(
      "adminDetailContent"
    );


  const representative =
    getAdminProfile(
      order.user_id
    );


  const items =
    getAdminOrderItems(
      order.id
    );


  const beer =
    items.filter(
      item =>
        item.categorie ===
        "bier"
    );


  const pos =
    items.filter(
      item =>
        item.categorie ===
        "pos"
    );


  const events =
    items.filter(
      item =>
        item.categorie ===
        "evenement"
    );


  container.innerHTML = `

    <div class="card">

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:12px;
        "
      >

        <div>

          <div
            style="
              font-size:12px;
              font-weight:900;
              color:var(--gold);
            "
          >

            ${createOrderReference(
              order.id,
              order.created_at
            )}

          </div>


          <h2
            style="
              margin-top:6px;
            "
          >

            ${adminEscapeHtml(
              order.event_naam
              ||
              order.referentie
              ||
              "Aanvraag"
            )}

          </h2>

        </div>


        <div
          class="status ${adminStatusClass(order.status)}"
        >

          ${formatStatus(
            order.status
          )}

        </div>

      </div>


      ${adminDetailRow(
        "Vertegenwoordiger",
        representative?.naam
        ||
        "Onbekend"
      )}


      ${adminDetailRow(
        "E-mail",
        representative?.email
        ||
        ""
      )}


      ${
        order.event_naam

          ? `

              ${adminDetailRow(
                "Materiaal vanaf",
                order.event_vanaf
                ||
                ""
              )}

              ${adminDetailRow(
                "Materiaal t/m",
                order.event_tot
                ||
                ""
              )}

            `

          : `

              ${adminDetailRow(
                "Land",
                order.land
                ||
                ""
              )}

              ${adminDetailRow(
                "Gemeente",
                order.gemeente
                ||
                ""
              )}

              ${adminDetailRow(
                "Afhaaldatum",
                order.afhaaldatum
                ||
                ""
              )}

            `
      }

    </div>


    ${adminCategoryCard(
      "BIER",
      beer
    )}


    ${adminCategoryCard(
      "POS-MATERIALEN",
      pos
    )}


    ${adminCategoryCard(
      "EVENEMENTENMATERIAAL",
      events
    )}


    ${
      order.opmerking

        ? `

            <div class="card">

              <h2>
                Opmerking
              </h2>

              ${adminEscapeHtml(
                order.opmerking
              )}

            </div>

          `

        : ""
    }


    ${
      buildEventReturnCard(
        order
      )
    }


    <div class="card">

      <h2>
        Status
      </h2>


      ${adminStatusTimeline(
        order
      )}


      ${adminActionButtons(
        order
      )}

    </div>

  `;

}



/* ============================================================
   EVENT RETURN CARD
============================================================ */

function buildEventReturnCard(
  order
) {

  if (
    !order.event_naam
  ) {

    return "";

  }


  if (
    order.event_returned_at
  ) {

    return `

      <div class="card">

        <h2>
          Materiaal retour
        </h2>


        <div class="info ok">

          Materiaal terug sinds:

          <strong>

            ${adminFormatDateTime(
              order.event_returned_at
            )}

          </strong>

        </div>


        <button
          class="secondary"
          type="button"
          onclick="undoEventMaterialReturned('${order.id}')"
        >

          Terugmelding ongedaan maken

        </button>

      </div>

    `;

  }


  if (
    order.status ===
    "afgehaald"
  ) {

    return `

      <div class="card">

        <h2>
          Materiaal retour
        </h2>


        <div class="info">

          Dit materiaal staat nog geregistreerd als buiten.

        </div>


        <button
          class="primary"
          type="button"
          onclick="markEventMaterialReturned('${order.id}')"
        >

          Materiaal volledig terug

        </button>

      </div>

    `;

  }


  return "";

}



/* ============================================================
   DETAIL RIJ
============================================================ */

function adminDetailRow(
  label,
  value
) {

  return `

    <div
      style="
        margin-top:12px;
      "
    >

      <div
        style="
          font-size:11px;
          font-weight:900;
          color:var(--muted);
          text-transform:uppercase;
        "
      >
        ${label}
      </div>


      <div
        style="
          font-weight:700;
          margin-top:2px;
        "
      >

        ${adminEscapeHtml(
          value
        )}

      </div>

    </div>

  `;

}



/* ============================================================
   CATEGORY CARD
============================================================ */

function adminCategoryCard(
  title,
  items
) {

  if (
    !items.length
  ) {

    return "";

  }


  return `

    <div class="card">

      <h2>
        ${title}
      </h2>


      ${
        items

          .map(
            item => `

              <div class="summary-line">

                <span>

                  ${adminEscapeHtml(
                    item.product_naam
                  )}

                </span>


                <strong>

                  ${item.aantal}

                </strong>

              </div>

            `
          )

          .join("")
      }

    </div>

  `;

}



/* ============================================================
   STATUS TIMELINE
============================================================ */

function adminStatusTimeline(
  order
) {

  return `

    <div
      style="
        display:grid;
        gap:8px;
        margin-bottom:18px;
      "
    >

      ${adminTimelineRow(
        "Aangevraagd",
        order.created_at,
        true
      )}


      ${adminTimelineRow(
        "In behandeling",
        order.opened_at,
        Boolean(
          order.opened_at
        )
      )}


      ${adminTimelineRow(
        "Klaar",
        order.completed_at,
        Boolean(
          order.completed_at
        )
      )}


      ${adminTimelineRow(
        "Afgehaald",
        order.collected_at,
        Boolean(
          order.collected_at
        )
      )}


      ${
        order.event_naam

          ? adminTimelineRow(
              "Materiaal terug",
              order.event_returned_at,
              Boolean(
                order.event_returned_at
              )
            )

          : ""
      }

    </div>

  `;

}



/* ============================================================
   TIMELINE ROW
============================================================ */

function adminTimelineRow(
  label,
  date,
  active
) {

  return `

    <div
      style="
        display:grid;
        grid-template-columns:12px 1fr;
        gap:10px;
      "
    >

      <div
        style="
          width:10px;
          height:10px;
          border-radius:50%;
          margin-top:5px;
          background:${
            active
              ? "var(--green)"
              : "var(--border)"
          };
        "
      >
      </div>


      <div>

        <strong>
          ${label}
        </strong>


        ${
          date

            ? `

                <div class="order-meta">

                  ${adminFormatDateTime(
                    date
                  )}

                </div>

              `

            : ""
        }

      </div>

    </div>

  `;

}



/* ============================================================
   ACTION BUTTONS
============================================================ */

function adminActionButtons(
  order
) {

  if (
    order.status ===
    "in_behandeling"
  ) {

    return `

      <button
        class="primary"
        type="button"
        onclick="markAdminOrderCompleted()"
      >

        Voltooid · Klaar voor afhaling

      </button>

    `;

  }


  if (
    order.status ===
    "klaar"
  ) {

    return `

      <button
        class="primary"
        type="button"
        onclick="markAdminOrderCollected()"
      >

        Markeer als afgehaald

      </button>

    `;

  }


  return "";

}



/* ============================================================
   STATUS UPDATE
============================================================ */

async function markAdminOrderCompleted() {

  await updateSelectedAdminOrderStatus(
    "klaar"
  );

}



async function markAdminOrderCollected() {

  await updateSelectedAdminOrderStatus(
    "afgehaald"
  );

}



async function updateSelectedAdminOrderStatus(
  status
) {

  if (
    !selectedAdminOrder
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from(
        "orders"
      )

      .update({
        status:
          status
      })

      .eq(
        "id",
        selectedAdminOrder.id
      )

      .select(`
        id,
        user_id,
        referentie,
        land,
        gemeente,
        afhaaldatum,
        opmerking,
        status,
        event_naam,
        event_vanaf,
        event_tot,
        event_returned_at,
        event_returned_by,
        opened_at,
        completed_at,
        collected_at,
        created_at,
        updated_at
      `)

      .single();


  if (
    error
  ) {

    alert(
      error.message
    );


    return;

  }


  updateLocalAdminOrder(
    data
  );


  selectedAdminOrder =
    data;


  renderAdminDetail(
    data
  );


  renderAdminStatistics();

}



/* ============================================================
   RAPPORT JAAR
============================================================ */

function fillReportYears() {

  const select =
    document.getElementById(
      "reportYear"
    );


  if (
    !select
  ) {

    return;

  }


  const currentYear =
    new Date()
      .getFullYear();


  select.innerHTML =
    "";


  for (
    let year =
      currentYear;

    year >=
    currentYear - 5;

    year--
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      year;


    option.innerText =
      year;


    select.appendChild(
      option
    );

  }

}



/* ============================================================
   CURRENT MONTH
============================================================ */

function setCurrentReportMonth() {

  const month =
    document.getElementById(
      "reportMonth"
    );


  if (
    month
  ) {

    month.value =
      new Date()
        .getMonth()
      +
      1;

  }

}



/* ============================================================
   REPORT PERIOD
============================================================ */

function toggleReportPeriod() {

  const type =
    document
      .getElementById(
        "reportPeriodType"
      )
      .value;


  document
    .getElementById(
      "reportMonthBox"
    )
    .classList
    .toggle(
      "hidden",
      type ===
      "year"
    );


  updateAdminReport();

}



/* ============================================================
   RAPPORT ORDERS
============================================================ */

function getReportOrders() {

  const representative =
    document
      .getElementById(
        "reportRepresentative"
      )
      ?.value
    ||
    "";


  const type =
    document
      .getElementById(
        "reportPeriodType"
      )
      ?.value
    ||
    "month";


  const year =
    Number(
      document
        .getElementById(
          "reportYear"
        )
        ?.value
    );


  const month =
    Number(
      document
        .getElementById(
          "reportMonth"
        )
        ?.value
    );


  return adminOrders.filter(
    order => {


      /*
        Alleen werkelijk afgehaald.
      */

      if (
        order.status !==
        "afgehaald"
      ) {

        return false;

      }


      if (
        representative

        &&

        order.user_id !==
        representative
      ) {

        return false;

      }


      if (
        !order.collected_at
      ) {

        return false;

      }


      const date =
        new Date(
          order.collected_at
        );


      if (
        date.getFullYear() !==
        year
      ) {

        return false;

      }


      if (
        type ===
        "month"

        &&

        date.getMonth() + 1 !==
        month
      ) {

        return false;

      }


      return true;

    }
  );

}



/* ============================================================
   AGGREGATIE MATERIALEN
============================================================ */

function getReportMaterialTotals() {

  const orders =
    getReportOrders();


  const ids =
    new Set(
      orders.map(
        order =>
          order.id
      )
    );


  const totals =
    {};


  adminItems

    .filter(
      item =>
        ids.has(
          item.order_id
        )
    )

    .forEach(
      item => {

        const name =
          item.product_naam
          ||
          "Onbekend";


        if (
          !totals[
            name
          ]
        ) {

          totals[
            name
          ] =
            0;

        }


        totals[
          name
        ] +=
          Number(
            item.aantal
            ||
            0
          );

      }
    );


  return totals;

}



/* ============================================================
   UPDATE REPORT
============================================================ */

function updateAdminReport() {

  const summary =
    document.getElementById(
      "adminReportSummary"
    );


  if (
    !summary
  ) {

    return;

  }


  const orders =
    getReportOrders();


  const totals =
    getReportMaterialTotals();


  const totalMaterials =
    Object.values(
      totals
    )
      .reduce(
        (
          sum,
          amount
        ) =>
          sum
          +
          amount,
        0
      );


  summary.innerHTML = `

    <div
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      "
    >

      ${adminStatCard(
        "Afgehaalde aanvragen",
        orders.length
      )}


      ${adminStatCard(
        "Materialen / producten",
        totalMaterials
      )}

    </div>

  `;


  renderAdminReportChart(
    totals
  );

}



/* ============================================================
   GRAFIEK
============================================================ */

function renderAdminReportChart(
  totals
) {

  const canvas =
    document.getElementById(
      "adminMaterialsChart"
    );


  if (
    !canvas

    ||

    typeof Chart ===
    "undefined"
  ) {

    return;

  }


  if (
    adminReportChart
  ) {

    adminReportChart.destroy();

  }


  const entries =
    Object.entries(
      totals
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1]
          -
          a[1]
      );


  adminReportChart =
    new Chart(
      canvas,
      {

        type:
          "bar",


        data: {

          labels:
            entries.map(
              item =>
                item[0]
            ),

          datasets: [

            {
              label:
                "Afgehaald aantal",

              data:
                entries.map(
                  item =>
                    item[1]
                )
            }

          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          indexAxis:
            "y",

          plugins: {

            legend: {
              display:
                false
            }

          },

          scales: {

            x: {
              beginAtZero:
                true
            }

          }

        }

      }
    );

}



/* ============================================================
   EXCEL EXPORT
============================================================ */

function exportAdminReportExcel() {

  if (
    typeof XLSX ===
    "undefined"
  ) {

    alert(
      "Excel-module kon niet worden geladen."
    );


    return;

  }


  const orders =
    getReportOrders();


  if (
    !orders.length
  ) {

    alert(
      "Er zijn geen afgehaalde aanvragen voor deze periode."
    );


    return;

  }


  const rows =
    [];


  orders.forEach(
    order => {

      const profile =
        getAdminProfile(
          order.user_id
        );


      const items =
        getAdminOrderItems(
          order.id
        );


      items.forEach(
        item => {

          rows.push({

            "Afhaaldatum":
              formatExcelDate(
                order.collected_at
              ),

            "Vertegenwoordiger":
              profile?.naam
              ||
              "",

            "E-mail":
              profile?.email
              ||
              "",

            "Type":
              order.event_naam

                ? "Evenement"

                : (
                    item.categorie ===
                    "bier"

                      ? "Bier"

                      : "POS"
                  ),

            "Referentie / evenement":
              order.event_naam
              ||
              order.referentie
              ||
              "",

            "Gemeente":
              order.gemeente
              ||
              "",

            "Product / materiaal":
              item.product_naam
              ||
              "",

            "Categorie":
              item.categorie
              ||
              "",

            "Aantal":
              Number(
                item.aantal
                ||
                0
              ),

            "Status":
              "Afgehaald",

            "Event vanaf":
              order.event_vanaf
              ||
              "",

            "Event tot":
              order.event_tot
              ||
              "",

            "Materiaal terug":
              order.event_returned_at

                ? formatExcelDate(
                    order.event_returned_at
                  )

                : ""

          });

        }
      );

    }
  );


  const worksheet =
    XLSX.utils
      .json_to_sheet(
        rows
      );


  worksheet[
    "!cols"
  ] = [

    { wch: 16 },
    { wch: 22 },
    { wch: 32 },
    { wch: 15 },
    { wch: 30 },
    { wch: 20 },
    { wch: 32 },
    { wch: 16 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 }

  ];


  const workbook =
    XLSX.utils
      .book_new();


  XLSX.utils
    .book_append_sheet(
      workbook,
      worksheet,
      "Afgehaald"
    );


  /*
    Extra samenvattingssheet.
  */

  const totals =
    getReportMaterialTotals();


  const summaryRows =
    Object.entries(
      totals
    )

      .sort(
        (
          a,
          b
        ) =>
          b[1]
          -
          a[1]
      )

      .map(
        item => ({

          "Materiaal / product":
            item[0],

          "Totaal afgehaald":
            item[1]

        })
      );


  const summarySheet =
    XLSX.utils
      .json_to_sheet(
        summaryRows
      );


  XLSX.utils
    .book_append_sheet(
      workbook,
      summarySheet,
      "Samenvatting"
    );


  const representativeId =
    document
      .getElementById(
        "reportRepresentative"
      )
      ?.value;


  const representative =
    representativeId

      ? getAdminProfile(
          representativeId
        )?.naam

      : "Alle";


  const periodType =
    document
      .getElementById(
        "reportPeriodType"
      )
      ?.value;


  const year =
    document
      .getElementById(
        "reportYear"
      )
      ?.value;


  const month =
    document
      .getElementById(
        "reportMonth"
      )
      ?.value;


  let filename =

    `Achel_${safeFilename(
      representative
    )}_${year}`;


  if (
    periodType ===
    "month"
  ) {

    filename +=
      `_${String(month).padStart(2,"0")}`;

  }


  filename +=
    ".xlsx";


  XLSX.writeFile(
    workbook,
    filename
  );

}



/* ============================================================
   EXCEL HELPERS
============================================================ */

function formatExcelDate(
  date
) {

  if (
    !date
  ) {

    return "";

  }


  return new Date(
    date
  )
    .toLocaleString(
      "nl-BE"
    );

}



function safeFilename(
  value
) {

  return String(
    value
    ||
    "Rapport"
  )
    .replace(
      /[^a-z0-9_-]/gi,
      "_"
    );

}



/* ============================================================
   ORDER ITEMS
============================================================ */

function getAdminOrderItems(
  orderId
) {

  return adminItems.filter(
    item =>
      item.order_id ===
      orderId
  );

}



/* ============================================================
   UPDATE LOCAL
============================================================ */

function updateLocalAdminOrder(
  updatedOrder
) {

  const index =
    adminOrders.findIndex(
      order =>
        order.id ===
        updatedOrder.id
    );


  if (
    index !==
    -1
  ) {

    adminOrders[
      index
    ] =
      updatedOrder;

  }

}



/* ============================================================
   PROFILE
============================================================ */

function getAdminProfile(
  id
) {

  return adminProfiles.find(
    profile =>
      profile.id ===
      id
  );

}



/* ============================================================
   STATUS CLASS
============================================================ */

function adminStatusClass(
  status
) {

  if (
    status ===
    "klaar"

    ||

    status ===
    "afgehaald"
  ) {

    return "status-klaar";

  }


  if (
    status ===
    "geannuleerd"
  ) {

    return "status-geannuleerd";

  }


  return "";

}



/* ============================================================
   DATE
============================================================ */

function adminFormatDateTime(
  date
) {

  if (
    !date
  ) {

    return "";

  }


  return new Date(
    date
  )
    .toLocaleString(
      "nl-BE",
      {

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit"

      }
    );

}



/* ============================================================
   ESCAPE HTML
============================================================ */

function adminEscapeHtml(
  value
) {

  return String(
    value
    ??
    ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}



/* ============================================================
   AUTOMATISCH STARTEN
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      initAdminModule,
      400
    );

  }
);


supabaseClient
  .auth
  .onAuthStateChange(
    () => {

      setTimeout(
        initAdminModule,
        400
      );

    }
  );


setTimeout(
  initAdminModule,
  1000
);
