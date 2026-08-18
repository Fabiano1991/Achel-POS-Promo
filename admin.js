/* ============================================================
   ACHEL POS - ADMIN.JS
   DASHBOARD + RETOURBEHEER + RAPPORTERING
============================================================ */


/* ============================================================
   DATA
============================================================ */

let adminOrders = [];
let adminProfiles = [];
let adminItems = [];

let adminEventReturns = [];

let adminWholesaleOrders = [];
let adminWholesaleItems = [];

let selectedAdminOrder = null;

let adminReportChart = null;


/* ============================================================
   START ADMIN
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
      userError ||
      !userData?.user
    ) {

      return;

    }


    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient

        .from("profiles")

        .select(
          "id, naam, email, rol, actief"
        )

        .eq(
          "id",
          userData.user.id
        )

        .single();


    if (
      profileError ||
      !profile
    ) {

      console.error(
        "ADMIN PROFIEL FOUT:",
        profileError
      );

      return;

    }


    if (
      profile.rol !== "admin" &&
      profile.rol !== "verantwoordelijke"
    ) {

      return;

    }


    createAdminScreen();

  }

  catch (error) {

    console.error(
      "ADMIN INIT FOUT:",
      error
    );

  }

}


/* ============================================================
   DASHBOARD SCHERM MAKEN
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


  if (!appMain) {
    return;
  }


  injectAdminDashboardStyles();


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "adminScreen";


  section.className =
    "hidden admin-shell";


  section.innerHTML = `

    <!-- =========================
         ADMIN TOP
    ========================== -->

    <div class="admin-topbar">

      <div class="admin-topbar-title">

        <strong>
          Achel POS
        </strong>

        <span>
          Beheerdersoverzicht
        </span>

      </div>


      <button
        class="admin-refresh-button"
        type="button"
        onclick="loadAdminDashboard()"
        aria-label="Dashboard vernieuwen"
      >
        ↻
      </button>

    </div>


    <!-- =========================
         NAVIGATIE
    ========================== -->

    <div class="admin-tabs">

      <button
        id="adminTabOverview"
        class="admin-tab active"
        type="button"
        onclick="switchAdminTab('overview')"
      >
        Overzicht
      </button>


      <button
        id="adminTabRequests"
        class="admin-tab"
        type="button"
        onclick="switchAdminTab('requests')"
      >
        Aanvragen
      </button>


      <button
        id="adminTabMaterial"
        class="admin-tab"
        type="button"
        onclick="switchAdminTab('material')"
      >
        Materiaal
      </button>


      <button
        id="adminTabReports"
        class="admin-tab"
        type="button"
        onclick="switchAdminTab('reports')"
      >
        Rapporten
      </button>

    </div>


    <!-- =====================================================
         TAB 1 - OVERZICHT
    ====================================================== -->

    <div
      id="adminPaneOverview"
      class="admin-pane"
    >

      <!-- KPI -->

      <div
        id="adminStatistics"
        class="admin-kpi-grid"
      ></div>


      <!-- ACTIE NODIG -->

      <section class="admin-section">

        <div class="admin-section-heading">

          <div>

            <span class="admin-eyebrow">
              Prioriteit
            </span>

            <h3>
              Actie nodig
            </h3>

          </div>

        </div>


        <div
          id="adminAttentionPanel"
          class="admin-attention-grid"
        ></div>

      </section>


      <!-- AANVRAGEN -->

      <section class="admin-section">

        <div class="admin-section-heading">

          <div>

            <span class="admin-eyebrow">
              Beheer aanvragen
            </span>

            <h3>
              Aanvragen
            </h3>

          </div>


          <button
            class="admin-inline-link"
            type="button"
            onclick="switchAdminTab('requests')"
          >
            Bekijk alles ›
          </button>

        </div>


        <button
          class="admin-action-card requests"
          type="button"
          onclick="switchAdminTab('requests')"
        >

          <div class="admin-card-icon">
            ▣
          </div>


          <div class="admin-card-main">

            <strong>
              Alle aanvragen
            </strong>

            <div class="admin-mini-badges">

              <span class="admin-mini-badge green">

                POS

                <b id="overviewRegularCount">
                  0
                </b>

              </span>


              <span class="admin-mini-badge orange">

                Event

                <b id="overviewEventCount">
                  0
                </b>

              </span>


              <span class="admin-mini-badge purple">

                Groothandel

                <b id="overviewWholesaleCount">
                  0
                </b>

              </span>

            </div>

          </div>


          <div class="admin-card-arrow">
            ›
          </div>

        </button>

      </section>


      <!-- MATERIAAL -->

      <section class="admin-section">

        <div class="admin-section-heading">

          <div>

            <span class="admin-eyebrow">
              Logistiek
            </span>

            <h3>
              Materiaalbeheer
            </h3>

          </div>


          <button
            class="admin-inline-link"
            type="button"
            onclick="switchAdminTab('material')"
          >
            Open ›
          </button>

        </div>


        <button
          class="admin-action-card material"
          type="button"
          onclick="switchAdminTab('material')"
        >

          <div class="admin-card-icon">
            ◈
          </div>


          <div class="admin-card-main">

            <strong>
              Materiaal
            </strong>


            <div class="admin-mini-badges">

              <span class="admin-mini-badge orange">

                Buiten

                <b id="overviewMaterialOutCount">
                  0
                </b>

              </span>


              <span class="admin-mini-badge red">

                Schade / ontbreekt

                <b id="overviewProblemsCount">
                  0
                </b>

              </span>

            </div>

          </div>


          <div class="admin-card-arrow">
            ›
          </div>

        </button>

      </section>


      <!-- RAPPORTAGE -->

      <section class="admin-section">

        <div class="admin-section-heading">

          <div>

            <span class="admin-eyebrow">
              Analyse
            </span>

            <h3>
              Beheer
            </h3>

          </div>

        </div>


        <button
          class="admin-action-card reports"
          type="button"
          onclick="switchAdminTab('reports')"
        >

          <div class="admin-card-icon">
            ↗
          </div>


          <div class="admin-card-main">

            <strong>
              Rapportage
            </strong>

            <span>
              Maand, jaar, vertegenwoordiger en Excel
            </span>

          </div>


          <div class="admin-card-arrow">
            ›
          </div>

        </button>


        <button
          class="admin-action-card archive"
          type="button"
          onclick="switchAdminTab('requests'); openAdminArchive();"
        >

          <div class="admin-card-icon">
            ▤
          </div>


          <div class="admin-card-main">

            <strong>
              Archief
            </strong>

            <span>
              Afgehandelde aanvragen
            </span>

          </div>


          <div
            id="overviewArchiveCount"
            class="admin-side-count"
          >
            0
          </div>


          <div class="admin-card-arrow">
            ›
          </div>

        </button>

      </section>

    </div>


    <!-- =====================================================
         TAB 2 - AANVRAGEN
    ====================================================== -->

    <div
      id="adminPaneRequests"
      class="admin-pane hidden"
    >

      <div class="admin-page-heading">

        <div>

          <span class="admin-eyebrow">
            Operationeel
          </span>

          <h2>
            Aanvragen
          </h2>

        </div>

      </div>


      <!-- ZOEKEN -->

      <div class="admin-search-row">

        <input
          id="adminSearch"
          class="admin-search"
          type="text"
          placeholder="Zoeken..."
          oninput="renderAdminSections()"
        >


        <button
          class="admin-filter-button"
          type="button"
          onclick="toggleAdminFilters()"
        >
          ☰
        </button>

      </div>


      <div
        id="adminFiltersPanel"
        class="admin-filter-panel hidden"
      >

        <div class="admin-filter-grid">

          <div>

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

          </div>


          <div>

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

          </div>

        </div>

      </div>


      <!-- POS / BIER -->

      <details
        class="admin-list-panel"
        open
      >

        <summary>

          <div>

            <span class="admin-dot green"></span>

            POS & bier

          </div>


          <span
            id="adminRegularCount"
            class="admin-count green"
          >
            0
          </span>

        </summary>


        <div class="admin-list-content">

          <div id="adminRegularOrdersList">

            <div class="empty">
              Laden...
            </div>

          </div>

        </div>

      </details>


      <!-- EVENT -->

      <details class="admin-list-panel">

        <summary>

          <div>

            <span class="admin-dot orange"></span>

            Evenementen

          </div>


          <span
            id="adminEventCount"
            class="admin-count orange"
          >
            0
          </span>

        </summary>


        <div class="admin-list-content">

          <div id="adminEventOrdersList">

            <div class="empty">
              Laden...
            </div>

          </div>

        </div>

      </details>


      <!-- GROOTHANDEL -->

      <details class="admin-list-panel">

        <summary>

          <div>

            <span class="admin-dot purple"></span>

            Groothandel

          </div>


          <span
            id="adminWholesaleCount"
            class="admin-count purple"
          >
            0
          </span>

        </summary>


        <div class="admin-list-content">

          <div id="adminWholesaleOrdersList">

            <div class="empty">
              Laden...
            </div>

          </div>

        </div>

      </details>


      <!-- ARCHIEF -->

      <details
        id="adminArchivePanel"
        class="admin-list-panel"
      >

        <summary>

          <div>

            <span class="admin-dot grey"></span>

            Archief
          </div>


          <span
            id="adminArchiveCount"
            class="admin-count grey"
          >
            0
          </span>

        </summary>


        <div class="admin-list-content">

          <div id="adminArchiveList">

            <div class="empty">
              Laden...
            </div>

          </div>

        </div>

      </details>

    </div>


    <!-- =====================================================
         TAB 3 - MATERIAAL
    ====================================================== -->

    <div
      id="adminPaneMaterial"
      class="admin-pane hidden"
    >

      <div class="admin-page-heading">

        <div>

          <span class="admin-eyebrow">
            Logistiek
          </span>

          <h2>
            Materiaal
          </h2>

        </div>

      </div>


      <div class="admin-material-summary">

        <div class="admin-material-summary-card orange">

          <span>
            Momenteel buiten
          </span>

          <strong id="adminMaterialOutCount">
            0
          </strong>

        </div>


        <div class="admin-material-summary-card red">

          <span>
            Schade / ontbreekt
          </span>

          <strong id="adminProblemsCount">
            0
          </strong>

        </div>

      </div>


      <section class="admin-section compact">

        <div class="admin-section-heading">

          <h3>
            Materiaal buiten
          </h3>

        </div>


        <div id="adminMaterialOutList">

          <div class="empty">
            Laden...
          </div>

        </div>

      </section>


      <section class="admin-section compact">

        <div class="admin-section-heading">

          <h3>
            Schade & ontbrekend
          </h3>

        </div>


        <div id="adminProblemsList">

          <div class="empty">
            Laden...
          </div>

        </div>

      </section>

    </div>


    <!-- =====================================================
         TAB 4 - RAPPORTEN
    ====================================================== -->

    <div
      id="adminPaneReports"
      class="admin-pane hidden"
    >

      <div class="admin-page-heading">

        <div>

          <span class="admin-eyebrow">
            Analyse
          </span>

          <h2>
            Rapportage
          </h2>

        </div>

      </div>


      <div class="admin-report-panel">

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


        <div class="admin-filter-grid">

          <div>

            <label>
              Periode
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

          </div>


          <div id="reportMonthBox">

            <label>
              Maand
            </label>


            <select
              id="reportMonth"
              onchange="updateAdminReport()"
            >

              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maart</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Augustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">December</option>

            </select>

          </div>

        </div>


        <label>
          Jaar
        </label>


        <select
          id="reportYear"
          onchange="updateAdminReport()"
        ></select>


        <div id="adminReportSummary"></div>


        <div class="admin-chart-box">

          <canvas
            id="adminMaterialsChart"
          ></canvas>

        </div>


        <button
          class="admin-export-button"
          type="button"
          onclick="exportAdminReportExcel()"
        >
          Excel downloaden
        </button>

      </div>

    </div>

  `;


  appMain.appendChild(
    section
  );


  createAdminDetailScreen();

}


/* ============================================================
   DETAIL SCHERM
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


  if (!appMain) {

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
    ></div>

  `;


  appMain.appendChild(
    section
  );

}


/* ============================================================
   OPEN DASHBOARD
============================================================ */

async function openAdminDashboard() {

  try {

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

  catch (error) {

    console.error(
      "OPEN ADMIN FOUT:",
      error
    );

  }

}


/* ============================================================
   TERUG
============================================================ */

function closeAdminDashboard() {

  goHome();

}


function backToAdminDashboard() {

  showOnly(
    "adminScreen"
  );


  renderAdminStatistics();

  renderAdminSections();

}


/* ============================================================
   ALLE DATA LADEN
============================================================ */

async function loadAdminDashboard() {

  try {

    console.log(
      "ADMIN: data laden..."
    );


    const profilesResult =
      await supabaseClient

        .from("profiles")

        .select(
          "id, naam, email, rol, actief"
        );


    if (
      profilesResult.error
    ) {

      throw new Error(
        "Fout bij profiles:\n" +
        adminReadableError(
          profilesResult.error
        )
      );

    }


    console.log(
      "ADMIN: profiles OK"
    );


    const ordersResult =
      await supabaseClient

        .from("orders")

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
        );


    if (
      ordersResult.error
    ) {

      throw new Error(
        "Fout bij orders:\n" +
        adminReadableError(
          ordersResult.error
        )
      );

    }


    console.log(
      "ADMIN: orders OK"
    );


    const itemsResult =
      await supabaseClient

        .from("order_items")

        .select(
          "order_id, product_naam, categorie, aantal"
        );


    if (
      itemsResult.error
    ) {

      throw new Error(
        "Fout bij order_items:\n" +
        adminReadableError(
          itemsResult.error
        )
      );

    }


    console.log(
      "ADMIN: order_items OK"
    );


    const eventReturnsResult =
      await supabaseClient

        .from(
          "event_material_returns"
        )

        .select(`
          id,
          order_id,
          product_naam,
          uitgeleend_aantal,
          goed_terug,
          beschadigd,
          ontbreekt,
          opmerking,
          updated_by,
          created_at,
          updated_at
        `);


    if (
      eventReturnsResult.error
    ) {

      throw new Error(
        "Fout bij event_material_returns:\n" +
        adminReadableError(
          eventReturnsResult.error
        )
      );

    }


    console.log(
      "ADMIN: event_material_returns OK"
    );


    const wholesaleResult =
      await supabaseClient

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
        );


    const wholesaleItemsResult =
      await supabaseClient

        .from(
          "wholesale_order_items"
        )

        .select(
          "wholesale_order_id, product_naam, eenheid, betaald_aantal, actie, gratis_aantal, totaal_aantal"
        );


    /*
      Groothandel maken we NIET kritisch.

      Als daar iets fout zit,
      moet de rest van Beheer blijven werken.
    */

    if (
      wholesaleResult.error
    ) {

      console.warn(
        "WHOLESALE ORDERS:",
        wholesaleResult.error
      );

    }


    if (
      wholesaleItemsResult.error
    ) {

      console.warn(
        "WHOLESALE ITEMS:",
        wholesaleItemsResult.error
      );

    }


    adminProfiles =
      profilesResult.data || [];


    adminOrders =
      ordersResult.data || [];


    adminItems =
      itemsResult.data || [];


    adminEventReturns =
      eventReturnsResult.data || [];


    adminWholesaleOrders =
      wholesaleResult.error

        ? []

        : (
            wholesaleResult.data || []
          );


    adminWholesaleItems =
      wholesaleItemsResult.error

        ? []

        : (
            wholesaleItemsResult.data || []
          );


    fillRepresentativeFilters();

    fillReportYears();

    setCurrentReportMonth();

    renderAdminStatistics();

    renderAdminSections();

    updateAdminReport();


    console.log(
      "ADMIN: dashboard volledig geladen"
    );

  }

  catch (error) {

    console.error(
      "FOUT BIJ LADEN BEHEERDERSDASHBOARD:",
      error
    );


    alert(

      "Het beheerdersdashboard kon niet worden geladen.\n\n" +

      adminReadableError(
        error
      )

    );

  }

}


/* ============================================================
   VERTEGENWOORDIGERS
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

      if (!select) {

        return;

      }


      const oldValue =
        select.value;


      select.innerHTML = `

        <option value="">
          Alle vertegenwoordigers
        </option>

      `;


      adminProfiles

        .filter(
          profile =>
            profile.actief !== false
        )

        .sort(
          (a, b) =>

            String(
              a.naam || ""
            )

              .localeCompare(

                String(
                  b.naam || ""
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
              profile.naam || profile.email;


            select.appendChild(
              option
            );

          }
        );


      if (
        oldValue
      ) {

        select.value =
          oldValue;

      }

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


  if (!container) {

    return;

  }


  const nieuw =
    adminOrders.filter(
      order =>
        order.status ===
        "nieuw"
    ).length;


  const processing =
    adminOrders.filter(
      order =>
        order.status ===
        "in_behandeling"
    ).length;


  const ready =
    adminOrders.filter(
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
  number
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
          font-size:28px;
          font-weight:900;
          color:var(--gold);
        "
      >
        ${number}
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
   FILTERS
============================================================ */

function getFilteredAdminOrders() {

  const representative =
    document.getElementById(
      "adminRepFilter"
    )?.value || "";


  const status =
    document.getElementById(
      "adminStatusFilter"
    )?.value || "";


  const search =
    (
      document.getElementById(
        "adminSearch"
      )?.value || ""
    )

      .trim()
      .toLowerCase();


  return adminOrders.filter(
    order => {

      if (
        representative &&
        order.user_id !== representative
      ) {

        return false;

      }


      if (
        status &&
        order.status !== status
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


        const text = [

          order.referentie,

          order.gemeente,

          order.land,

          order.event_naam,

          order.opmerking,

          profile?.naam,

          profile?.email

        ]

          .filter(Boolean)

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
   ARCHIEF LOGICA
============================================================ */

function isArchivedOrder(
  order
) {

  if (
    order.event_naam
  ) {

    return (

      Boolean(
        order.event_returned_at
      )

      ||

      order.status ===
      "geannuleerd"

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
   RETOURDATA PER EVENT
============================================================ */

function getEventReturnsForOrder(
  orderId
) {

  return adminEventReturns.filter(
    item =>
      item.order_id === orderId
  );

}


/* ============================================================
   DASHBOARD ONDERDELEN
============================================================ */

function renderAdminSections() {

  const filtered =
    getFilteredAdminOrders();


  const regular =
    filtered.filter(
      order =>

        !order.event_naam

        &&

        !isArchivedOrder(
          order
        )
    );


  const events =
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


  const materialOutside =
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
    regular.length
  );


  setAdminCount(
    "adminEventCount",
    events.length
  );


  setAdminCount(
    "adminMaterialOutCount",
    materialOutside.length
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
    regular,
    "Geen actieve POS- of bieraanvragen."
  );


  renderAdminOrderList(
    "adminEventOrdersList",
    events,
    "Geen actieve evenementaanvragen."
  );


  renderMaterialOutList(
    materialOutside
  );


  renderProblemMaterials();


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
   AANVRAGEN LIJST
============================================================ */

function renderAdminOrderList(
  containerId,
  orders,
  emptyText
) {

  const container =
    document.getElementById(
      containerId
    );


  if (!container) {

    return;

  }


  if (
    !orders.length
  ) {

    container.innerHTML = `

      <div class="empty">

        ${adminEscapeHtml(
          emptyText
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
   AANVRAAG KAART
============================================================ */

function adminOrderCard(
  order
) {

  const profile =
    getAdminProfile(
      order.user_id
    );


  const items =
    getAdminOrderItems(
      order.id
    );


  const total =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.aantal || 0
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
        background:white;
        border:1px solid var(--border);
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
          align-items:flex-start;
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

          ${createOrderReference(
            order.id,
            order.created_at
          )}

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
          margin-top:8px;
          font-size:17px;
          font-weight:850;
        "
      >

        ${adminEscapeHtml(

          order.event_naam ||

          order.referentie ||

          "Geen referentie"

        )}

      </div>


      <div class="order-meta">

        ${adminEscapeHtml(
          profile?.naam ||
          "Onbekende gebruiker"
        )}

      </div>


      ${
        order.event_naam

          ? `

              <div class="order-meta">

                ${adminEscapeHtml(
                  order.event_vanaf || ""
                )}

                t/m

                ${adminEscapeHtml(
                  order.event_tot || ""
                )}

              </div>

            `

          : `

              <div class="order-meta">

                ${adminEscapeHtml(
                  order.gemeente ||
                  order.land ||
                  ""
                )}

              </div>

            `
      }


      <div class="order-meta">

        ${total} item(s)

      </div>

    </button>

  `;

}


/* ============================================================
   MATERIAAL BUITEN TONEN
============================================================ */

function renderMaterialOutList(
  orders
) {

  const container =
    document.getElementById(
      "adminMaterialOutList"
    );


  if (!container) {

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
          buildMaterialOutCard(
            order
          )
      )

      .join("");

}


/* ============================================================
   MATERIAAL BUITEN KAART
============================================================ */

function buildMaterialOutCard(
  order
) {

  const profile =
    getAdminProfile(
      order.user_id
    );


  const items =
    getAdminOrderItems(
      order.id
    )

      .filter(
        item =>
          item.categorie ===
          "evenement"
      );


  let materialHtml = "";


  items.forEach(
    item => {

      const returnRow =
        adminEventReturns.find(
          row =>

            row.order_id ===
            order.id

            &&

            row.product_naam ===
            item.product_naam
        );


      const loaned =
        Number(
          item.aantal || 0
        );


      const good =
        Number(
          returnRow?.goed_terug || 0
        );


      const damaged =
        Number(
          returnRow?.beschadigd || 0
        );


      const missing =
        Number(
          returnRow?.ontbreekt || 0
        );


      const outside =
        Math.max(

          0,

          loaned
          -
          good
          -
          damaged
          -
          missing

        );


      materialHtml += `

        <div
          style="
            padding:10px 0;
            border-bottom:1px solid var(--border);
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              gap:10px;
            "
          >

            <strong>

              ${adminEscapeHtml(
                item.product_naam
              )}

            </strong>


            <strong>

              ${loaned}

            </strong>

          </div>


          <div class="order-meta">

            Goed terug:
            ${good}

          </div>


          ${
            damaged > 0

              ? `

                  <div
                    class="order-meta"
                    style="
                      color:#b2463f;
                    "
                  >

                    Beschadigd:
                    ${damaged}

                  </div>

                `

              : ""
          }


          ${
            missing > 0

              ? `

                  <div
                    class="order-meta"
                    style="
                      color:#b2463f;
                    "
                  >

                    Ontbreekt:
                    ${missing}

                  </div>

                `

              : ""
          }


          <div
            style="
              font-weight:850;
              font-size:13px;
              margin-top:4px;
            "
          >

            Nog buiten:
            ${outside}

          </div>

        </div>

      `;

    }
  );


  return `

    <div
      style="
        background:white;
        border:1px solid var(--border);
        border-radius:16px;
        padding:14px;
        margin-top:10px;
      "
    >

      <div
        style="
          font-size:18px;
          font-weight:900;
        "
      >

        ${adminEscapeHtml(
          order.event_naam || ""
        )}

      </div>


      <div class="order-meta">

        ${adminEscapeHtml(
          profile?.naam || ""
        )}

      </div>


      <div class="order-meta">

        Evenement:

        ${adminEscapeHtml(
          order.event_vanaf || ""
        )}

        t/m

        ${adminEscapeHtml(
          order.event_tot || ""
        )}

      </div>


      ${materialHtml}


      <button
        class="primary"
        type="button"
        onclick="openAdminOrder('${order.id}')"
        style="
          margin-top:14px;
        "
      >

        Retour registreren

      </button>

    </div>

  `;

}


/* ============================================================
   SCHADE / ONTBREEKT
============================================================ */

function renderProblemMaterials() {

  const container =
    document.getElementById(
      "adminProblemsList"
    );


  if (!container) {

    return;

  }


  const problems =
    adminEventReturns.filter(
      row =>

        Number(
          row.beschadigd || 0
        ) > 0

        ||

        Number(
          row.ontbreekt || 0
        ) > 0
    );


  setAdminCount(
    "adminProblemsCount",
    problems.length
  );


  if (
    !problems.length
  ) {

    container.innerHTML = `

      <div class="info ok">

        Geen schade of ontbrekend materiaal geregistreerd.

      </div>

    `;


    return;

  }


  container.innerHTML =

    problems

      .map(
        row => {

          const order =
            adminOrders.find(
              item =>
                item.id ===
                row.order_id
            );


          const profile =
            order

              ? getAdminProfile(
                  order.user_id
                )

              : null;


          return `

            <div
              style="
                border:1px solid var(--border);
                border-radius:15px;
                padding:14px;
                margin-top:10px;
                background:white;
              "
            >

              <strong>

                ${adminEscapeHtml(
                  row.product_naam
                )}

              </strong>


              <div class="order-meta">

                ${adminEscapeHtml(
                  order?.event_naam || ""
                )}

              </div>


              <div class="order-meta">

                ${adminEscapeHtml(
                  profile?.naam || ""
                )}

              </div>


              ${
                Number(
                  row.beschadigd || 0
                ) > 0

                  ? `

                      <div
                        class="info error"
                      >

                        Beschadigd / kapot:

                        <strong>

                          ${row.beschadigd}

                        </strong>

                      </div>

                    `

                  : ""
              }


              ${
                Number(
                  row.ontbreekt || 0
                ) > 0

                  ? `

                      <div
                        class="info error"
                      >

                        Ontbreekt:

                        <strong>

                          ${row.ontbreekt}

                        </strong>

                      </div>

                    `

                  : ""
              }


              ${
                row.opmerking

                  ? `

                      <div class="order-meta">

                        Opmerking:

                        ${adminEscapeHtml(
                          row.opmerking
                        )}

                      </div>

                    `

                  : ""
              }


              ${
                order

                  ? `

                      <button
                        class="secondary"
                        type="button"
                        onclick="openAdminOrder('${order.id}')"
                      >

                        Bekijk evenement

                      </button>

                    `

                  : ""
              }

            </div>

          `;

        }
      )

      .join("");

}


/* ============================================================
   GROOTHANDEL
============================================================ */

function renderAdminWholesaleOrders() {

  const container =
    document.getElementById(
      "adminWholesaleOrdersList"
    );


  if (!container) {

    return;

  }


  if (
    !adminWholesaleOrders.length
  ) {

    container.innerHTML = `

      <div class="empty">

        Geen groothandelbestellingen gevonden.

      </div>

    `;


    return;

  }


  container.innerHTML =

    adminWholesaleOrders

      .map(
        order => {

          const profile =
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
              style="
                border:1px solid var(--border);
                border-radius:14px;
                padding:13px;
                margin-top:10px;
                background:white;
              "
            >

              <summary>

                <strong>

                  ${adminEscapeHtml(
                    order.referentie ||
                    "Geen referentie"
                  )}

                </strong>


                <div class="order-meta">

                  ${adminEscapeHtml(
                    profile?.naam || ""
                  )}

                  ·

                  ${adminEscapeHtml(
                    order.drankenhandel || ""
                  )}

                </div>

              </summary>


              <div
                style="
                  margin-top:12px;
                "
              >

                ${
                  items

                    .map(
                      item => `

                        <div
                          class="summary-line"
                        >

                          <span>

                            ${adminEscapeHtml(
                              item.product_naam
                            )}

                          </span>


                          <strong>

                            ${Number(

                              item.totaal_aantal ||

                              item.betaald_aantal ||

                              0

                            )}

                          </strong>

                        </div>

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
   AANVRAAG OPENEN
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


  if (!order) {

    return;

  }


  /*
    NIEUW -> IN BEHANDELING
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

        .from("orders")

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
      error
    ) {

      alert(

        "Aanvraag kon niet worden geopend.\n\n" +

        adminReadableError(
          error
        )

      );


      return;

    }


    order =
      data;


    updateLocalAdminOrder(
      data
    );

  }


  selectedAdminOrder =
    order;


  renderAdminDetail(
    order
  );


  showOnly(
    "adminDetailScreen"
  );

}


/* ============================================================
   DETAIL SCHERM
============================================================ */

function renderAdminDetail(
  order
) {

  const container =
    document.getElementById(
      "adminDetailContent"
    );


  if (!container) {

    return;

  }


  const profile =
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
        item.categorie === "bier"
    );


  const pos =
    items.filter(
      item =>
        item.categorie === "pos"
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
          align-items:flex-start;
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
              margin-top:7px;
            "
          >

            ${adminEscapeHtml(

              order.event_naam ||

              order.referentie ||

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
        profile?.naam || ""
      )}


      ${adminDetailRow(
        "E-mail",
        profile?.email || ""
      )}


      ${
        order.event_naam

          ? `

              ${adminDetailRow(
                "Materiaal vanaf",
                order.event_vanaf || ""
              )}

              ${adminDetailRow(
                "Materiaal t/m",
                order.event_tot || ""
              )}

            `

          : `

              ${adminDetailRow(
                "Land",
                order.land || ""
              )}

              ${adminDetailRow(
                "Gemeente",
                order.gemeente || ""
              )}

              ${adminDetailRow(
                "Afhaaldatum",
                order.afhaaldatum || ""
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

              <p>

                ${adminEscapeHtml(
                  order.opmerking
                )}

              </p>

            </div>

          `

        : ""
    }


    ${buildEventReturnEditor(
      order
    )}


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


  if (
    order.event_naam &&
    order.status ===
    "afgehaald"
  ) {

    updateAllReturnCalculations(
      order.id
    );

  }

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
        margin-top:14px;
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
          font-size:16px;
          font-weight:700;
          margin-top:3px;
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
   PRODUCT CATEGORIE
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

              <div
                class="summary-line"
              >

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
   EVENT RETOUR EDITOR
============================================================ */

function buildEventReturnEditor(
  order
) {

  if (
    !order.event_naam
  ) {

    return "";

  }


  /*
    RETOUR PAS NA AFHALING
  */

  if (
    order.status !==
    "afgehaald"
  ) {

    return `

      <div class="card">

        <h2>
          Retour evenementmateriaal
        </h2>


        <div class="info">

          Retourregistratie wordt beschikbaar
          nadat het materiaal als afgehaald is geregistreerd.

        </div>

      </div>

    `;

  }


  const items =
    getAdminOrderItems(
      order.id
    )

      .filter(
        item =>
          item.categorie ===
          "evenement"
      );


  if (
    !items.length
  ) {

    return `

      <div class="card">

        <h2>
          Retour evenementmateriaal
        </h2>

        <div class="info">

          Geen evenementmaterialen gevonden.

        </div>

      </div>

    `;

  }


  const rows =
    items

      .map(
        item => {

          const existing =
            adminEventReturns.find(
              row =>

                row.order_id ===
                order.id

                &&

                row.product_naam ===
                item.product_naam
            );


          const good =
            Number(
              existing?.goed_terug || 0
            );


          const damaged =
            Number(
              existing?.beschadigd || 0
            );


          const missing =
            Number(
              existing?.ontbreekt || 0
            );


          return `

            <div
              style="
                border:1px solid var(--border);
                border-radius:16px;
                padding:15px;
                margin-top:14px;
                background:#fff;
              "
            >

              <div
                style="
                  font-size:18px;
                  font-weight:900;
                "
              >

                ${adminEscapeHtml(
                  item.product_naam
                )}

              </div>


              <div
                class="order-meta"
                style="
                  margin-top:4px;
                "
              >

                Uitgeleend:

                <strong>

                  ${item.aantal}

                </strong>

              </div>


              ${buildReturnQuantityControl(

                order.id,

                item.product_naam,

                "good",

                "Goed terug",

                good

              )}


              ${buildReturnQuantityControl(

                order.id,

                item.product_naam,

                "damaged",

                "Beschadigd / kapot",

                damaged

              )}


              ${buildReturnQuantityControl(

                order.id,

                item.product_naam,

                "missing",

                "Ontbreekt",

                missing

              )}


              <div
                id="${returnDomId(
                  order.id,
                  item.product_naam,
                  "outside"
                )}"
                class="info"
                style="
                  margin-top:14px;
                  font-weight:900;
                "
              >

                Nog buiten:
                0

              </div>


              <label>
                Opmerking
              </label>


              <textarea
                id="${returnDomId(
                  order.id,
                  item.product_naam,
                  "note"
                )}"
                placeholder="Bijv. beschadigde poot, scheur, materiaal nog bij klant..."
              >${adminEscapeHtml(existing?.opmerking || "")}</textarea>

            </div>

          `;

        }
      )

      .join("");


  return `

    <div class="card">

      <h2>
        Retour evenementmateriaal
      </h2>


      <p
        style="
          color:var(--muted);
          line-height:1.5;
        "
      >

        Registreer per materiaal hoeveel
        goed teruggekomen is, hoeveel beschadigd
        is en hoeveel definitief ontbreekt.

      </p>


      <div class="info">

        Wat niet verwerkt is,
        blijft automatisch als
        <strong>Nog buiten</strong>
        geregistreerd.

      </div>


      ${
        order.event_returned_at

          ? `

              <div
                class="info ok"
                style="
                  margin-top:10px;
                "
              >

                Alle materialen zijn logistiek verwerkt.

                <br>

                ${adminFormatDateTime(
                  order.event_returned_at
                )}

              </div>

            `

          : ""
      }


      ${rows}


      <button
        class="primary"
        type="button"
        onclick="saveEventReturnRegistration('${order.id}')"
        style="
          margin-top:18px;
        "
      >

        Retourregistratie opslaan

      </button>


      ${
        getEventReturnsForOrder(
          order.id
        ).length > 0

          ? `

              <button
                class="secondary"
                type="button"
                onclick="resetEventReturnRegistration('${order.id}')"
              >

                Retourregistratie wissen

              </button>

            `

          : ""
      }

    </div>

  `;

}


/* ============================================================
   RETOUR +/- KNOPPEN
============================================================ */

function buildReturnQuantityControl(
  orderId,
  productName,
  type,
  label,
  value
) {

  const safeName =
    escapeReturnJsString(
      productName
    );


  return `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-top:15px;
      "
    >

      <div
        style="
          font-size:14px;
          font-weight:800;
        "
      >

        ${label}

      </div>


      <div class="qty">

        <button
          type="button"
          onclick="changeReturnQuantity(
            '${orderId}',
            '${safeName}',
            '${type}',
            -1
          )"
        >

          −

        </button>


        <span
          id="${returnDomId(
            orderId,
            productName,
            type
          )}"
        >

          ${value}

        </span>


        <button
          type="button"
          onclick="changeReturnQuantity(
            '${orderId}',
            '${safeName}',
            '${type}',
            1
          )"
        >

          +

        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   VEILIGE HTML ID
============================================================ */

function returnDomId(
  orderId,
  productName,
  type
) {

  const orderPart =
    String(
      orderId
    )

      .replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );


  const productPart =
    String(
      productName || ""
    )

      .replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );


  return (

    "return_" +

    orderPart +

    "_" +

    productPart +

    "_" +

    type

  );

}


/* ============================================================
   RETOURAANTAL WIJZIGEN
============================================================ */

function changeReturnQuantity(
  orderId,
  productName,
  type,
  amount
) {

  const item =
    getAdminOrderItems(
      orderId
    )

      .find(
        row =>

          row.product_naam ===
          productName

          &&

          row.categorie ===
          "evenement"
      );


  if (!item) {

    alert(
      "Materiaal kon niet worden gevonden."
    );

    return;

  }


  const element =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        type
      )
    );


  if (!element) {

    return;

  }


  const current =
    Number(
      element.innerText || 0
    );


  const next =
    Math.max(
      0,
      current + amount
    );


  const good =
    type === "good"

      ? next

      : getReturnScreenValue(
          orderId,
          productName,
          "good"
        );


  const damaged =
    type === "damaged"

      ? next

      : getReturnScreenValue(
          orderId,
          productName,
          "damaged"
        );


  const missing =
    type === "missing"

      ? next

      : getReturnScreenValue(
          orderId,
          productName,
          "missing"
        );


  const totalProcessed =

    good
    +
    damaged
    +
    missing;


  const loaned =
    Number(
      item.aantal || 0
    );


  if (
    totalProcessed >
    loaned
  ) {

    alert(

      "Je kunt voor " +

      productName +

      " maximaal " +

      loaned +

      " stuk(s) verwerken."

    );


    return;

  }


  element.innerText =
    next;


  updateReturnCalculation(
    orderId,
    productName
  );

}


/* ============================================================
   WAARDE LEZEN
============================================================ */

function getReturnScreenValue(
  orderId,
  productName,
  type
) {

  const element =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        type
      )
    );


  return Number(
    element?.innerText || 0
  );

}


/* ============================================================
   NOG BUITEN BEREKENEN
============================================================ */

function updateReturnCalculation(
  orderId,
  productName
) {

  const item =
    getAdminOrderItems(
      orderId
    )

      .find(
        row =>

          row.product_naam ===
          productName

          &&

          row.categorie ===
          "evenement"
      );


  if (!item) {

    return;

  }


  const good =
    getReturnScreenValue(
      orderId,
      productName,
      "good"
    );


  const damaged =
    getReturnScreenValue(
      orderId,
      productName,
      "damaged"
    );


  const missing =
    getReturnScreenValue(
      orderId,
      productName,
      "missing"
    );


  const outside =
    Math.max(

      0,

      Number(
        item.aantal || 0
      )

      -

      good

      -

      damaged

      -

      missing

    );


  const element =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "outside"
      )
    );


  if (
    element
  ) {

    element.innerText =

      "Nog buiten: " +

      outside;


    element.className =

      outside === 0

        ? "info ok"

        : "info";

  }

}


/* ============================================================
   ALLE RETOURBEREKENINGEN
============================================================ */

function updateAllReturnCalculations(
  orderId
) {

  getAdminOrderItems(
    orderId
  )

    .filter(
      item =>
        item.categorie ===
        "evenement"
    )

    .forEach(
      item => {

        updateReturnCalculation(
          orderId,
          item.product_naam
        );

      }
    );

}


/* ============================================================
   RETOUR OPSLAAN
============================================================ */

async function saveEventReturnRegistration(
  orderId
) {

  try {

    const eventItems =
      getAdminOrderItems(
        orderId
      )

        .filter(
          item =>
            item.categorie ===
            "evenement"
        );


    if (
      !eventItems.length
    ) {

      alert(
        "Geen evenementmateriaal gevonden."
      );

      return;

    }


    const returns =
      eventItems.map(
        item => {

          const noteElement =
            document.getElementById(
              returnDomId(
                orderId,
                item.product_naam,
                "note"
              )
            );


          return {

            product_naam:
              item.product_naam,

            goed_terug:
              getReturnScreenValue(
                orderId,
                item.product_naam,
                "good"
              ),

            beschadigd:
              getReturnScreenValue(
                orderId,
                item.product_naam,
                "damaged"
              ),

            ontbreekt:
              getReturnScreenValue(
                orderId,
                item.product_naam,
                "missing"
              ),

            opmerking:
              noteElement?.value
                ?.trim()
              ||
              ""

          };

        }
      );


    console.log(
      "RETOUR OPSLAAN:",
      returns
    );


    const {
      error
    } =
      await supabaseClient

        .rpc(
          "save_event_material_returns",
          {

            p_order_id:
              orderId,

            p_returns:
              returns

          }
        );


    if (
      error
    ) {

      throw error;

    }


    await loadAdminDashboard();


    const refreshedOrder =
      adminOrders.find(
        order =>
          order.id ===
          orderId
      );


    if (
      refreshedOrder
    ) {

      selectedAdminOrder =
        refreshedOrder;


      renderAdminDetail(
        refreshedOrder
      );


      showOnly(
        "adminDetailScreen"
      );

    }


    alert(
      "Retourregistratie is opgeslagen."
    );

  }

  catch (error) {

    console.error(
      "RETOUR OPSLAAN FOUT:",
      error
    );


    alert(

      "Retourregistratie kon niet worden opgeslagen.\n\n" +

      adminReadableError(
        error
      )

    );

  }

}


/* ============================================================
   RETOUR WISSEN
============================================================ */

async function resetEventReturnRegistration(
  orderId
) {

  const confirmed =
    window.confirm(

      "Wil je de volledige retourregistratie voor dit evenement wissen?"

    );


  if (
    !confirmed
  ) {

    return;

  }


  try {

    const {
      error
    } =
      await supabaseClient

        .rpc(
          "reset_event_material_returns",
          {

            p_order_id:
              orderId

          }
        );


    if (
      error
    ) {

      throw error;

    }


    await loadAdminDashboard();


    const refreshedOrder =
      adminOrders.find(
        order =>
          order.id ===
          orderId
      );


    if (
      refreshedOrder
    ) {

      selectedAdminOrder =
        refreshedOrder;


      renderAdminDetail(
        refreshedOrder
      );


      showOnly(
        "adminDetailScreen"
      );

    }


    alert(
      "Retourregistratie is gewist."
    );

  }

  catch (error) {

    alert(

      "Retourregistratie kon niet worden gewist.\n\n" +

      adminReadableError(
        error
      )

    );

  }

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
        gap:9px;
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

              "Logistiek afgehandeld",

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
   TIMELINE RIJ
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
      ></div>


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
   STATUS ACTIES
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


      <button
        class="secondary"
        type="button"
        onclick="cancelAdminOrder()"
      >

        Aanvraag annuleren

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


  if (
    order.status ===
    "geannuleerd"
  ) {

    return `

      <div class="info error">

        Deze aanvraag is geannuleerd.

      </div>

    `;

  }


  return "";

}


/* ============================================================
   STATUS KLAAR
============================================================ */

async function markAdminOrderCompleted() {

  await updateSelectedAdminOrderStatus(
    "klaar"
  );

}


/* ============================================================
   STATUS AFGEHAALD
============================================================ */

async function markAdminOrderCollected() {

  await updateSelectedAdminOrderStatus(
    "afgehaald"
  );

}


/* ============================================================
   ANNULEREN
============================================================ */

async function cancelAdminOrder() {

  if (
    !selectedAdminOrder
  ) {

    return;

  }


  const confirmed =
    window.confirm(

      "Wil je deze aanvraag annuleren?"

    );


  if (
    !confirmed
  ) {

    return;

  }


  await updateSelectedAdminOrderStatus(
    "geannuleerd"
  );

}


/* ============================================================
   STATUS UPDATE
============================================================ */

async function updateSelectedAdminOrderStatus(
  status
) {

  if (
    !selectedAdminOrder
  ) {

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient

        .from("orders")

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

      throw error;

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

    renderAdminSections();

  }

  catch (error) {

    alert(

      "Status kon niet gewijzigd worden.\n\n" +

      adminReadableError(
        error
      )

    );

  }

}


/* ============================================================
   RAPPORT JAAR
============================================================ */

function fillReportYears() {

  const select =
    document.getElementById(
      "reportYear"
    );


  if (!select) {

    return;

  }


  const currentYear =
    new Date()
      .getFullYear();


  const currentValue =
    select.value;


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


  if (
    currentValue
  ) {

    select.value =
      currentValue;

  }

}


/* ============================================================
   HUIDIGE MAAND
============================================================ */

function setCurrentReportMonth() {

  const select =
    document.getElementById(
      "reportMonth"
    );


  if (
    !select
  ) {

    return;

  }


  if (
    !select.dataset.initialized
  ) {

    select.value =
      new Date()
        .getMonth()
      +
      1;


    select.dataset.initialized =
      "1";

  }

}


/* ============================================================
   MAAND / JAAR
============================================================ */

function toggleReportPeriod() {

  const type =
    document.getElementById(
      "reportPeriodType"
    )?.value;


  const monthBox =
    document.getElementById(
      "reportMonthBox"
    );


  if (
    monthBox
  ) {

    monthBox.classList.toggle(

      "hidden",

      type === "year"

    );

  }


  updateAdminReport();

}


/* ============================================================
   RAPPORT ORDERS
============================================================ */

function getReportOrders() {

  const rep =
    document.getElementById(
      "reportRepresentative"
    )?.value || "";


  const type =
    document.getElementById(
      "reportPeriodType"
    )?.value || "month";


  const year =
    Number(
      document.getElementById(
        "reportYear"
      )?.value
    );


  const month =
    Number(
      document.getElementById(
        "reportMonth"
      )?.value
    );


  return adminOrders.filter(
    order => {

      if (
        order.status !==
        "afgehaald"
      ) {

        return false;

      }


      if (
        rep &&
        order.user_id !== rep
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
        type === "month" &&
        date.getMonth() + 1 !== month
      ) {

        return false;

      }


      return true;

    }
  );

}


/* ============================================================
   RAPPORT TOTALEN
============================================================ */

function getReportMaterialTotals() {

  const orders =
    getReportOrders();


  const orderIds =
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
        orderIds.has(
          item.order_id
        )
    )

    .forEach(
      item => {

        const name =
          item.product_naam ||
          "Onbekend";


        if (
          !totals[name]
        ) {

          totals[name] =
            0;

        }


        totals[name] +=
          Number(
            item.aantal || 0
          );

      }
    );


  return totals;

}


/* ============================================================
   RAPPORT TONEN
============================================================ */

function updateAdminReport() {

  const summary =
    document.getElementById(
      "adminReportSummary"
    );


  if (!summary) {

    return;

  }


  const orders =
    getReportOrders();


  const totals =
    getReportMaterialTotals();


  const totalProducts =
    Object.values(
      totals
    )

      .reduce(
        (sum, value) =>
          sum + value,
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
        totalProducts
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


  /*
    Chart.js niet geladen?

    Dashboard blijft gewoon werken.
  */

  if (
    !canvas ||
    typeof Chart === "undefined"
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
        (a, b) =>
          b[1] - a[1]
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
   EXCEL
============================================================ */

function exportAdminReportExcel() {

  if (
    typeof XLSX ===
    "undefined"
  ) {

    alert(

      "De Excel-module is niet geladen."

    );

    return;

  }


  const orders =
    getReportOrders();


  if (
    !orders.length
  ) {

    alert(

      "Geen afgehaalde aanvragen gevonden voor deze periode."

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

          const returnRow =
            adminEventReturns.find(
              row =>

                row.order_id ===
                order.id

                &&

                row.product_naam ===
                item.product_naam
            );


          const loaned =
            Number(
              item.aantal || 0
            );


          const good =
            Number(
              returnRow?.goed_terug || 0
            );


          const damaged =
            Number(
              returnRow?.beschadigd || 0
            );


          const missing =
            Number(
              returnRow?.ontbreekt || 0
            );


          const outside =
            order.event_naam

              ? Math.max(

                  0,

                  loaned -
                  good -
                  damaged -
                  missing

                )

              : "";


          rows.push({

            "Afhaaldatum":
              formatExcelDate(
                order.collected_at
              ),

            "Vertegenwoordiger":
              profile?.naam || "",

            "E-mail":
              profile?.email || "",

            "Type":
              order.event_naam

                ? "Evenement"

                : (
                    item.categorie === "bier"

                      ? "Bier"

                      : "POS"
                  ),

            "Referentie / evenement":
              order.event_naam ||
              order.referentie ||
              "",

            "Gemeente":
              order.gemeente || "",

            "Product / materiaal":
              item.product_naam || "",

            "Categorie":
              item.categorie || "",

            "Aantal":
              loaned,

            "Goed terug":
              order.event_naam
                ? good
                : "",

            "Beschadigd":
              order.event_naam
                ? damaged
                : "",

            "Ontbreekt":
              order.event_naam
                ? missing
                : "",

            "Nog buiten":
              outside,

            "Retour opmerking":
              returnRow?.opmerking || "",

            "Event vanaf":
              order.event_vanaf || "",

            "Event tot":
              order.event_tot || "",

            "Logistiek afgehandeld":
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


  const workbook =
    XLSX.utils
      .book_new();


  XLSX.utils
    .book_append_sheet(
      workbook,
      worksheet,
      "Afgehaald"
    );


  const totals =
    getReportMaterialTotals();


  const totalRows =
    Object.entries(
      totals
    )

      .map(
        item => ({

          "Materiaal / product":
            item[0],

          "Totaal":
            item[1]

        })
      );


  const totalSheet =
    XLSX.utils
      .json_to_sheet(
        totalRows
      );


  XLSX.utils
    .book_append_sheet(
      workbook,
      totalSheet,
      "Samenvatting"
    );


  const repId =
    document.getElementById(
      "reportRepresentative"
    )?.value;


  const rep =
    repId

      ? getAdminProfile(
          repId
        )?.naam

      : "Alle";


  const year =
    document.getElementById(
      "reportYear"
    )?.value;


  const type =
    document.getElementById(
      "reportPeriodType"
    )?.value;


  const month =
    document.getElementById(
      "reportMonth"
    )?.value;


  let filename =

    "Achel_" +

    safeFilename(
      rep
    ) +

    "_" +

    year;


  if (
    type === "month"
  ) {

    filename +=

      "_" +

      String(
        month
      ).padStart(
        2,
        "0"
      );

  }


  filename +=
    ".xlsx";


  XLSX.writeFile(
    workbook,
    filename
  );

}


/* ============================================================
   ITEMS
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
   PROFILE
============================================================ */

function getAdminProfile(
  profileId
) {

  return adminProfiles.find(
    profile =>
      profile.id ===
      profileId
  );

}


/* ============================================================
   LOKALE ORDER BIJWERKEN
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
    index !== -1
  ) {

    adminOrders[index] =
      updatedOrder;

  }

}


/* ============================================================
   STATUS CLASS
============================================================ */

function adminStatusClass(
  status
) {

  if (
    status === "klaar" ||
    status === "afgehaald"
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
   DATUM
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


/* ============================================================
   BESTANDSNAAM
============================================================ */

function safeFilename(
  value
) {

  return String(
    value || "Rapport"
  )

    .replace(
      /[^a-z0-9_-]/gi,
      "_"
    );

}


/* ============================================================
   JAVASCRIPT STRING VEILIG
============================================================ */

function escapeReturnJsString(
  value
) {

  return String(
    value || ""
  )

    .replaceAll(
      "\\",
      "\\\\"
    )

    .replaceAll(
      "'",
      "\\'"
    )

    .replaceAll(
      "\n",
      " "
    )

    .replaceAll(
      "\r",
      " "
    );

}


/* ============================================================
   HTML VEILIG
============================================================ */

function adminEscapeHtml(
  value
) {

  return String(
    value ?? ""
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
   DUIDELIJKE FOUTMELDING
============================================================ */

function adminReadableError(
  error
) {

  if (
    !error
  ) {

    return "Onbekende fout.";

  }


  if (
    typeof error ===
    "string"
  ) {

    return error;

  }


  const pieces =
    [];


  if (
    error.message
  ) {

    pieces.push(

      "Message: " +

      error.message

    );

  }


  if (
    error.details
  ) {

    pieces.push(

      "Details: " +

      error.details

    );

  }


  if (
    error.hint
  ) {

    pieces.push(

      "Hint: " +

      error.hint

    );

  }


  if (
    error.code
  ) {

    pieces.push(

      "Code: " +

      error.code

    );

  }


  if (
    pieces.length
  ) {

    return pieces.join(
      "\n"
    );

  }


  try {

    return JSON.stringify(
      error
    );

  }

  catch {

    return String(
      error
    );

  }

}

/* ============================================================
   ADMIN GLOBAAL BESCHIKBAAR MAKEN
============================================================ */

window.openAdminDashboard =
  openAdminDashboard;

/* ============================================================
   AUTO START
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
