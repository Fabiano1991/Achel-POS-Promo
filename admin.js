/* ACHEL POS - ADMIN.JS */

let adminOrders = [];
let adminProfiles = [];
let adminItems = [];
let adminEventReturns = [];
let adminWholesaleOrders = [];
let adminWholesaleItems = [];
let selectedAdminOrder = null;
let adminReportChart = null;


/* ============================================================
   ADMIN START
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
   ADMIN SCHERM
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
        aria-label="Vernieuwen"
      >
        ↻
      </button>

    </div>


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


    <!-- OVERZICHT -->

    <div
      id="adminPaneOverview"
      class="admin-pane"
    >

      <div
        id="adminStatistics"
        class="admin-kpi-grid"
      ></div>


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
          class="admin-action-card"
          type="button"
          onclick="switchAdminTab('requests')"
        >

          <div class="admin-card-icon purple">
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
          class="admin-action-card"
          type="button"
          onclick="switchAdminTab('material')"
        >

          <div class="admin-card-icon orange">
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
          class="admin-action-card"
          type="button"
          onclick="switchAdminTab('reports')"
        >

          <div class="admin-card-icon blue">
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
          class="admin-action-card"
          type="button"
          onclick="switchAdminTab('requests'); openAdminArchive();"
        >

          <div class="admin-card-icon grey">
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


    <!-- AANVRAGEN -->

    <div
      id="adminPaneRequests"
      class="admin-pane hidden"
    >

      <div class="admin-page-heading">

        <span class="admin-eyebrow">
          Operationeel
        </span>

        <h2>
          Aanvragen
        </h2>

      </div>


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


      ${adminListPanelHtml(
        "adminRegularCount",
        "green",
        "POS & bier",
        "adminRegularOrdersList",
        true
      )}


      ${adminListPanelHtml(
        "adminEventCount",
        "orange",
        "Evenementen",
        "adminEventOrdersList",
        false
      )}


      ${adminListPanelHtml(
        "adminWholesaleCount",
        "purple",
        "Groothandel",
        "adminWholesaleOrdersList",
        false
      )}


      ${adminListPanelHtml(
        "adminArchiveCount",
        "grey",
        "Archief",
        "adminArchiveList",
        false,
        "adminArchivePanel"
      )}

    </div>


    <!-- MATERIAAL -->

    <div
      id="adminPaneMaterial"
      class="admin-pane hidden"
    >

      <div class="admin-page-heading">

        <span class="admin-eyebrow">
          Logistiek
        </span>

        <h2>
          Materiaal
        </h2>

      </div>


      <div class="admin-material-summary">

        <button
          class="admin-material-summary-card orange"
          type="button"
        >

          <span>
            Momenteel buiten
          </span>

          <strong id="adminMaterialOutCount">
            0
          </strong>

        </button>


        <button
          class="admin-material-summary-card red"
          type="button"
        >

          <span>
            Schade / ontbreekt
          </span>

          <strong id="adminProblemsCount">
            0
          </strong>

        </button>

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


    <!-- RAPPORTEN -->

    <div
      id="adminPaneReports"
      class="admin-pane hidden"
    >

      <div class="admin-page-heading">

        <span class="admin-eyebrow">
          Analyse
        </span>

        <h2>
          Rapportage
        </h2>

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

          <canvas id="adminMaterialsChart"></canvas>

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
   LIST PANEL
============================================================ */

function adminListPanelHtml(
  countId,
  color,
  title,
  listId,
  open,
  panelId = ""
) {

  return `

    <details
      ${panelId ? `id="${panelId}"` : ""}
      class="admin-list-panel"
      ${open ? "open" : ""}
    >

      <summary>

        <div>

          <span
            class="admin-dot ${color}"
          ></span>

          ${title}

        </div>


        <span
          id="${countId}"
          class="admin-count ${color}"
        >
          0
        </span>

      </summary>


      <div class="admin-list-content">

        <div id="${listId}">

          <div class="empty">
            Laden...
          </div>

        </div>

      </div>

    </details>

  `;

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
    "hidden admin-detail-shell";


  section.innerHTML = `

    <button
      class="top-back"
      type="button"
      onclick="backToAdminDashboard()"
    >
      ← Terug naar dashboard
    </button>


    <div id="adminDetailContent"></div>

  `;


  appMain.appendChild(
    section
  );

}


/* ============================================================
   OPEN ADMIN
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


    if (
      !document.getElementById(
        "adminScreen"
      )
    ) {

      alert(
        "Beheer is niet beschikbaar voor dit account."
      );

      return;
    }


    showOnly(
      "adminScreen"
    );


    switchAdminTab(
      "overview"
    );


    await loadAdminDashboard();

  }

  catch (error) {

    console.error(
      "OPEN ADMIN FOUT:",
      error
    );


    alert(
      "Beheer kon niet worden geopend.\n\n"
      +
      adminReadableError(
        error
      )
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
   TABS
============================================================ */

function switchAdminTab(
  tab
) {

  const panes = {

    overview:
      "adminPaneOverview",

    requests:
      "adminPaneRequests",

    material:
      "adminPaneMaterial",

    reports:
      "adminPaneReports"

  };


  const buttons = {

    overview:
      "adminTabOverview",

    requests:
      "adminTabRequests",

    material:
      "adminTabMaterial",

    reports:
      "adminTabReports"

  };


  if (
    !panes[
      tab
    ]
  ) {

    tab =
      "overview";

  }


  Object
    .values(
      panes
    )
    .forEach(
      id => {

        document
          .getElementById(
            id
          )
          ?.classList
          .add(
            "hidden"
          );

      }
    );


  Object
    .values(
      buttons
    )
    .forEach(
      id => {

        document
          .getElementById(
            id
          )
          ?.classList
          .remove(
            "active"
          );

      }
    );


  document
    .getElementById(
      panes[
        tab
      ]
    )
    ?.classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      buttons[
        tab
      ]
    )
    ?.classList
    .add(
      "active"
    );


  if (
    tab ===
    "reports"
  ) {

    updateAdminReport();

  }


  window.scrollTo({

    top:
      0,

    behavior:
      "smooth"

  });

}


/* ============================================================
   FILTERS
============================================================ */

function toggleAdminFilters() {

  document
    .getElementById(
      "adminFiltersPanel"
    )
    ?.classList
    .toggle(
      "hidden"
    );

}


/* ============================================================
   ARCHIEF OPENEN
============================================================ */

function openAdminArchive() {

  setTimeout(
    () => {

      const panel =
        document.getElementById(
          "adminArchivePanel"
        );


      if (
        panel
      ) {

        panel.open =
          true;


        panel.scrollIntoView({

          behavior:
            "smooth",

          block:
            "start"

        });

      }

    },
    100
  );

}


/* ============================================================
   DATA LADEN
============================================================ */

async function loadAdminDashboard() {

  try {

    const profilesResult =
      await supabaseClient
        .from(
          "profiles"
        )
        .select(
          "id, naam, email, rol, actief"
        );


    if (
      profilesResult.error
    ) {

      throw new Error(
        "Fout bij profiles: "
        +
        adminReadableError(
          profilesResult.error
        )
      );

    }


    const ordersResult =
      await supabaseClient
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
        );


    if (
      ordersResult.error
    ) {

      throw new Error(
        "Fout bij orders: "
        +
        adminReadableError(
          ordersResult.error
        )
      );

    }


    const itemsResult =
      await supabaseClient
        .from(
          "order_items"
        )
        .select(
          "order_id, product_naam, categorie, aantal"
        );


    if (
      itemsResult.error
    ) {

      throw new Error(
        "Fout bij order_items: "
        +
        adminReadableError(
          itemsResult.error
        )
      );

    }


    const returnsResult =
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
      returnsResult.error
    ) {

      throw new Error(
        "Fout bij event_material_returns: "
        +
        adminReadableError(
          returnsResult.error
        )
      );

    }


    const wholesaleResult =
      await supabaseClient
        .from(
          "wholesale_orders"
        )
        .select(`
          id,
          user_id,
          referentie,
          drankenhandel,
          opmerking,
          status,
          created_at
        `)
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
        .select(`
          wholesale_order_id,
          product_naam,
          eenheid,
          betaald_aantal,
          actie,
          gratis_aantal,
          totaal_aantal
        `);


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


    adminEventReturns =
      returnsResult.data
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

  catch (error) {

    console.error(
      "FOUT BIJ LADEN BEHEER:",
      error
    );


    alert(
      "Het beheerdersdashboard kon niet worden geladen.\n\n"
      +
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

  [

    document.getElementById(
      "adminRepFilter"
    ),

    document.getElementById(
      "reportRepresentative"
    )

  ]
    .forEach(
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


              option.textContent =
                profile.naam
                ||
                profile.email
                ||
                "Onbekend";


              select.appendChild(
                option
              );

            }
          );


        if (
          [
            ...select.options
          ]
            .some(
              option =>
                option.value ===
                oldValue
            )
        ) {

          select.value =
            oldValue;

        }

      }
    );

}


/* ============================================================
   KPI
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
    adminOrders
      .filter(
        order =>
          order.status ===
          "nieuw"
      )
      .length;


  const processing =
    adminOrders
      .filter(
        order =>
          order.status ===
          "in_behandeling"
      )
      .length;


  const ready =
    adminOrders
      .filter(
        order =>
          order.status ===
          "klaar"
      )
      .length;


  const outside =
    getMaterialOutOrders()
      .length;


  container.innerHTML =

    adminKpi(
      "green",
      nieuw,
      "Nieuw",
      "setAdminStatusAndOpen('nieuw')"
    )

    +

    adminKpi(
      "orange",
      processing,
      "In behandeling",
      "setAdminStatusAndOpen('in_behandeling')"
    )

    +

    adminKpi(
      "red",
      outside,
      "Materiaal buiten",
      "switchAdminTab('material')"
    )

    +

    adminKpi(
      "gold",
      ready,
      "Klaar",
      "setAdminStatusAndOpen('klaar')"
    );


  renderAdminAttentionPanel();

}


function adminKpi(
  color,
  number,
  label,
  action
) {

  return `

    <button
      class="admin-kpi ${color}"
      type="button"
      onclick="${action}"
    >

      <span class="admin-kpi-number">
        ${number}
      </span>


      <span class="admin-kpi-label">
        ${label}
      </span>

    </button>

  `;

}


/* ============================================================
   RAPPORT KAART
============================================================ */

function adminStatCard(
  label,
  value
) {

  return `

    <div class="admin-report-stat">

      <strong>
        ${value}
      </strong>


      <span>
        ${adminEscapeHtml(
          label
        )}
      </span>

    </div>

  `;

}


/* ============================================================
   KPI FILTER
============================================================ */

function setAdminStatusAndOpen(
  status
) {

  switchAdminTab(
    "requests"
  );


  const select =
    document.getElementById(
      "adminStatusFilter"
    );


  if (
    select
  ) {

    select.value =
      status;

  }


  renderAdminSections();

}


/* ============================================================
   ACTIES
============================================================ */

function renderAdminAttentionPanel() {

  const container =
    document.getElementById(
      "adminAttentionPanel"
    );


  if (!container) {
    return;
  }


  const outside =
    getMaterialOutOrders()
      .length;


  const problems =
    getProblemRows()
      .length;


  const processing =
    adminOrders
      .filter(
        order =>
          order.status ===
          "in_behandeling"
      )
      .length;


  const cards =
    [];


  if (
    problems
  ) {

    cards.push(

      adminAttentionCard(
        "red",
        "!",
        `${problems} materiaalprobleem${problems === 1 ? "" : "en"}`,
        "Beschadigd of ontbrekend materiaal",
        "switchAdminTab('material')"
      )

    );

  }


  if (
    outside
  ) {

    cards.push(

      adminAttentionCard(
        "orange",
        "↩",
        `${outside} retour${outside === 1 ? "" : "s"} te verwerken`,
        "Evenementmateriaal staat nog buiten",
        "switchAdminTab('material')"
      )

    );

  }


  if (
    processing
  ) {

    cards.push(

      adminAttentionCard(
        "yellow",
        "•",
        `${processing} in behandeling`,
        "Aanvragen wachten op verwerking",
        "switchAdminTab('requests')"
      )

    );

  }


  container.innerHTML =
    cards.length

      ? cards.join("")

      : `

          <div class="admin-all-clear">

            <strong>
              Alles onder controle
            </strong>

            <span>
              Momenteel zijn er geen dringende acties.
            </span>

          </div>

        `;

}


/* ============================================================
   ACTIE KAART
============================================================ */

function adminAttentionCard(
  color,
  symbol,
  title,
  text,
  action
) {

  return `

    <button
      class="admin-attention-card ${color}"
      type="button"
      onclick="${action}"
    >

      <div class="admin-attention-symbol">
        ${symbol}
      </div>


      <div>

        <strong>
          ${title}
        </strong>

        <span>
          ${text}
        </span>

      </div>


      <div class="admin-card-arrow">
        ›
      </div>

    </button>

  `;

}


/* ============================================================
   FILTER DATA
============================================================ */

function getFilteredAdminOrders() {

  const rep =
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


  return adminOrders
    .filter(
      order => {

        if (
          rep &&
          order.user_id !==
          rep
        ) {
          return false;
        }


        if (
          status &&
          order.status !==
          status
        ) {
          return false;
        }


        if (!search) {
          return true;
        }


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
          .filter(
            Boolean
          )
          .join(
            " "
          )
          .toLowerCase();


        return text.includes(
          search
        );

      }
    );

}


/* ============================================================
   ARCHIEF
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
   BUITEN
============================================================ */

function getMaterialOutOrders() {

  return adminOrders
    .filter(
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
   PROBLEMEN
============================================================ */

function getProblemRows() {

  return adminEventReturns
    .filter(
      row =>
        Number(
          row.beschadigd
          ||
          0
        )
        >
        0
        ||
        Number(
          row.ontbreekt
          ||
          0
        )
        >
        0
    );

}


function getEventReturnsForOrder(
  orderId
) {

  return adminEventReturns
    .filter(
      row =>
        row.order_id ===
        orderId
    );

}


/* ============================================================
   SECTIES
============================================================ */

function renderAdminSections() {

  const filtered =
    getFilteredAdminOrders();


  const regular =
    filtered
      .filter(
        order =>
          !order.event_naam
          &&
          !isArchivedOrder(
            order
          )
      );


  const events =
    filtered
      .filter(
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
    filtered
      .filter(
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
    filtered
      .filter(
        isArchivedOrder
      );


  const problems =
    getProblemRows();


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


  setAdminCount(
    "adminProblemsCount",
    problems.length
  );


  setAdminCount(
    "overviewRegularCount",
    regular.length
  );


  setAdminCount(
    "overviewEventCount",
    events.length
  );


  setAdminCount(
    "overviewWholesaleCount",
    adminWholesaleOrders.length
  );


  setAdminCount(
    "overviewMaterialOutCount",
    materialOutside.length
  );


  setAdminCount(
    "overviewArchiveCount",
    archive.length
  );


  setAdminCount(
    "overviewProblemsCount",
    problems.length
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


  renderAdminAttentionPanel();

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

    element.textContent =
      value;

  }

}


/* ============================================================
   ORDER LIST
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


  container.innerHTML =
    orders.length

      ? orders
          .map(
            adminOrderCard
          )
          .join("")

      : `

          <div class="empty">
            ${adminEscapeHtml(
              emptyText
            )}
          </div>

        `;

}


/* ============================================================
   ORDER CARD
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
    items
      .reduce(
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


  const title =
    order.event_naam
    ||
    order.referentie
    ||
    "Geen referentie";


  const meta =
    order.event_naam

      ? `${order.event_vanaf || ""} t/m ${order.event_tot || ""}`

      : (
          order.gemeente
          ||
          order.land
          ||
          ""
        );


  return `

    <button
      class="admin-order-card"
      type="button"
      onclick="openAdminOrder('${order.id}')"
    >

      <div class="admin-order-top">

        <span class="admin-order-id">

          ${createOrderReference(
            order.id,
            order.created_at
          )}

        </span>


        <span
          class="status ${adminStatusClass(order.status)}"
        >

          ${formatStatus(
            order.status
          )}

        </span>

      </div>


      <strong class="admin-order-title">

        ${adminEscapeHtml(
          title
        )}

      </strong>


      <span class="admin-order-meta">

        ${adminEscapeHtml(
          profile?.naam
          ||
          "Onbekende gebruiker"
        )}

        ·

        ${adminEscapeHtml(
          meta
        )}

        ·

        ${total} item(s)

      </span>

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


  if (!container) {
    return;
  }


  container.innerHTML =
    orders.length

      ? orders
          .map(
            buildMaterialOutCard
          )
          .join("")

      : `

          <div class="admin-empty-ok">
            Geen evenementmateriaal buiten.
          </div>

        `;

}


/* ============================================================
   MATERIAAL CARD
============================================================ */

function buildMaterialOutCard(
  order
) {

  const profile =
    getAdminProfile(
      order.user_id
    );


  const materials =
    getEventMaterialStatus(
      order.id
    );


  const totalOutside =
    materials.reduce(
      (
        total,
        item
      ) =>

        total +
        item.nog_buiten,

      0
    );


  const rows =
    materials
      .map(
        item => `

          <div class="material-row">

            <strong>

              ${adminEscapeHtml(
                item.product_naam
              )}

            </strong>


            <span>

              Uit:
              ${item.uitgeleend}

            </span>


            <span class="green-text">

              Terug:
              ${item.goed_terug}

            </span>


            ${
              item.beschadigd > 0

                ? `

                    <span class="red-text">

                      Beschadigd:
                      ${item.beschadigd}

                    </span>

                  `

                : ""
            }


            ${
              item.ontbreekt > 0

                ? `

                    <span class="red-text">

                      Ontbreekt:
                      ${item.ontbreekt}

                    </span>

                  `

                : ""
            }


            <b>

              Nog buiten:
              ${item.nog_buiten}

            </b>

          </div>

        `
      )
      .join("");


  return `

    <div class="admin-material-card">

      <div class="admin-material-head">

        <div>

          <strong>

            ${adminEscapeHtml(
              order.event_naam ||
              "Evenement"
            )}

          </strong>


          <span>

            ${adminEscapeHtml(
              profile?.naam ||
              ""
            )}

            ·

            ${adminEscapeHtml(
              order.event_vanaf ||
              ""
            )}

            t/m

            ${adminEscapeHtml(
              order.event_tot ||
              ""
            )}

          </span>

        </div>


        <div
          style="
            background:#dfa047;
            color:#2f2415;
            border-radius:999px;
            padding:5px 9px;
            font-size:11px;
            font-weight:900;
            white-space:nowrap;
          "
        >

          ${totalOutside}
          buiten

        </div>

      </div>


      ${rows}


      <button
        type="button"
        onclick="openAdminOrder('${order.id}')"
        style="
          width:100%;
          margin-top:9px;
          min-height:40px;
          border:0;
          border-radius:10px;
          background:#8c692f;
          color:white;
          font-weight:900;
        "
      >

        Retour verwerken ›

      </button>

    </div>

  `;

}


/* ============================================================
   PROBLEMEN TONEN
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
    getProblemRows();


  setAdminCount(
    "adminProblemsCount",
    problems.length
  );


  container.innerHTML =
    problems.length

      ? problems
          .map(
            row => {

              const order =
                adminOrders
                  .find(
                    item =>
                      item.id ===
                      row.order_id
                  );


              return `

                <div class="admin-problem-card">

                  <strong>
                    ${adminEscapeHtml(
                      row.product_naam
                    )}
                  </strong>


                  <span>

                    ${adminEscapeHtml(
                      order?.event_naam
                      ||
                      "Onbekend evenement"
                    )}

                  </span>


                  <div>

                    ${
                      Number(
                        row.beschadigd
                        ||
                        0
                      )
                      ?
                        `<b>Beschadigd: ${row.beschadigd}</b>`
                      :
                        ""
                    }

                    ${
                      Number(
                        row.ontbreekt
                        ||
                        0
                      )
                      ?
                        `<b>Ontbreekt: ${row.ontbreekt}</b>`
                      :
                        ""
                    }

                  </div>


                  ${
                    row.opmerking

                      ? `

                          <small>
                            ${adminEscapeHtml(
                              row.opmerking
                            )}
                          </small>

                        `

                      : ""
                  }


                  ${
                    order

                      ? `

                          <button
                            type="button"
                            onclick="openAdminOrder('${order.id}')"
                          >
                            Bekijk ›
                          </button>

                        `

                      : ""
                  }

                </div>

              `;

            }
          )
          .join("")

      : `

          <div class="admin-empty-ok">
            Geen schade of ontbrekend materiaal.
          </div>

        `;

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
        Geen groothandelbestellingen.
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
            adminWholesaleItems
              .filter(
                item =>
                  item.wholesale_order_id ===
                  order.id
              );


          return `

            <details class="admin-wholesale-card">

              <summary>

                <strong>
                  ${adminEscapeHtml(
                    order.referentie
                    ||
                    "Geen referentie"
                  )}
                </strong>


                <span>

                  ${adminEscapeHtml(
                    profile?.naam
                    ||
                    ""
                  )}

                  ·

                  ${adminEscapeHtml(
                    order.drankenhandel
                    ||
                    ""
                  )}

                </span>

              </summary>


              <div>

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
    adminOrders
      .find(
        item =>
          item.id ===
          orderId
      );


  if (!order) {
    return;
  }


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
      error
    ) {

      alert(
        "Aanvraag kon niet worden geopend.\n\n"
        +
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
   DETAIL
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

    <div class="admin-detail-card">

      <div class="admin-detail-head">

        <div>

          <span>

            ${createOrderReference(
              order.id,
              order.created_at
            )}

          </span>


          <h2>

            ${adminEscapeHtml(
              order.event_naam
              ||
              order.referentie
              ||
              "Aanvraag"
            )}

          </h2>

        </div>


        <span
          class="status ${adminStatusClass(order.status)}"
        >

          ${formatStatus(
            order.status
          )}

        </span>

      </div>


      ${adminDetailRow(
        "Vertegenwoordiger",
        profile?.naam
        ||
        ""
      )}


      ${adminDetailRow(
        "E-mail",
        profile?.email
        ||
        ""
      )}


      ${
        order.event_naam

          ?
            adminDetailRow(
              "Materiaal vanaf",
              order.event_vanaf
              ||
              ""
            )
            +
            adminDetailRow(
              "Materiaal t/m",
              order.event_tot
              ||
              ""
            )

          :
            adminDetailRow(
              "Land",
              order.land
              ||
              ""
            )
            +
            adminDetailRow(
              "Gemeente",
              order.gemeente
              ||
              ""
            )
            +
            adminDetailRow(
              "Afhaaldatum",
              order.afhaaldatum
              ||
              ""
            )
      }

    </div>


    ${adminCategoryCard(
      "BIER",
      beer,
      "green"
    )}


    ${adminCategoryCard(
      "POS-MATERIALEN",
      pos,
      "blue"
    )}


    ${adminCategoryCard(
      "EVENEMENTENMATERIAAL",
      events,
      "orange"
    )}


    ${
      order.opmerking

        ? `

            <div class="admin-detail-card">

              <h3>
                Opmerking
              </h3>

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


    <div class="admin-detail-card">

      <h3>
        Status
      </h3>


      ${adminStatusTimeline(
        order
      )}


      ${adminActionButtons(
        order
      )}

    </div>

  `;


  if (
    order.event_naam
    &&
    order.status ===
    "afgehaald"
  ) {

function updateAllReturnCalculations(
  orderId
) {

  getEventMaterialItems(
    orderId
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
   DETAIL RIJ
============================================================ */

function adminDetailRow(
  label,
  value
) {

  return `

    <div class="admin-detail-row">

      <span>
        ${adminEscapeHtml(
          label
        )}
      </span>

      <strong>
        ${adminEscapeHtml(
          value
        )}
      </strong>

    </div>

  `;

}


/* ============================================================
   CATEGORIE
============================================================ */

function adminCategoryCard(
  title,
  items,
  color
) {

  if (
    !items.length
  ) {
    return "";
  }


  return `

    <div
      class="admin-detail-card category-${color}"
    >

      <h3>
        ${title}
      </h3>


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
   RETOUR
============================================================ */

function buildEventReturnEditor(
  order
) {

  if (
    !order.event_naam
  ) {

    return "";

  }


  if (
    order.status !==
    "afgehaald"
  ) {

    return `

      <div class="admin-detail-card">

        <h3>
          Retour evenementmateriaal
        </h3>


        <div class="admin-info orange">

          Retourregistratie wordt beschikbaar
          zodra het evenementmateriaal
          als afgehaald staat.

        </div>

      </div>

    `;

  }


  const materials =
    getEventMaterialStatus(
      order.id
    );


  if (
    !materials.length
  ) {

    return `

      <div class="admin-detail-card">

        <h3>
          Retour evenementmateriaal
        </h3>


        <div class="admin-info red">

          Er zijn geen evenementmaterialen
          gekoppeld aan deze aanvraag.

          <br><br>

          Deze aanvraag wordt daarom niet
          als retour verwerkt.

        </div>

      </div>

    `;

  }


  const totalLoaned =
    materials.reduce(
      (
        total,
        item
      ) =>

        total +
        item.uitgeleend,

      0
    );


  const totalOutside =
    materials.reduce(
      (
        total,
        item
      ) =>

        total +
        item.nog_buiten,

      0
    );


  const rows =
    materials.map(
      item => `

        <div class="return-item">

          <div class="return-item-head">

            <strong>

              ${adminEscapeHtml(
                item.product_naam
              )}

            </strong>


            <span>

              Uitgeleend

              <b>
                ${item.uitgeleend}
              </b>

            </span>

          </div>


          ${buildReturnQuantityControl(
            order.id,
            item.product_naam,
            "good",
            "Goed terug",
            item.goed_terug,
            "green"
          )}


          ${buildReturnQuantityControl(
            order.id,
            item.product_naam,
            "damaged",
            "Beschadigd",
            item.beschadigd,
            "orange"
          )}


          ${buildReturnQuantityControl(
            order.id,
            item.product_naam,
            "missing",
            "Ontbreekt",
            item.ontbreekt,
            "red"
          )}


          <div
            id="${returnDomId(
              order.id,
              item.product_naam,
              "outside"
            )}"
            class="
              return-outside
              ${
                item.nog_buiten === 0
                  ? "done"
                  : ""
              }
            "
          >

            Nog buiten:
            ${item.nog_buiten}

          </div>


          <textarea
            id="${returnDomId(
              order.id,
              item.product_naam,
              "note"
            )}"
            placeholder="Opmerking indien nodig"
          >${adminEscapeHtml(item.opmerking)}</textarea>

        </div>

      `
    )
    .join("");


  return `

    <div class="admin-detail-card return-card">

      <div class="return-title">

        <div>

          <span>
            Logistiek
          </span>

          <h3>
            Retour verwerken
          </h3>

        </div>


        <button
          type="button"
          onclick="markEverythingReturned('${order.id}')"
        >

          Alles goed terug

        </button>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:7px;
          margin-top:9px;
          margin-bottom:9px;
        "
      >

        <div
          style="
            background:#eee9dd;
            border-radius:10px;
            padding:8px;
          "
        >

          <span
            style="
              display:block;
              font-size:9px;
              color:#777;
            "
          >

            Uitgeleend

          </span>


          <strong
            style="
              font-size:21px;
            "
          >

            ${totalLoaned}

          </strong>

        </div>


        <div
          style="
            background:${
              totalOutside > 0
                ? "#f6e4c6"
                : "#dff0e1"
            };
            color:${
              totalOutside > 0
                ? "#915c1d"
                : "#367243"
            };
            border-radius:10px;
            padding:8px;
          "
        >

          <span
            style="
              display:block;
              font-size:9px;
            "
          >

            Nog buiten

          </span>


          <strong
            style="
              font-size:21px;
            "
          >

            ${totalOutside}

          </strong>

        </div>

      </div>


      ${rows}


      <button
        class="return-save"
        type="button"
        onclick="saveEventReturnRegistration('${order.id}')"
      >

        Retour opslaan

      </button>


      ${
        getEventReturnsForOrder(
          order.id
        ).length

          ? `

              <button
                class="return-reset"
                type="button"
                onclick="resetEventReturnRegistration('${order.id}')"
              >

                Registratie wissen

              </button>

            `

          : ""
      }

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
    return "";
  }


  const rows =
    items
      .map(
        item => {

          const existing =
            adminEventReturns
              .find(
                row =>
                  row.order_id ===
                  order.id
                  &&
                  row.product_naam ===
                  item.product_naam
              );


          const good =
            Number(
              existing?.goed_terug
              ||
              0
            );


          const damaged =
            Number(
              existing?.beschadigd
              ||
              0
            );


          const missing =
            Number(
              existing?.ontbreekt
              ||
              0
            );


          return `

            <div class="return-item">

              <div class="return-item-head">

                <strong>
                  ${adminEscapeHtml(
                    item.product_naam
                  )}
                </strong>


                <span>

                  Uitgeleend

                  <b>
                    ${item.aantal}
                  </b>

                </span>

              </div>


              ${buildReturnQuantityControl(
                order.id,
                item.product_naam,
                "good",
                "Goed terug",
                good,
                "green"
              )}


              ${buildReturnQuantityControl(
                order.id,
                item.product_naam,
                "damaged",
                "Beschadigd",
                damaged,
                "orange"
              )}


              ${buildReturnQuantityControl(
                order.id,
                item.product_naam,
                "missing",
                "Ontbreekt",
                missing,
                "red"
              )}


              <div
                id="${returnDomId(
                  order.id,
                  item.product_naam,
                  "outside"
                )}"
                class="return-outside"
              >
                Nog buiten: 0
              </div>


              <textarea
                id="${returnDomId(
                  order.id,
                  item.product_naam,
                  "note"
                )}"
                placeholder="Opmerking indien nodig"
              >${adminEscapeHtml(existing?.opmerking || "")}</textarea>

            </div>

          `;

        }
      )
      .join("");


  return `

    <div class="admin-detail-card return-card">

      <div class="return-title">

        <div>

          <span>
            Logistiek
          </span>

          <h3>
            Retour verwerken
          </h3>

        </div>


        <button
          type="button"
          onclick="markEverythingReturned('${order.id}')"
        >
          Alles goed terug
        </button>

      </div>


      ${rows}


      <button
        class="return-save"
        type="button"
        onclick="saveEventReturnRegistration('${order.id}')"
      >
        Retour opslaan
      </button>


      ${
        getEventReturnsForOrder(
          order.id
        ).length

          ? `

              <button
                class="return-reset"
                type="button"
                onclick="resetEventReturnRegistration('${order.id}')"
              >
                Registratie wissen
              </button>

            `

          : ""
      }

    </div>

  `;

}


/* ============================================================
   RETOUR CONTROL
============================================================ */

function buildReturnQuantityControl(
  orderId,
  productName,
  type,
  label,
  value,
  color
) {

  const safe =
    escapeReturnJsString(
      productName
    );


  return `

    <div class="return-control ${color}">

      <span>
        ${label}
      </span>


      <div class="return-stepper">

        <button
          type="button"
          onclick="changeReturnQuantity('${orderId}','${safe}','${type}',-1)"
        >
          −
        </button>


        <b
          id="${returnDomId(
            orderId,
            productName,
            type
          )}"
        >
          ${value}
        </b>


        <button
          type="button"
          onclick="changeReturnQuantity('${orderId}','${safe}','${type}',1)"
        >
          +
        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   RETOUR ID
============================================================ */

function returnDomId(
  orderId,
  productName,
  type
) {

  return (

    `return_${
      String(
        orderId
      )
        .replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )
    }_${
      String(
        productName
        ||
        ""
      )
        .replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )
    }_${type}`

  );

}


/* ============================================================
   RETOUR WAARDE
============================================================ */

function getReturnScreenValue(
  orderId,
  productName,
  type
) {

  return Number(

    document
      .getElementById(
        returnDomId(
          orderId,
          productName,
          type
        )
      )
      ?.textContent

    ||

    0

  );

}


/* ============================================================
   RETOUR WAARDE ZETTEN
============================================================ */

function setReturnScreenValue(
  orderId,
  productName,
  type,
  value
) {

  const element =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        type
      )
    );


  if (
    element
  ) {

    element.textContent =
      Math.max(
        0,
        Number(
          value
          ||
          0
        )
      );

  }

}


/* ============================================================
   RETOUR AANTAL
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
        product =>
          product.product_naam ===
          productName
          &&
          product.categorie ===
          "evenement"
      );


  if (!item) {
    return;
  }


  const next =
    Math.max(

      0,

      getReturnScreenValue(
        orderId,
        productName,
        type
      )
      +
      amount

    );


  const values = {

    good:

      type ===
      "good"

        ? next

        : getReturnScreenValue(
            orderId,
            productName,
            "good"
          ),


    damaged:

      type ===
      "damaged"

        ? next

        : getReturnScreenValue(
            orderId,
            productName,
            "damaged"
          ),


    missing:

      type ===
      "missing"

        ? next

        : getReturnScreenValue(
            orderId,
            productName,
            "missing"
          )

  };


  if (
    values.good
    +
    values.damaged
    +
    values.missing
    >
    Number(
      item.aantal
      ||
      0
    )
  ) {

    return;

  }


  setReturnScreenValue(
    orderId,
    productName,
    type,
    next
  );


  updateReturnCalculation(
    orderId,
    productName
  );

}


/* ============================================================
   EVENEMENTMATERIAAL CENTRAAL
============================================================ */

function isEventMaterialCategory(
  category
) {

  const value =
    String(
      category ||
      ""
    )
      .trim()
      .toLowerCase();


  return (
    value === "evenement" ||
    value === "evenementen" ||
    value === "event" ||
    value === "events"
  );

}


/* ============================================================
   EVENT MATERIALEN OPHALEN
============================================================ */

function getEventMaterialItems(
  orderId
) {

  return adminItems.filter(
    item =>

      item.order_id ===
      orderId

      &&

      isEventMaterialCategory(
        item.categorie
      )

  );

}


/* ============================================================
   STATUS PER EVENTMATERIAAL
============================================================ */

function getEventMaterialStatus(
  orderId
) {

  const items =
    getEventMaterialItems(
      orderId
    );


  return items.map(
    item => {

      const returnRow =
        adminEventReturns.find(
          row =>

            row.order_id ===
            orderId

            &&

            row.product_naam ===
            item.product_naam

        );


      const loaned =
        Math.max(
          0,
          Number(
            item.aantal ||
            0
          )
        );


      const good =
        Math.max(
          0,
          Number(
            returnRow?.goed_terug ||
            0
          )
        );


      const damaged =
        Math.max(
          0,
          Number(
            returnRow?.beschadigd ||
            0
          )
        );


      const missing =
        Math.max(
          0,
          Number(
            returnRow?.ontbreekt ||
            0
          )
        );


      const processed =
        good +
        damaged +
        missing;


      const outside =
        Math.max(
          0,
          loaned -
          processed
        );


      return {

        product_naam:
          item.product_naam,

        categorie:
          item.categorie,

        uitgeleend:
          loaned,

        goed_terug:
          good,

        beschadigd:
          damaged,

        ontbreekt:
          missing,

        verwerkt:
          processed,

        nog_buiten:
          outside,

        opmerking:
          returnRow?.opmerking ||
          ""

      };

    }
  );

}


/* ============================================================
   TOTAAL NOG BUITEN PER EVENT
============================================================ */

function getEventOutstandingTotal(
  orderId
) {

  return getEventMaterialStatus(
    orderId
  )
    .reduce(
      (
        total,
        item
      ) =>

        total +
        item.nog_buiten,

      0
    );

}


/* ============================================================
   MATERIAAL BUITEN
============================================================ */

function getMaterialOutOrders() {

  return adminOrders.filter(
    order => {

      if (
        !order.event_naam
      ) {

        return false;

      }


      if (
        order.status !==
        "afgehaald"
      ) {

        return false;

      }


      const eventItems =
        getEventMaterialItems(
          order.id
        );


      /*
        Geen event-items gevonden:
        niet ten onrechte als materiaal buiten tellen.
      */

      if (
        !eventItems.length
      ) {

        console.warn(
          "Evenement zonder gekoppelde eventmaterialen:",
          order.id,
          order.event_naam
        );


        return false;

      }


      return (
        getEventOutstandingTotal(
          order.id
        ) > 0
      );

    }
  );

}


/* ============================================================
   ALLE RETOUR BEREKENINGEN
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
   ALLES GOED TERUG
============================================================ */

function markEverythingReturned(
  orderId
) {

  const materials =
    getEventMaterialItems(
      orderId
    );


  materials.forEach(
    item => {

      const amount =
        Number(
          item.aantal ||
          0
        );


      setReturnScreenValue(
        orderId,
        item.product_naam,
        "good",
        amount
      );


      setReturnScreenValue(
        orderId,
        item.product_naam,
        "damaged",
        0
      );


      setReturnScreenValue(
        orderId,
        item.product_naam,
        "missing",
        0
      );


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


    const returns =
      eventItems
        .map(
          item => ({

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

              document
                .getElementById(
                  returnDomId(
                    orderId,
                    item.product_naam,
                    "note"
                  )
                )
                ?.value
                ?.trim()

              ||

              ""

          })
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


    const refreshed =
      adminOrders
        .find(
          order =>
            order.id ===
            orderId
        );


    if (
      refreshed
    ) {

      selectedAdminOrder =
        refreshed;


      renderAdminDetail(
        refreshed
      );


      showOnly(
        "adminDetailScreen"
      );

    }


    alert(
      "Retourregistratie opgeslagen."
    );

  }

  catch (error) {

    alert(
      "Retourregistratie kon niet worden opgeslagen.\n\n"
      +
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

  if (
    !confirm(
      "Volledige retourregistratie wissen?"
    )
  ) {
    return;
  }


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

    alert(
      adminReadableError(
        error
      )
    );

    return;
  }


  await loadAdminDashboard();


  const refreshed =
    adminOrders
      .find(
        order =>
          order.id ===
          orderId
      );


  if (
    refreshed
  ) {

    selectedAdminOrder =
      refreshed;


    renderAdminDetail(
      refreshed
    );


    showOnly(
      "adminDetailScreen"
    );

  }

}


/* ============================================================
   STATUS TIJDLIJN
============================================================ */

function adminStatusTimeline(
  order
) {

  return `

    <div class="admin-timeline">

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
      class="timeline-row ${active ? "active" : ""}"
    >

      <span></span>


      <div>

        <strong>
          ${label}
        </strong>


        ${
          date

            ? `

                <small>
                  ${adminFormatDateTime(
                    date
                  )}
                </small>

              `

            : ""
        }

      </div>

    </div>

  `;

}


/* ============================================================
   STATUS KNOPPEN
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
        class="admin-primary-action"
        type="button"
        onclick="markAdminOrderCompleted()"
      >
        Klaar voor afhaling
      </button>


      <button
        class="admin-secondary-action"
        type="button"
        onclick="cancelAdminOrder()"
      >
        Annuleren
      </button>

    `;

  }


  if (
    order.status ===
    "klaar"
  ) {

    return `

      <button
        class="admin-primary-action"
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

      <div class="admin-info red">
        Deze aanvraag is geannuleerd.
      </div>

    `;

  }


  return "";

}


/* ============================================================
   STATUS ACTIONS
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


async function cancelAdminOrder() {

  if (
    selectedAdminOrder
    &&
    confirm(
      "Aanvraag annuleren?"
    )
  ) {

    await updateSelectedAdminOrderStatus(
      "geannuleerd"
    );

  }

}


/* ============================================================
   STATUS OPSLAAN
============================================================ */

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
      "Status kon niet worden gewijzigd.\n\n"
      +
      adminReadableError(
        error
      )
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

  renderAdminSections();

}


/* ============================================================
   RAPPORT JAREN
============================================================ */

function fillReportYears() {

  const select =
    document.getElementById(
      "reportYear"
    );


  if (!select) {
    return;
  }


  const current =
    new Date()
      .getFullYear();


  const old =
    select.value;


  select.innerHTML =
    "";


  for (
    let year =
      current;

    year >=
    current - 5;

    year--
  ) {

    select.insertAdjacentHTML(
      "beforeend",
      `<option value="${year}">${year}</option>`
    );

  }


  if (
    old
  ) {

    select.value =
      old;

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
    select
    &&
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
   RAPPORT TYPE
============================================================ */

function toggleReportPeriod() {

  const type =
    document
      .getElementById(
        "reportPeriodType"
      )
      ?.value;


  document
    .getElementById(
      "reportMonthBox"
    )
    ?.classList
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

  const rep =
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


  return adminOrders
    .filter(
      order => {

        if (
          order.status !==
          "afgehaald"
          ||
          !order.collected_at
        ) {
          return false;
        }


        if (
          rep
          &&
          order.user_id !==
          rep
        ) {
          return false;
        }


        const date =
          new Date(
            order.collected_at
          );


        return (
          date.getFullYear() ===
          year
          &&
          (
            type ===
            "year"
            ||
            date.getMonth() + 1 ===
            month
          )
        );

      }
    );

}


/* ============================================================
   RAPPORT TOTALEN
============================================================ */

function getReportMaterialTotals() {

  const ids =
    new Set(

      getReportOrders()
        .map(
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


        totals[
          name
        ] =
          (
            totals[
              name
            ]
            ||
            0
          )
          +
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
    Object
      .values(
        totals
      )
      .reduce(
        (
          first,
          second
        ) =>
          first
          +
          second,
        0
      );


  summary.innerHTML = `

    <div class="admin-report-stats">

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
    Object
      .entries(
        totals
      )
      .sort(
        (
          first,
          second
        ) =>
          second[1]
          -
          first[1]
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
      "Excel-module niet geladen."
    );

    return;
  }


  const orders =
    getReportOrders();


  if (
    !orders.length
  ) {

    alert(
      "Geen afgehaalde aanvragen voor deze periode."
    );

    return;
  }


  const rows =
    [];


  orders
    .forEach(
      order => {

        const profile =
          getAdminProfile(
            order.user_id
          );


        getAdminOrderItems(
          order.id
        )
          .forEach(
            item => {

              const ret =
                adminEventReturns
                  .find(
                    row =>
                      row.order_id ===
                      order.id
                      &&
                      row.product_naam ===
                      item.product_naam
                  );


              const loaned =
                Number(
                  item.aantal
                  ||
                  0
                );


              const good =
                Number(
                  ret?.goed_terug
                  ||
                  0
                );


              const damaged =
                Number(
                  ret?.beschadigd
                  ||
                  0
                );


              const missing =
                Number(
                  ret?.ontbreekt
                  ||
                  0
                );


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

                  order.event_naam

                    ? Math.max(
                        0,
                        loaned
                        -
                        good
                        -
                        damaged
                        -
                        missing
                      )

                    : "",


                "Retour opmerking":
                  ret?.opmerking
                  ||
                  ""

              });

            }
          );

      }
    );


  const workbook =
    XLSX.utils
      .book_new();


  XLSX.utils
    .book_append_sheet(
      workbook,
      XLSX.utils
        .json_to_sheet(
          rows
        ),
      "Afgehaald"
    );


  const summaryRows =
    Object
      .entries(
        getReportMaterialTotals()
      )
      .map(
        (
          [
            name,
            total
          ]
        ) => ({

          "Materiaal / product":
            name,

          "Totaal":
            total

        })
      );


  XLSX.utils
    .book_append_sheet(
      workbook,
      XLSX.utils
        .json_to_sheet(
          summaryRows
        ),
      "Samenvatting"
    );


  const repId =
    document
      .getElementById(
        "reportRepresentative"
      )
      ?.value;


  const rep =
    repId

      ? getAdminProfile(
          repId
        )?.naam

      : "Alle";


  const year =
    document
      .getElementById(
        "reportYear"
      )
      ?.value;


  const type =
    document
      .getElementById(
        "reportPeriodType"
      )
      ?.value;


  const month =
    document
      .getElementById(
        "reportMonth"
      )
      ?.value;


  const filename =

    `Achel_${safeFilename(rep)}_${year}`

    +

    (
      type ===
      "month"

        ? `_${String(month).padStart(2,"0")}`

        : ""
    )

    +

    ".xlsx";


  XLSX.writeFile(
    workbook,
    filename
  );

}


/* ============================================================
   HELPERS
============================================================ */

function getAdminOrderItems(
  orderId
) {

  return adminItems
    .filter(
      item =>
        item.order_id ===
        orderId
    );

}


function getAdminProfile(
  profileId
) {

  return adminProfiles
    .find(
      profile =>
        profile.id ===
        profileId
    );

}


function updateLocalAdminOrder(
  updated
) {

  const index =
    adminOrders
      .findIndex(
        order =>
          order.id ===
          updated.id
      );


  if (
    index !==
    -1
  ) {

    adminOrders[
      index
    ] =
      updated;

  }

}


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


function adminFormatDateTime(
  date
) {

  if (!date) {
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

  return date

    ? new Date(
        date
      )
        .toLocaleString(
          "nl-BE"
        )

    : "";

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


function escapeReturnJsString(
  value
) {

  return String(
    value
    ||
    ""
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


function adminReadableError(
  error
) {

  if (!error) {

    return "Onbekende fout.";

  }


  if (
    typeof error ===
    "string"
  ) {

    return error;

  }


  return [

    error.message
      &&
      "Message: "
      +
      error.message,


    error.details
      &&
      "Details: "
      +
      error.details,


    error.hint
      &&
      "Hint: "
      +
      error.hint,


    error.code
      &&
      "Code: "
      +
      error.code

  ]
    .filter(
      Boolean
    )
    .join(
      "\n"
    )
    ||
    String(
      error
    );

}


/* ============================================================
   STYLING
============================================================ */

function injectAdminDashboardStyles() {

  if (
    document.getElementById(
      "achelAdminStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "achelAdminStyles";


  style.textContent = `

    #adminScreen.admin-shell {
      margin:-18px -16px -36px;
      min-height:100vh;
      background:#151c16;
      color:#f4f1e8;
      padding-bottom:28px;
    }

    .admin-topbar {
      position:relative;
      display:flex;
      justify-content:center;
      align-items:center;
      min-height:66px;
      padding:10px 54px;
      background:#182019;
      border-bottom:1px solid #303830;
    }

    .admin-topbar-title {
      text-align:center;
    }

    .admin-topbar-title strong {
      display:block;
      color:#fff;
      font-size:19px;
    }

    .admin-topbar-title span {
      font-size:11px;
      color:#9da59e;
    }

    .admin-refresh-button {
      position:absolute;
      right:12px;
      width:40px;
      height:40px;
      border:1px solid #414a42;
      border-radius:11px;
      background:#293229;
      color:#d9bd7b;
      font-size:22px;
    }


    .admin-tabs {
      position:sticky;
      top:64px;
      z-index:30;
      display:grid;
      grid-template-columns:repeat(4,1fr);
      background:#f4f1e8;
      border-bottom:1px solid #cdc5b5;
    }

    .admin-tab {
      position:relative;
      min-height:47px;
      border:0;
      background:transparent;
      color:#252b25;
      font-size:10px;
      font-weight:900;
      text-transform:uppercase;
    }

    .admin-tab.active {
      color:#8c692f;
    }

    .admin-tab.active:after {
      content:"";
      position:absolute;
      left:10%;
      right:10%;
      bottom:0;
      height:3px;
      background:#b4883c;
    }


    .admin-pane {
      padding:13px;
    }


    .admin-kpi-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
    }

    .admin-kpi {
      --c:#fff;
      min-height:82px;
      border:1px solid #465047;
      border-radius:14px;
      background:#303930;
      text-align:left;
      padding:12px;
      box-shadow:0 4px 14px #0005;
    }

    .admin-kpi.green {
      --c:#71b67a;
    }

    .admin-kpi.orange {
      --c:#e0a447;
    }

    .admin-kpi.red {
      --c:#df6a56;
    }

    .admin-kpi.gold {
      --c:#d4c09a;
    }

    .admin-kpi-number {
      display:block;
      color:var(--c);
      font-size:28px;
      font-weight:950;
    }

    .admin-kpi-label {
      display:block;
      color:#fff;
      margin-top:5px;
      font-size:12px;
      font-weight:800;
    }


    .admin-section {
      margin-top:17px;
    }

    .admin-section.compact {
      margin-top:12px;
    }

    .admin-section-heading {
      display:flex;
      align-items:end;
      justify-content:space-between;
      gap:8px;
      margin-bottom:7px;
    }

    .admin-section-heading h3,
    .admin-page-heading h2 {
      margin:0;
      color:#fff;
      font-size:18px;
    }

    .admin-eyebrow {
      display:block;
      color:#c6b17c;
      font-size:9px;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:.08em;
    }

    .admin-inline-link {
      border:0;
      background:none;
      color:#d1b56f;
      font-size:11px;
      font-weight:850;
    }


    .admin-action-card {
      width:100%;
      display:grid;
      grid-template-columns:40px 1fr auto 16px;
      align-items:center;
      gap:9px;
      padding:11px;
      margin-bottom:7px;
      border:1px solid #465047;
      border-radius:14px;
      background:#343d35;
      color:#fff;
      text-align:left;
    }

    .admin-card-icon {
      width:39px;
      height:39px;
      display:grid;
      place-items:center;
      border-radius:10px;
      background:#232b24;
      font-size:19px;
    }

    .admin-card-icon.purple {
      color:#b995d1;
    }

    .admin-card-icon.orange {
      color:#e1a650;
    }

    .admin-card-icon.blue {
      color:#80aeda;
    }

    .admin-card-icon.grey {
      color:#c3c8c3;
    }

    .admin-card-main strong {
      display:block;
      font-size:15px;
    }

    .admin-card-main > span {
      display:block;
      color:#aeb6af;
      font-size:10px;
      margin-top:2px;
    }

    .admin-card-arrow {
      font-size:23px;
      color:#cfb778;
    }

    .admin-side-count {
      padding:4px 8px;
      border-radius:999px;
      background:#d1b777;
      color:#222;
      font-size:11px;
      font-weight:900;
    }


    .admin-mini-badges {
      display:flex;
      flex-wrap:wrap;
      gap:4px;
      margin-top:5px;
    }

    .admin-mini-badge,
    .admin-count {
      padding:3px 7px;
      border-radius:999px;
      font-size:9px;
      font-weight:900;
    }

    .admin-mini-badge.green,
    .admin-count.green {
      background:#dff0e1;
      color:#367243;
    }

    .admin-mini-badge.orange,
    .admin-count.orange {
      background:#f6e4c6;
      color:#9a611e;
    }

    .admin-mini-badge.red {
      background:#f5d6d1;
      color:#a44437;
    }

    .admin-mini-badge.purple,
    .admin-count.purple {
      background:#e7ddf1;
      color:#6f4c8b;
    }

    .admin-count.grey {
      background:#ddd;
      color:#555;
    }


    .admin-attention-grid {
      display:grid;
      gap:6px;
    }

    .admin-attention-card {
      width:100%;
      display:grid;
      grid-template-columns:34px 1fr 15px;
      align-items:center;
      gap:8px;
      padding:9px;
      border:0;
      border-radius:12px;
      text-align:left;
    }

    .admin-attention-card.red {
      background:#df6655;
      color:#fff;
    }

    .admin-attention-card.orange {
      background:#dfa047;
      color:#2c2112;
    }

    .admin-attention-card.yellow {
      background:#d8c38f;
      color:#30291e;
    }

    .admin-attention-symbol {
      width:32px;
      height:32px;
      display:grid;
      place-items:center;
      border-radius:9px;
      background:#ffffff38;
      font-weight:950;
    }

    .admin-attention-card strong {
      display:block;
      font-size:12px;
    }

    .admin-attention-card span {
      display:block;
      font-size:9px;
      margin-top:1px;
    }

    .admin-all-clear,
    .admin-empty-ok {
      padding:10px;
      border-radius:12px;
      background:#2c4632;
      color:#d9f0dd;
      font-size:11px;
    }

    .admin-all-clear span {
      display:block;
      font-size:9px;
      margin-top:2px;
    }


    .admin-page-heading {
      margin:0 0 10px;
    }

    .admin-search-row {
      display:grid;
      grid-template-columns:1fr 44px;
      gap:7px;
    }

    .admin-search {
      min-height:44px!important;
      border:1px solid #485149!important;
      background:#303930!important;
      color:#fff!important;
      border-radius:999px!important;
    }

    .admin-filter-button {
      width:44px;
      height:44px;
      border:1px solid #485149;
      border-radius:50%;
      background:#303930;
      color:#d3b46d;
    }

    .admin-filter-panel,
    .admin-report-panel {
      margin-top:8px;
      padding:10px;
      border:1px solid #414941;
      border-radius:13px;
      background:#2a322b;
    }

    .admin-filter-grid {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:7px;
    }

    .admin-filter-panel label,
    .admin-report-panel label {
      color:#bac1bb;
      font-size:9px;
      margin:6px 0 4px;
    }

    .admin-filter-panel select,
    .admin-report-panel select {
      min-height:41px;
      background:#202721;
      color:#fff;
      border-color:#4a534b;
    }


    .admin-list-panel {
      margin-top:8px;
      border:1px solid #414a42;
      border-radius:13px;
      background:#2d352e;
      overflow:hidden;
    }

    .admin-list-panel > summary {
      list-style:none;
      display:flex;
      align-items:center;
      justify-content:space-between;
      min-height:49px;
      padding:0 11px;
      color:#fff;
      font-size:13px;
      font-weight:850;
    }

    .admin-list-panel > summary::-webkit-details-marker {
      display:none;
    }

    .admin-list-panel > summary > div {
      display:flex;
      align-items:center;
      gap:7px;
    }

    .admin-dot {
      width:8px;
      height:8px;
      border-radius:50%;
    }

    .admin-dot.green {
      background:#70b77b;
    }

    .admin-dot.orange {
      background:#dfa047;
    }

    .admin-dot.purple {
      background:#a77ac5;
    }

    .admin-dot.grey {
      background:#aaa;
    }

    .admin-list-content {
      padding:4px 8px 8px;
      background:#202721;
      border-top:1px solid #424b43;
    }


    .admin-order-card {
      width:100%;
      margin-top:7px;
      padding:11px;
      border:1px solid #d8d5cd;
      border-radius:12px;
      background:#fff;
      text-align:left;
      color:#202722;
    }

    .admin-order-top {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
    }

    .admin-order-id {
      font-size:10px;
      font-weight:900;
      color:#8c692f;
    }

    .admin-order-title {
      display:block;
      margin-top:5px;
      font-size:14px;
    }

    .admin-order-meta {
      display:block;
      margin-top:4px;
      color:#747b75;
      font-size:10px;
    }


    .admin-material-summary {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:7px;
    }

    .admin-material-summary-card {
      border:0;
      border-radius:13px;
      padding:10px;
      text-align:left;
    }

    .admin-material-summary-card.orange {
      background:#dfa047;
      color:#2f2415;
    }

    .admin-material-summary-card.red {
      background:#db6655;
      color:#fff;
    }

    .admin-material-summary-card span {
      display:block;
      font-size:9px;
      font-weight:850;
    }

    .admin-material-summary-card strong {
      display:block;
      font-size:24px;
      margin-top:3px;
    }

    .admin-material-card,
    .admin-problem-card {
      margin-top:7px;
      padding:10px;
      border-radius:13px;
      background:#fff;
      color:#202722;
    }

    .admin-material-head {
      display:flex;
      justify-content:space-between;
      gap:8px;
      align-items:flex-start;
    }

    .admin-material-head strong {
      display:block;
    }

    .admin-material-head span {
      display:block;
      color:#777;
      font-size:9px;
      margin-top:2px;
    }

    .admin-material-head button,
    .admin-problem-card button {
      border:0;
      border-radius:9px;
      background:#8c692f;
      color:#fff;
      padding:7px 9px;
      font-size:9px;
      font-weight:850;
    }

    .material-row {
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      margin-top:7px;
      padding-top:7px;
      border-top:1px solid #eee;
      font-size:9px;
    }

    .material-row strong {
      min-width:100%;
    }

    .green-text {
      color:#377744;
    }

    .red-text {
      color:#a74646;
    }

    .admin-problem-card span,
    .admin-problem-card small {
      display:block;
      color:#777;
      font-size:9px;
      margin-top:2px;
    }

    .admin-problem-card div {
      margin-top:5px;
      font-size:10px;
      color:#a74646;
    }


    .admin-wholesale-card {
      margin-top:7px;
      padding:10px;
      border-radius:12px;
      background:#fff;
      color:#202722;
    }

    .admin-wholesale-card summary strong,
    .admin-wholesale-card summary span {
      display:block;
    }

    .admin-wholesale-card summary span {
      font-size:9px;
      color:#777;
      margin-top:2px;
    }


    .admin-report-stats {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:7px;
      margin-top:10px;
    }

    .admin-report-stat {
      padding:10px;
      border-radius:12px;
      background:#202721;
      border:1px solid #465047;
    }

    .admin-report-stat strong {
      display:block;
      color:#d8b66a;
      font-size:22px;
    }

    .admin-report-stat span {
      font-size:9px;
      color:#b6beb7;
    }

    .admin-chart-box {
      height:280px;
      margin-top:10px;
      padding:6px;
      border-radius:10px;
      background:#f4f1e8;
    }

    .admin-export-button {
      width:100%;
      min-height:45px;
      margin-top:10px;
      border:0;
      border-radius:11px;
      background:#b48a42;
      color:#fff;
      font-weight:900;
    }


    .admin-detail-shell {
      padding-bottom:25px;
    }

    .admin-detail-card {
      margin-bottom:10px;
      padding:13px;
      border:1px solid #ddd9cf;
      border-radius:15px;
      background:#fff;
      color:#202722;
    }

    .admin-detail-head {
      display:flex;
      justify-content:space-between;
      gap:10px;
    }

    .admin-detail-head > div > span {
      color:#8c692f;
      font-size:10px;
      font-weight:900;
    }

    .admin-detail-head h2 {
      font-size:19px;
      margin:4px 0 0;
    }

    .admin-detail-row {
      display:grid;
      grid-template-columns:120px 1fr;
      gap:8px;
      margin-top:8px;
    }

    .admin-detail-row span {
      font-size:9px;
      color:#777;
      text-transform:uppercase;
      font-weight:850;
    }

    .admin-detail-row strong {
      font-size:12px;
    }

    .admin-detail-card h3 {
      margin:0 0 8px;
      font-size:16px;
    }

    .category-green {
      border-left:5px solid #71b67a;
    }

    .category-blue {
      border-left:5px solid #719fc5;
    }

    .category-orange {
      border-left:5px solid #dfa047;
    }


    .return-card {
      border-top:5px solid #dfa047;
    }

    .return-title {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
    }

    .return-title span {
      font-size:9px;
      color:#9a611e;
      text-transform:uppercase;
      font-weight:900;
    }

    .return-title h3 {
      margin:2px 0;
    }

    .return-title button {
      border:0;
      border-radius:9px;
      background:#367243;
      color:#fff;
      padding:8px;
      font-size:9px;
      font-weight:900;
    }

    .return-item {
      margin-top:9px;
      padding:10px;
      border:1px solid #ddd;
      border-radius:12px;
      background:#f8f7f3;
    }

    .return-item-head {
      display:flex;
      justify-content:space-between;
      gap:8px;
    }

    .return-item-head span {
      font-size:9px;
      color:#777;
    }

    .return-control {
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-top:7px;
      padding:6px 8px;
      border-radius:9px;
    }

    .return-control.green {
      background:#e1f0e4;
      color:#367243;
    }

    .return-control.orange {
      background:#f6e4c6;
      color:#915c1d;
    }

    .return-control.red {
      background:#f5d6d1;
      color:#a44437;
    }

    .return-stepper {
      display:flex;
      align-items:center;
      gap:5px;
    }

    .return-stepper button {
      width:30px;
      height:30px;
      border:0;
      border-radius:8px;
      background:#fff;
      font-size:18px;
    }

    .return-stepper b {
      min-width:22px;
      text-align:center;
    }

    .return-outside {
      margin-top:7px;
      padding:7px;
      border-radius:9px;
      background:#eee;
      font-size:10px;
      font-weight:900;
    }

    .return-outside.done {
      background:#dff0e1;
      color:#367243;
    }

    .return-item textarea {
      min-height:55px;
      margin-top:7px;
      font-size:11px;
    }

    .return-save,
    .admin-primary-action {
      width:100%;
      min-height:44px;
      margin-top:10px;
      border:0;
      border-radius:11px;
      background:#8c692f;
      color:#fff;
      font-weight:900;
    }

    .return-reset,
    .admin-secondary-action {
      width:100%;
      min-height:42px;
      margin-top:6px;
      border:1px solid #ccc;
      border-radius:11px;
      background:#fff;
      color:#555;
      font-weight:850;
    }


    .admin-info {
      padding:9px;
      border-radius:10px;
      font-size:10px;
    }

    .admin-info.orange {
      background:#f6e4c6;
      color:#915c1d;
    }

    .admin-info.red {
      background:#f5d6d1;
      color:#a44437;
    }

    .admin-timeline {
      display:grid;
      gap:6px;
    }

    .timeline-row {
      display:grid;
      grid-template-columns:10px 1fr;
      gap:7px;
    }

    .timeline-row > span {
      width:9px;
      height:9px;
      margin-top:3px;
      border-radius:50%;
      background:#ccc;
    }

    .timeline-row.active > span {
      background:#367243;
    }

    .timeline-row strong {
      font-size:11px;
    }

    .timeline-row small {
      display:block;
      color:#777;
      font-size:9px;
      margin-top:1px;
    }


    @media(max-width:390px) {

      .admin-tab {
        font-size:9px;
      }

      .admin-pane {
        padding:10px;
      }

      .admin-filter-grid {
        grid-template-columns:1fr;
      }

      .admin-detail-row {
        grid-template-columns:100px 1fr;
      }

    }

  `;


  document
    .head
    .appendChild(
      style
    );

}


/* ============================================================
   GLOBALE ADMIN FUNCTIE
============================================================ */

window.openAdminDashboard =
  openAdminDashboard;


/* ============================================================
   AUTO START
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () =>
      setTimeout(
        initAdminModule,
        300
      )
  );

}

else {

  setTimeout(
    initAdminModule,
    300
  );

}


supabaseClient
  .auth
  .onAuthStateChange(
    () =>
      setTimeout(
        initAdminModule,
        300
      )
  );
