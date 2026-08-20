/* ============================================================
   ACHEL POS - ADMIN.JS
   DASHBOARD + MATERIAAL + RETOUR + RAPPORTAGE
============================================================ */


/* ===============================
   DATA
================================ */

let adminOrders = [];

let adminProfiles = [];

let adminItems = [];

let adminEventReturns = [];

let adminWholesaleOrders = [];

let adminWholesaleItems = [];

let adminWholesaleProofs = [];

let selectedAdminOrder =
  null;

let adminReportChart =
  null;


/* ===============================
   INIT
================================ */

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

    console.error(
      "ADMIN INIT FOUT:",
      error
    );

  }

}


/* ===============================
   ADMIN SCHERM
================================ */

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


  injectAdminStyles();


  const section =
    document.createElement(
      "section"
    );


  section.id =
    "adminScreen";


  section.className =
    "hidden admin-shell";


  section.innerHTML = `

    <div class="admin-head">

      <div>

        <span>
          ACHEL POS
        </span>

        <strong>
          Beheerdersoverzicht
        </strong>

      </div>

    </div>


    <div class="admin-tabs">

      <button
        id="adminTab-overview"
        class="active"
        onclick="switchAdminTab('overview')"
        type="button"
      >
        Overzicht
      </button>


      <button
        id="adminTab-requests"
        onclick="switchAdminTab('requests')"
        type="button"
      >
        Aanvragen
      </button>


      <button
        id="adminTab-material"
        onclick="switchAdminTab('material')"
        type="button"
      >
        Materiaal
      </button>


      <button
        id="adminTab-reports"
        onclick="switchAdminTab('reports')"
        type="button"
      >
        Rapporten
      </button>

    </div>


    <!-- OVERZICHT -->

    <div
      id="adminPane-overview"
      class="admin-pane"
    >

      <div
        id="adminStatistics"
        class="admin-kpis"
      ></div>


      <div class="admin-block">

        <div class="admin-block-title">

          <span>
            PRIORITEIT
          </span>

          <strong>
            Actie nodig
          </strong>

        </div>


        <div id="adminAttentionPanel"></div>

      </div>


      <div class="admin-block">

        <div class="admin-block-title">

          <span>
            OPERATIONEEL
          </span>

          <strong>
            Aanvragen
          </strong>

        </div>


        <button
          class="admin-row green"
          onclick="switchAdminTab('requests')"
          type="button"
        >

          <div>

            <b>
              POS & bier
            </b>

            <small>
              Actieve aanvragen
            </small>

          </div>


          <strong id="overviewRegularCount">
            0
          </strong>

          <i>
            ›
          </i>

        </button>


        <button
          class="admin-row orange"
          onclick="switchAdminTab('requests')"
          type="button"
        >

          <div>

            <b>
              Evenementen
            </b>

            <small>
              Actieve evenementaanvragen
            </small>

          </div>


          <strong id="overviewEventCount">
            0
          </strong>

          <i>
            ›
          </i>

        </button>


        <button
          class="admin-row purple"
          onclick="switchAdminTab('requests')"
          type="button"
        >

          <div>

            <b>
              Groothandel
            </b>

            <small>
              Externe bestellingen
            </small>

          </div>


          <strong id="overviewWholesaleCount">
            0
          </strong>

          <i>
            ›
          </i>

        </button>

      </div>


      <div class="admin-block">

        <div class="admin-block-title">

          <span>
            LOGISTIEK
          </span>

          <strong>
            Materiaal
          </strong>

        </div>


        <button
          class="admin-row orange"
          onclick="switchAdminTab('material')"
          type="button"
        >

          <div>

            <b>
              Materiaal buiten
            </b>

            <small>
              Retour nog te verwerken
            </small>

          </div>


          <strong id="overviewMaterialOutCount">
            0
          </strong>

          <i>
            ›
          </i>

        </button>


        <button
          class="admin-row red"
          onclick="switchAdminTab('material')"
          type="button"
        >

          <div>

            <b>
              Schade / ontbreekt
            </b>

            <small>
              Vraagt aandacht
            </small>

          </div>


          <strong id="overviewProblemsCount">
            0
          </strong>

          <i>
            ›
          </i>

        </button>

      </div>


      <div class="admin-block">

        <button
          class="admin-row blue"
          onclick="switchAdminTab('reports')"
          type="button"
        >

          <div>

            <b>
              Rapportage
            </b>

            <small>
              Maand, jaar en Excel
            </small>

          </div>


          <strong>
            ↗
          </strong>

          <i>
            ›
          </i>

        </button>


        <button
          class="admin-row grey"
          onclick="switchAdminTab('requests'); openAdminArchive()"
          type="button"
        >

          <div>

            <b>
              Archief
            </b>

            <small>
              Afgehandelde aanvragen
            </small>

          </div>


          <strong id="overviewArchiveCount">
            0
          </strong>

          <i>
            ›
          </i>

        </button>

      </div>

    </div>


    <!-- AANVRAGEN -->

    <div
      id="adminPane-requests"
      class="admin-pane hidden"
    >

      <div class="admin-page-title">

        <span>
          OPERATIONEEL
        </span>

        <strong>
          Aanvragen
        </strong>

      </div>


      <div class="admin-searchbar">

        <input
          id="adminSearch"
          type="text"
          placeholder="Zoeken..."
          oninput="renderAdminSections()"
        >


        <button
          type="button"
          onclick="toggleAdminFilters()"
        >
          Filters
        </button>

      </div>


      <div
        id="adminFiltersPanel"
        class="admin-filters hidden"
      >

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

      </div>


      ${adminPanelHtml(
        "POS & bier",
        "adminRegularCount",
        "adminRegularOrdersList",
        "green",
        true
      )}


      ${adminPanelHtml(
        "Evenementen",
        "adminEventCount",
        "adminEventOrdersList",
        "orange",
        false
      )}


      ${adminPanelHtml(
        "Groothandel",
        "adminWholesaleCount",
        "adminWholesaleOrdersList",
        "purple",
        false
      )}


      ${adminPanelHtml(
        "Archief",
        "adminArchiveCount",
        "adminArchiveList",
        "grey",
        false,
        "adminArchivePanel"
      )}

    </div>


    <!-- MATERIAAL -->

    <div
      id="adminPane-material"
      class="admin-pane hidden"
    >

      <div class="admin-page-title">

        <span>
          LOGISTIEK
        </span>

        <strong>
          Materiaal
        </strong>

      </div>


      <div class="admin-material-kpis">

        <div class="orange">

          <span>
            Buiten
          </span>

          <strong id="adminMaterialOutCount">
            0
          </strong>

        </div>


        <div class="red">

          <span>
            Schade / ontbreekt
          </span>

          <strong id="adminProblemsCount">
            0
          </strong>

        </div>

      </div>


      <div class="admin-block">

        <div class="admin-block-title">

          <strong>
            Materiaal buiten
          </strong>

        </div>


        <div id="adminMaterialOutList"></div>

      </div>


      <div class="admin-block">

        <div class="admin-block-title">

          <strong>
            Schade & ontbrekend
          </strong>

        </div>


        <div id="adminProblemsList"></div>

      </div>

    </div>


    <!-- RAPPORTEN -->

    <div
      id="adminPane-reports"
      class="admin-pane hidden"
    >

      <div class="admin-page-title">

        <span>
          ANALYSE
        </span>

        <strong>
          Rapportage
        </strong>

      </div>


      <div class="admin-report-card">

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


        <div class="admin-report-grid">

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


        <div
          id="adminReportSummary"
          class="admin-report-summary"
        ></div>


        <div class="admin-chart">

          <canvas id="adminMaterialsChart"></canvas>

        </div>


        <button
          class="admin-export"
          type="button"
          onclick="exportAdminReportExcel()"
        >

          Excel downloaden

        </button>

      </div>

    </div>

  `;


  appMain
    .appendChild(
      section
    );


  createAdminDetailScreen();

}


/* ===============================
   ADMIN PANEL
================================ */

function adminPanelHtml(
  title,
  countId,
  listId,
  color,
  open,
  panelId = ""
) {

  return `

    <details
      ${panelId ? `id="${panelId}"` : ""}
      class="admin-panel"
      ${open ? "open" : ""}
    >

      <summary>

        <span
          class="admin-dot ${color}"
        ></span>

        <b>
          ${title}
        </b>

        <strong id="${countId}">
          0
        </strong>

      </summary>


      <div class="admin-panel-body">

        <div id="${listId}">

          <div class="empty">
            Laden...
          </div>

        </div>

      </div>

    </details>

  `;

}


/* ===============================
   DETAIL SCHERM
================================ */

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


    <div id="adminDetailContent"></div>

  `;


  appMain
    .appendChild(
      section
    );

}


/* ===============================
   OPEN ADMIN
================================ */

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

  catch (
    error
  ) {

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


/* ===============================
   TABS
================================ */

function switchAdminTab(
  tab
) {

  [
    "overview",
    "requests",
    "material",
    "reports"
  ]
    .forEach(
      name => {

        document
          .getElementById(
            `adminPane-${name}`
          )
          ?.classList
          .toggle(
            "hidden",
            name !== tab
          );


        document
          .getElementById(
            `adminTab-${name}`
          )
          ?.classList
          .toggle(
            "active",
            name === tab
          );

      }
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


function openAdminArchive() {

  setTimeout(
    () => {

      const panel =
        document
          .getElementById(
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
    80
  );

}


function backToAdminDashboard() {

  showOnly(
    "adminScreen"
  );


  switchAdminTab(
    "overview"
  );


  renderAdminStatistics();

  renderAdminSections();

}


function closeAdminDashboard() {

  goHome();

}


/* ===============================
   DATA LADEN
================================ */

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


    const wholesaleProofsResult =
      await supabaseClient
        .from(
          "wholesale_order_proofs"
        )
        .select(`
          order_id,
          signer_name,
          signed_at,
          proof_hash
        `);


    adminProfiles =
      profilesResult.data ||
      [];


    adminOrders =
      ordersResult.data ||
      [];


    adminItems =
      itemsResult.data ||
      [];


    adminEventReturns =
      returnsResult.data ||
      [];


    adminWholesaleOrders =

      wholesaleResult.error

        ? []

        : (
            wholesaleResult.data ||
            []
          );


    adminWholesaleItems =

      wholesaleItemsResult.error

        ? []

        : (
            wholesaleItemsResult.data ||
            []
          );


    adminWholesaleProofs =

      wholesaleProofsResult.error

        ? []

        : (
            wholesaleProofsResult.data ||
            []
          );


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


    if (
      wholesaleProofsResult.error
    ) {

      console.warn(
        "WHOLESALE PROOFS:",
        wholesaleProofsResult.error
      );

    }


    fillRepresentativeFilters();

    fillReportYears();

    setCurrentReportMonth();

    renderAdminStatistics();

    renderAdminSections();

    updateAdminReport();

  }

  catch (
    error
  ) {

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

/* ===============================
   REPRESENTATIVES
================================ */

function fillRepresentativeFilters() {

  [

    document
      .getElementById(
        "adminRepFilter"
      ),

    document
      .getElementById(
        "reportRepresentative"
      )

  ]
    .forEach(
      select => {

        if (
          !select
        ) {

          return;

        }


        const old =
          select.value;


        select.innerHTML = `

          <option value="">
            Alle vertegenwoordigers
          </option>

        `;


        adminProfiles

          .filter(
            profile =>
              profile.actief !==
              false
          )

          .sort(
            (
              first,
              second
            ) =>

              String(
                first.naam ||
                ""
              )
                .localeCompare(
                  String(
                    second.naam ||
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

                profile.naam ||

                profile.email ||

                "Onbekend";


              select
                .appendChild(
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
                old
            )
        ) {

          select.value =
            old;

        }

      }
    );

}


/* ============================================================
   CENTRALE EVENEMENTMATERIAAL LOGICA
============================================================ */

function isEventMaterialCategory(
  category
) {

  return [

    "evenement",
    "evenementen",
    "event",
    "events"

  ]
    .includes(

      String(
        category ||
        ""
      )
        .trim()
        .toLowerCase()

    );

}


function getEventMaterialItems(
  orderId
) {

  return adminItems
    .filter(
      item =>

        item.order_id ===
        orderId

        &&

        isEventMaterialCategory(
          item.categorie
        )
    );

}


function getEventMaterialStatus(
  orderId
) {

  return getEventMaterialItems(
    orderId
  )
    .map(
      item => {

        const returnRow =
          adminEventReturns
            .find(
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


        return {

          product_naam:
            item.product_naam,

          uitgeleend:
            loaned,

          goed_terug:
            good,

          beschadigd:
            damaged,

          ontbreekt:
            missing,

          nog_buiten:

            Math.max(

              0,

              loaned -
              good -
              damaged -
              missing

            ),

          opmerking:
            returnRow?.opmerking ||
            ""

        };

      }
    );

}


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


function getMaterialOutOrders() {

  return adminOrders
    .filter(
      order => {

        if (
          !order.event_naam ||
          order.status !==
          "afgehaald"
        ) {

          return false;

        }


        const items =
          getEventMaterialItems(
            order.id
          );


        if (
          !items.length
        ) {

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


function getProblemRows() {

  return adminEventReturns
    .filter(
      row =>

        Number(
          row.beschadigd ||
          0
        ) > 0

        ||

        Number(
          row.ontbreekt ||
          0
        ) > 0
    );

}


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


/* ===============================
   KPI
================================ */

function renderAdminStatistics() {

  const container =
    document
      .getElementById(
        "adminStatistics"
      );


  if (
    !container
  ) {

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


  const outside =
    getMaterialOutOrders()
      .length;


  const ready =
    adminOrders
      .filter(
        order =>
          order.status ===
          "klaar"
      )
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
  value,
  label,
  action
) {

  return `

    <button
      class="admin-kpi ${color}"
      type="button"
      onclick="${action}"
    >

      <strong>
        ${value}
      </strong>

      <span>
        ${label}
      </span>

    </button>

  `;

}


function setAdminStatusAndOpen(
  status
) {

  switchAdminTab(
    "requests"
  );


  const select =
    document
      .getElementById(
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


/* ===============================
   ATTENTION
================================ */

function renderAdminAttentionPanel() {

  const container =
    document
      .getElementById(
        "adminAttentionPanel"
      );


  if (
    !container
  ) {

    return;

  }


  const problems =
    getProblemRows()
      .length;


  const outside =
    getMaterialOutOrders()
      .length;


  const processing =
    adminOrders
      .filter(
        order =>
          order.status ===
          "in_behandeling"
      )
      .length;


  let html =
    "";


  if (
    problems
  ) {

    html +=
      adminAttention(

        "red",

        "!",

        `${problems} materiaalprobleem${problems === 1 ? "" : "en"}`,

        "Beschadigd of ontbrekend",

        "switchAdminTab('material')"

      );

  }


  if (
    outside
  ) {

    html +=
      adminAttention(

        "orange",

        "↩",

        `${outside} retour${outside === 1 ? "" : "s"} te verwerken`,

        "Materiaal staat nog buiten",

        "switchAdminTab('material')"

      );

  }


  if (
    processing
  ) {

    html +=
      adminAttention(

        "yellow",

        "•",

        `${processing} in behandeling`,

        "Aanvragen wachten op actie",

        "switchAdminTab('requests')"

      );

  }


  container.innerHTML =

    html

    ||

    `

      <div class="admin-clear">

        <b>
          Alles onder controle
        </b>

        <span>
          Geen dringende acties.
        </span>

      </div>

    `;

}


function adminAttention(
  color,
  symbol,
  title,
  sub,
  action
) {

  return `

    <button
      class="admin-attention ${color}"
      type="button"
      onclick="${action}"
    >

      <b>
        ${symbol}
      </b>


      <div>

        <strong>
          ${title}
        </strong>

        <span>
          ${sub}
        </span>

      </div>


      <i>
        ›
      </i>

    </button>

  `;

}


/* ===============================
   FILTERS
================================ */

function getFilteredAdminOrders() {

  const representative =
    document
      .getElementById(
        "adminRepFilter"
      )
      ?.value ||
    "";


  const status =
    document
      .getElementById(
        "adminStatusFilter"
      )
      ?.value ||
    "";


  const search =
    (
      document
        .getElementById(
          "adminSearch"
        )
        ?.value ||
      ""
    )

      .trim()

      .toLowerCase();


  return adminOrders
    .filter(
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
          !search
        ) {

          return true;

        }


        const profile =
          getAdminProfile(
            order.user_id
          );


        return [

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

          .toLowerCase()

          .includes(
            search
          );

      }
    );

}


/* ===============================
   RENDER SECTIONS
================================ */

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

          order.event_naam

          &&

          !isArchivedOrder(
            order
          )

          &&

          order.status !==
          "afgehaald"
      );


  const outside =
    filtered
      .filter(
        order =>

          order.event_naam

          &&

          order.status ===
          "afgehaald"

          &&

          !order.event_returned_at

          &&

          getEventOutstandingTotal(
            order.id
          ) > 0
      );


  const archive =
    filtered
      .filter(
        isArchivedOrder
      );


  const problems =
    getProblemRows();


  setCount(
    "adminRegularCount",
    regular.length
  );


  setCount(
    "adminEventCount",
    events.length
  );


  setCount(
    "adminWholesaleCount",
    adminWholesaleOrders.length
  );


  setCount(
    "adminArchiveCount",
    archive.length
  );


  setCount(
    "adminMaterialOutCount",
    outside.length
  );


  setCount(
    "adminProblemsCount",
    problems.length
  );


  setCount(
    "overviewRegularCount",
    regular.length
  );


  setCount(
    "overviewEventCount",
    events.length
  );


  setCount(
    "overviewWholesaleCount",
    adminWholesaleOrders.length
  );


  setCount(
    "overviewArchiveCount",
    archive.length
  );


  setCount(
    "overviewMaterialOutCount",
    outside.length
  );


  setCount(
    "overviewProblemsCount",
    problems.length
  );


  renderOrderList(

    "adminRegularOrdersList",

    regular,

    "Geen actieve POS- of bieraanvragen."

  );


  renderOrderList(

    "adminEventOrdersList",

    events,

    "Geen actieve evenementaanvragen."

  );


  renderOrderList(

    "adminArchiveList",

    archive,

    "Nog geen afgehandelde aanvragen."

  );


  renderMaterialOutList(
    outside
  );


  renderProblemMaterials();


  renderAdminWholesaleOrders();


  renderAdminAttentionPanel();

}


function setCount(
  id,
  value
) {

  const element =
    document
      .getElementById(
        id
      );


  if (
    element
  ) {

    element.textContent =
      value;

  }

}


/* ===============================
   ORDER LIST
================================ */

function renderOrderList(
  id,
  orders,
  emptyText
) {

  const container =
    document
      .getElementById(
        id
      );


  if (
    !container
  ) {

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

          sum +
          Number(
            item.aantal ||
            0
          ),

        0
      );


  const title =

    order.event_naam ||

    order.referentie ||

    "Geen referentie";


  const meta =

    order.event_naam

      ? `${order.event_vanaf || ""} t/m ${order.event_tot || ""}`

      : order.gemeente ||
        order.land ||
        "";


  return `

    <button
      class="admin-order-card"
      type="button"
      onclick="openAdminOrder('${order.id}')"
    >

      <div>

        <span>

          ${createOrderReference(
            order.id,
            order.created_at
          )}

        </span>


        <em
          class="status ${adminStatusClass(order.status)}"
        >

          ${formatStatus(
            order.status
          )}

        </em>

      </div>


      <strong>

        ${adminEscapeHtml(
          title
        )}

      </strong>


      <small>

        ${adminEscapeHtml(
          profile?.naam ||
          "Onbekend"
        )}

        ·

        ${adminEscapeHtml(
          meta
        )}

        ·

        ${total}
        item(s)

      </small>

    </button>

  `;

}


/* ===============================
   MATERIAAL BUITEN
================================ */

function renderMaterialOutList(
  orders
) {

  const container =
    document
      .getElementById(
        "adminMaterialOutList"
      );


  if (
    !container
  ) {

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

          <div class="admin-clear">

            <b>
              Geen materiaal buiten
            </b>

          </div>

        `;

}


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
    materials
      .reduce(
        (
          total,
          item
        ) =>

          total +
          item.nog_buiten,

        0
      );


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


          <small>

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

          </small>

        </div>


        <b>
          ${totalOutside}
          buiten
        </b>

      </div>


      ${
        materials

          .map(
            item => `

              <div class="admin-material-line">

                <strong>

                  ${adminEscapeHtml(
                    item.product_naam
                  )}

                </strong>


                <span>
                  Uit ${item.uitgeleend}
                </span>


                <span class="ok">
                  Terug ${item.goed_terug}
                </span>


                ${
                  item.beschadigd

                    ? `

                        <span class="bad">

                          Kapot
                          ${item.beschadigd}

                        </span>

                      `

                    : ""
                }


                ${
                  item.ontbreekt

                    ? `

                        <span class="bad">

                          Ontbreekt
                          ${item.ontbreekt}

                        </span>

                      `

                    : ""
                }


                <b>

                  Nog buiten
                  ${item.nog_buiten}

                </b>

              </div>

            `
          )

          .join("")
      }


      <button
        type="button"
        onclick="openAdminOrder('${order.id}')"
      >

        Retour verwerken ›

      </button>

    </div>

  `;

}


/* ===============================
   PROBLEMEN
================================ */

function renderProblemMaterials() {

  const container =
    document
      .getElementById(
        "adminProblemsList"
      );


  if (
    !container
  ) {

    return;

  }


  const problems =
    getProblemRows();


  if (
    !problems.length
  ) {

    container.innerHTML = `

      <div class="admin-clear">

        <b>
          Geen schade of ontbrekend materiaal
        </b>

      </div>

    `;


    return;

  }


  container.innerHTML =

    problems

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

            <div class="admin-problem">

              <strong>

                ${adminEscapeHtml(
                  row.product_naam
                )}

              </strong>


              <small>

                ${adminEscapeHtml(
                  order?.event_naam ||
                  "Onbekend evenement"
                )}

              </small>


              ${
                Number(
                  row.beschadigd ||
                  0
                )

                  ? `

                      <b>

                        Beschadigd:
                        ${row.beschadigd}

                      </b>

                    `

                  : ""
              }


              ${
                Number(
                  row.ontbreekt ||
                  0
                )

                  ? `

                      <b>

                        Ontbreekt:
                        ${row.ontbreekt}

                      </b>

                    `

                  : ""
              }


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

      .join("");

}


/* ===============================
   WHOLESALE
================================ */

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


          const proof =
            adminWholesaleProofs
              .find(
                item =>
                  item.order_id ===
                  order.id
              );


          const orderYear =

            order.created_at

              ? new Date(
                  order.created_at
                )
                  .getFullYear()

              : new Date()
                  .getFullYear();


          const orderNumber =

            `GH-${orderYear}-${String(
              order.id
            )
              .slice(
                0,
                8
              )
              .toUpperCase()}`;


          const signedDate =

            proof?.signed_at

              ? new Date(
                  proof.signed_at
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
                  )

              : "";


          const proofStatus =

            proof

              ? `

                  <span
                    style="
                      display:inline-flex;
                      align-items:center;
                      padding:3px 7px;
                      border-radius:999px;
                      background:#e7f3eb;
                      color:#2f7449;
                      font-size:9px;
                      font-weight:900;
                    "
                  >

                    ✓ Ondertekend

                  </span>

                `

              : `

                  <span
                    style="
                      display:inline-flex;
                      align-items:center;
                      padding:3px 7px;
                      border-radius:999px;
                      background:#f8f0e1;
                      color:#9a611e;
                      font-size:9px;
                      font-weight:900;
                    "
                  >

                    Geen bewijs

                  </span>

                `;


          const proofInformation =

            proof

              ? `

                  <div
                    style="
                      padding:9px;
                      margin-bottom:8px;
                      border-radius:10px;
                      background:#e7f3eb;
                      color:#245b38;
                    "
                  >

                    <div
                      style="
                        font-size:9px;
                        font-weight:900;
                        text-transform:uppercase;
                      "
                    >

                      Klantgoedkeuring

                    </div>


                    <div
                      style="
                        margin-top:4px;
                        font-size:11px;
                      "
                    >

                      Ondertekend door:

                      <strong>

                        ${adminEscapeHtml(
                          proof.signer_name ||
                          ""
                        )}

                      </strong>

                    </div>


                    <div
                      style="
                        margin-top:2px;
                        font-size:9px;
                        opacity:.8;
                      "
                    >

                      ${adminEscapeHtml(
                        signedDate
                      )}

                    </div>

                  </div>

                `

              : `

                  <div
                    class="info"
                    style="
                      margin-bottom:8px;
                    "
                  >

                    Voor deze bestelling is geen
                    ondertekend bewijs beschikbaar.

                    <br><br>

                    Dit kan een bestelling zijn die
                    werd gemaakt vóór de
                    handtekeningfunctie werd toegevoegd.

                  </div>

                `;


          const productRows =

            items.length

              ? items

                  .map(
                    item => {

                      const action =

                        item.actie &&
                        item.actie !==
                        "geen"

                          ? `

                              <small
                                style="
                                  display:block;
                                  color:#8c692f;
                                  font-size:9px;
                                  margin-top:2px;
                                "
                              >

                                ${adminEscapeHtml(
                                  item.actie
                                )}

                                ·

                                ${Number(
                                  item.gratis_aantal ||
                                  0
                                )}

                                gratis

                              </small>

                            `

                          : "";


                      return `

                        <div class="summary-line">

                          <div>

                            <span>

                              ${adminEscapeHtml(
                                item.product_naam ||
                                ""
                              )}

                            </span>


                            ${action}

                          </div>


                          <strong>

                            ${Number(
                              item.totaal_aantal ||
                              item.betaald_aantal ||
                              0
                            )}

                          </strong>

                        </div>

                      `;

                    }
                  )

                  .join("")

              : `

                  <div class="empty">

                    Geen bestelregels gevonden.

                  </div>

                `;


          const pdfButton =

            proof

              ? `

                  <button
                    type="button"
                    onclick="downloadWholesaleProofPdf('${order.id}')"
                    style="
                      width:100%;
                      min-height:42px;
                      margin-top:9px;
                      border:0;
                      border-radius:10px;
                      background:#2f7449;
                      color:white;
                      font-weight:900;
                    "
                  >

                    PDF bestelbewijs

                  </button>

                `

              : "";


          return `

            <details
              class="admin-wholesale"
              style="
                border-left:
                  5px solid
                  ${
                    proof
                      ? "#2f7449"
                      : "#d99a3e"
                  };
              "
            >

              <summary>

                <div>

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:7px;
                      flex-wrap:wrap;
                    "
                  >

                    <b>

                      ${adminEscapeHtml(
                        order.referentie ||
                        "Geen referentie"
                      )}

                    </b>


                    ${proofStatus}

                  </div>


                  <small>

                    ${adminEscapeHtml(
                      profile?.naam ||
                      "Onbekende vertegenwoordiger"
                    )}

                    ·

                    ${adminEscapeHtml(
                      order.drankenhandel ||
                      "Geen drankenhandel"
                    )}

                  </small>

                </div>


                <span
                  style="
                    color:#8c692f;
                    font-size:9px;
                    font-weight:900;
                  "
                >

                  ${orderNumber}

                </span>

              </summary>


              <div
                style="
                  padding-top:8px;
                "
              >

                ${proofInformation}

                ${productRows}

                ${pdfButton}

              </div>

            </details>

          `;

        }
      )

      .join("");

}



/* ===============================
   ORDER OPEN
================================ */

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


  if (
    !order
  ) {

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


/* ===============================
   DETAIL
================================ */

function renderAdminDetail(
  order
) {

  const container =
    document
      .getElementById(
        "adminDetailContent"
      );


  if (
    !container
  ) {

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
    items
      .filter(
        item =>
          item.categorie ===
          "bier"
      );


  const pos =
    items
      .filter(
        item =>
          item.categorie ===
          "pos"
      );


  const events =
    items
      .filter(
        item =>
          isEventMaterialCategory(
            item.categorie
          )
      );


  container.innerHTML = `

    <div class="card">

      <div class="admin-detail-top">

        <div>

          <small>

            ${createOrderReference(
              order.id,
              order.created_at
            )}

          </small>


          <h2>

            ${adminEscapeHtml(
              order.event_naam ||
              order.referentie ||
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


      ${detailRow(
        "Vertegenwoordiger",
        profile?.naam ||
        ""
      )}


      ${detailRow(
        "E-mail",
        profile?.email ||
        ""
      )}


      ${
        order.event_naam

          ? detailRow(
              "Materiaal vanaf",
              order.event_vanaf ||
              ""
            )

            +

            detailRow(
              "Materiaal t/m",
              order.event_tot ||
              ""
            )

          : detailRow(
              "Land",
              order.land ||
              ""
            )

            +

            detailRow(
              "Gemeente",
              order.gemeente ||
              ""
            )

            +

            detailRow(
              "Afhaaldatum",
              order.afhaaldatum ||
              ""
            )
      }

    </div>


    ${categoryCard(
      "BIER",
      beer,
      "green"
    )}


    ${categoryCard(
      "POS-MATERIALEN",
      pos,
      "blue"
    )}


    ${categoryCard(
      "EVENEMENTENMATERIAAL",
      events,
      "orange"
    )}


    ${
      order.opmerking

        ? `

            <div class="card">

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


    <div class="card">

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

    updateAllReturnCalculations(
      order.id
    );

  }

}


function detailRow(
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


function categoryCard(
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
      class="card admin-category ${color}"
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

      <div class="card">

        <h3>
          Retour evenementmateriaal
        </h3>


        <div class="info">

          Retourregistratie wordt beschikbaar zodra het materiaal als afgehaald staat.

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

      <div class="card">

        <h3>
          Retour evenementmateriaal
        </h3>


        <div class="info error">

          Er zijn geen evenementmaterialen aan deze aanvraag gekoppeld.

        </div>

      </div>

    `;

  }


  const loaned =
    materials
      .reduce(
        (
          total,
          item
        ) =>

          total +
          item.uitgeleend,

        0
      );


  const outside =
    materials
      .reduce(
        (
          total,
          item
        ) =>

          total +
          item.nog_buiten,

        0
      );


  return `

    <div class="card admin-return-card">

      <div class="admin-return-title">

        <div>

          <small>
            LOGISTIEK
          </small>

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


      <div class="admin-return-summary">

        <div>

          <span>
            Uitgeleend
          </span>

          <strong>
            ${loaned}
          </strong>

        </div>


        <div
          class="${outside ? "open" : "done"}"
        >

          <span>
            Nog buiten
          </span>

          <strong id="returnTotalOutside">
            ${outside}
          </strong>

        </div>

      </div>


      ${
        materials

          .map(
            item => `

              <div class="admin-return-item">

                <div class="admin-return-item-head">

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


                ${returnControl(
                  order.id,
                  item.product_naam,
                  "good",
                  "Goed terug",
                  item.goed_terug,
                  "green"
                )}


                ${returnControl(
                  order.id,
                  item.product_naam,
                  "damaged",
                  "Beschadigd",
                  item.beschadigd,
                  "orange"
                )}


                ${returnControl(
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
                  class="admin-return-outside ${item.nog_buiten === 0 ? "done" : ""}"
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

          .join("")
      }


      <button
        class="admin-save-return"
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
                class="admin-reset-return"
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


/* ===============================
   RETURN CONTROL
================================ */

function returnControl(
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

    <div
      class="admin-return-control ${color}"
    >

      <span>
        ${label}
      </span>


      <div>

        <button
          type="button"
          onclick="changeReturnQuantity('${orderId}', '${safe}', '${type}', -1)"
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
          onclick="changeReturnQuantity('${orderId}', '${safe}', '${type}', 1)"
        >
          +
        </button>

      </div>

    </div>

  `;

}


/* ===============================
   RETURN IDS
================================ */

function returnDomId(
  orderId,
  productName,
  type
) {

  return (

    `return_${String(
      orderId
    ).replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_${String(
      productName ||
      ""
    ).replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_${type}`

  );

}


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


function setReturnScreenValue(
  orderId,
  productName,
  type,
  value
) {

  const element =
    document
      .getElementById(
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
          value ||
          0
        )
      );

  }

}


/* ===============================
   CHANGE RETURN
================================ */

function changeReturnQuantity(
  orderId,
  productName,
  type,
  amount
) {

  const item =
    getEventMaterialItems(
      orderId
    )
      .find(
        material =>
          material.product_naam ===
          productName
      );


  if (
    !item
  ) {

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
    values.good +
    values.damaged +
    values.missing

    >

    Number(
      item.aantal ||
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


  updateReturnTotal(
    orderId
  );

}


/* ===============================
   RETURN CALC
================================ */

function updateReturnCalculation(
  orderId,
  productName
) {

  const item =
    getEventMaterialItems(
      orderId
    )
      .find(
        material =>
          material.product_naam ===
          productName
      );


  if (
    !item
  ) {

    return;

  }


  const outside =

    Math.max(

      0,

      Number(
        item.aantal ||
        0
      )

      -

      getReturnScreenValue(
        orderId,
        productName,
        "good"
      )

      -

      getReturnScreenValue(
        orderId,
        productName,
        "damaged"
      )

      -

      getReturnScreenValue(
        orderId,
        productName,
        "missing"
      )

    );


  const element =
    document
      .getElementById(
        returnDomId(
          orderId,
          productName,
          "outside"
        )
      );


  if (
    element
  ) {

    element.textContent =
      `Nog buiten: ${outside}`;


    element.classList.toggle(
      "done",
      outside === 0
    );

  }

}


function updateReturnTotal(
  orderId
) {

  const total =

    getEventMaterialItems(
      orderId
    )
      .reduce(
        (
          sum,
          item
        ) => {

          return (

            sum

            +

            Math.max(

              0,

              Number(
                item.aantal ||
                0
              )

              -

              getReturnScreenValue(
                orderId,
                item.product_naam,
                "good"
              )

              -

              getReturnScreenValue(
                orderId,
                item.product_naam,
                "damaged"
              )

              -

              getReturnScreenValue(
                orderId,
                item.product_naam,
                "missing"
              )

            )

          );

        },
        0
      );


  const element =
    document
      .getElementById(
        "returnTotalOutside"
      );


  if (
    element
  ) {

    element.textContent =
      total;

  }

}


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


  updateReturnTotal(
    orderId
  );

}


/* ===============================
   ALL RETURNED
================================ */

function markEverythingReturned(
  orderId
) {

  getEventMaterialItems(
    orderId
  )
    .forEach(
      item => {

        setReturnScreenValue(
          orderId,
          item.product_naam,
          "good",
          Number(
            item.aantal ||
            0
          )
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


  updateReturnTotal(
    orderId
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


/* ===============================
   SAVE RETURN
================================ */

async function saveEventReturnRegistration(
  orderId
) {

  try {

    const items =
      getEventMaterialItems(
        orderId
      );


    const returns =
      items
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

  catch (
    error
  ) {

    alert(

      "Retourregistratie kon niet worden opgeslagen.\n\n"

      +

      adminReadableError(
        error
      )

    );

  }

}


/* ===============================
   RESET RETURN
================================ */

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


/* ===============================
   TIMELINE
================================ */

function adminStatusTimeline(
  order
) {

  return `

    <div class="admin-timeline">

      ${timelineRow(
        "Aangevraagd",
        order.created_at,
        true
      )}


      ${timelineRow(
        "In behandeling",
        order.opened_at,
        Boolean(
          order.opened_at
        )
      )}


      ${timelineRow(
        "Klaar",
        order.completed_at,
        Boolean(
          order.completed_at
        )
      )}


      ${timelineRow(
        "Afgehaald",
        order.collected_at,
        Boolean(
          order.collected_at
        )
      )}


      ${
        order.event_naam

          ? timelineRow(

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


function timelineRow(
  label,
  date,
  active
) {

  return `

    <div
      class="admin-timeline-row ${active ? "active" : ""}"
    >

      <i></i>


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


/* ===============================
   STATUS ACTIONS
================================ */

function adminActionButtons(
  order
) {

  if (
    order.status ===
    "in_behandeling"
  ) {

    return `

      <button
        class="admin-primary"
        type="button"
        onclick="markAdminOrderCompleted()"
      >

        Klaar voor afhaling

      </button>


      <button
        class="admin-secondary"
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
        class="admin-primary"
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


/* ===============================
   UPDATE STATUS
================================ */

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


/* ===============================
   REPORT YEARS
================================ */

function fillReportYears() {

  const select =
    document
      .getElementById(
        "reportYear"
      );


  if (
    !select
  ) {

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
    let year = current;

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


/* ===============================
   REPORT MONTH
================================ */

function setCurrentReportMonth() {

  const select =
    document
      .getElementById(
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


/* ===============================
   REPORT PERIOD
================================ */

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
      type === "year"
    );


  updateAdminReport();

}


/* ===============================
   REPORT ORDERS
================================ */

function getReportOrders() {

  const representative =
    document
      .getElementById(
        "reportRepresentative"
      )
      ?.value ||
    "";


  const type =
    document
      .getElementById(
        "reportPeriodType"
      )
      ?.value ||
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
          representative

          &&

          order.user_id !==
          representative
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


/* ===============================
   REPORT TOTALS
================================ */

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
          item.product_naam ||
          "Onbekend";


        totals[
          name
        ] =

          (
            totals[
              name
            ] ||
            0
          )

          +

          Number(
            item.aantal ||
            0
          );

      }
    );


  return totals;

}


/* ===============================
   REPORT DISPLAY
================================ */

function updateAdminReport() {

  const container =
    document
      .getElementById(
        "adminReportSummary"
      );


  if (
    !container
  ) {

    return;

  }


  const orders =
    getReportOrders();


  const totals =
    getReportMaterialTotals();


  const totalItems =

    Object
      .values(
        totals
      )

      .reduce(
        (
          first,
          second
        ) =>

          first +
          second,

        0
      );


  container.innerHTML = `

    <div>

      <strong>
        ${orders.length}
      </strong>

      <span>
        Afgehaalde aanvragen
      </span>

    </div>


    <div>

      <strong>
        ${totalItems}
      </strong>

      <span>
        Materialen / producten
      </span>

    </div>

  `;


  renderAdminReportChart(
    totals
  );

}


/* ===============================
   CHART
================================ */

function renderAdminReportChart(
  totals
) {

  const canvas =
    document
      .getElementById(
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

          second[1] -
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

            entries
              .map(
                entry =>
                  entry[0]
              ),

          datasets: [

            {

              label:
                "Afgehaald aantal",

              data:

                entries
                  .map(
                    entry =>
                      entry[1]
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


/* ===============================
   EXCEL
================================ */

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

              const returnRow =
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
                  item.aantal ||
                  0
                );


              const good =
                Number(
                  returnRow?.goed_terug ||
                  0
                );


              const damaged =
                Number(
                  returnRow?.beschadigd ||
                  0
                );


              const missing =
                Number(
                  returnRow?.ontbreekt ||
                  0
                );


              rows.push({

                "Afhaaldatum":
                  formatExcelDate(
                    order.collected_at
                  ),

                "Vertegenwoordiger":
                  profile?.naam ||
                  "",

                "E-mail":
                  profile?.email ||
                  "",

                "Type":
                  order.event_naam

                    ? "Evenement"

                    : item.categorie ===
                      "bier"

                      ? "Bier"

                      : "POS",

                "Referentie / evenement":
                  order.event_naam ||
                  order.referentie ||
                  "",

                "Gemeente":
                  order.gemeente ||
                  "",

                "Product / materiaal":
                  item.product_naam ||
                  "",

                "Categorie":
                  item.categorie ||
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
                        loaned -
                        good -
                        damaged -
                        missing
                      )

                    : "",

                "Retour opmerking":
                  returnRow?.opmerking ||
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


  const summary =
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
          summary
        ),

      "Samenvatting"

    );


  const repId =
    document
      .getElementById(
        "reportRepresentative"
      )
      ?.value;


  const representative =
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


  XLSX.writeFile(

    workbook,

    `Achel_${safeFilename(
      representative
    )}_${year}${type === "month" ? `_${String(month).padStart(2,"0")}` : ""}.xlsx`

  );

}


/* ===============================
   HELPERS
================================ */

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
  id
) {

  return adminProfiles
    .find(
      profile =>
        profile.id ===
        id
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
    index !== -1
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

  return date

    ? new Date(
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
        )

    : "";

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
    value ||
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
    value ||
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
    value ??
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


  return [

    error.message &&
    "Message: " +
    error.message,

    error.details &&
    "Details: " +
    error.details,

    error.hint &&
    "Hint: " +
    error.hint,

    error.code &&
    "Code: " +
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
   ADMIN STYLING
============================================================ */

function injectAdminStyles() {

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

      margin:
        -18px -16px -36px;

      min-height:
        100vh;

      background:
        #151c16;

      color:
        #f4f1e8;

      padding-bottom:
        28px;

    }


    .admin-head {

      padding:
        12px 14px 10px;

      background:
        #182019;

      border-bottom:
        1px solid
        #303830;

    }


    .admin-head span {

      display:block;

      color:
        #c6b17c;

      font-size:
        9px;

      font-weight:
        900;

      letter-spacing:
        .08em;

    }


    .admin-head strong {

      display:block;

      color:white;

      font-size:
        19px;

      margin-top:
        2px;

    }


    .admin-tabs {

      position:sticky;

      top:
        calc(
          64px +
          env(safe-area-inset-top)
        );

      z-index:
        30;

      display:grid;

      grid-template-columns:
        repeat(
          4,
          1fr
        );

      background:
        #f4f1e8;

      border-bottom:
        1px solid
        #cdc5b5;

    }


    .admin-tabs button {

      position:relative;

      min-height:
        46px;

      border:0;

      background:
        transparent;

      color:
        #252b25;

      font-size:
        9px;

      font-weight:
        900;

      text-transform:
        uppercase;

    }


    .admin-tabs button.active {

      color:
        #8c692f;

    }


    .admin-tabs button.active::after {

      content:"";

      position:absolute;

      left:10%;
      right:10%;
      bottom:0;

      height:3px;

      background:
        #b4883c;

    }


    .admin-pane {

      padding:
        11px;

    }


    .admin-kpis {

      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:7px;

    }


    .admin-kpi {

      --c:#ffffff;

      min-height:
        76px;

      border:
        1px solid
        #465047;

      border-radius:
        13px;

      background:
        #303930;

      text-align:left;

      padding:10px;

      color:white;

    }


    .admin-kpi strong {

      display:block;

      color:
        var(--c);

      font-size:
        26px;

    }


    .admin-kpi span {

      display:block;

      margin-top:
        4px;

      font-size:
        11px;

      font-weight:
        800;

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


    .admin-block {

      margin-top:
        14px;

    }


    .admin-block-title {

      margin-bottom:
        6px;

    }


    .admin-block-title span {

      display:block;

      color:#c6b17c;

      font-size:
        8px;

      font-weight:
        900;

    }


    .admin-block-title strong {

      display:block;

      color:white;

      font-size:
        17px;

      margin-top:
        2px;

    }


    .admin-row {

      width:100%;

      display:grid;

      grid-template-columns:
        1fr auto 14px;

      align-items:center;

      gap:8px;

      margin-bottom:
        6px;

      padding:
        10px 11px;

      border:
        1px solid
        #465047;

      border-left:
        5px solid
        var(--row);

      border-radius:
        12px;

      background:
        #343d35;

      color:white;

      text-align:left;

    }


    .admin-row div b {

      display:block;

      font-size:
        14px;

    }


    .admin-row div small {

      display:block;

      color:#aeb6af;

      font-size:
        9px;

      margin-top:
        2px;

    }


    .admin-row > strong {

      font-size:
        17px;

      color:
        var(--row);

    }


    .admin-row i {

      font-style:normal;

      color:#cfb778;

      font-size:
        20px;

    }


    .admin-row.green {
      --row:#71b67a;
    }


    .admin-row.orange {
      --row:#e0a447;
    }


    .admin-row.purple {
      --row:#a77ac5;
    }


    .admin-row.red {
      --row:#df6a56;
    }


    .admin-row.blue {
      --row:#719fc5;
    }


    .admin-row.grey {
      --row:#aaaaaa;
    }


    .admin-attention {

      width:100%;

      display:grid;

      grid-template-columns:
        30px 1fr 14px;

      align-items:center;

      gap:7px;

      margin-bottom:
        5px;

      padding:8px;

      border:0;

      border-radius:
        11px;

      text-align:left;

    }


    .admin-attention > b {

      width:28px;
      height:28px;

      display:grid;

      place-items:center;

      border-radius:8px;

      background:#ffffff38;

    }


    .admin-attention strong {

      display:block;

      font-size:
        11px;

    }


    .admin-attention span {

      display:block;

      font-size:
        8px;

      margin-top:
        1px;

    }


    .admin-attention i {

      font-style:normal;

      font-size:
        20px;

    }


    .admin-attention.red {

      background:#df6655;

      color:white;

    }


    .admin-attention.orange {

      background:#dfa047;

      color:#2c2112;

    }


    .admin-attention.yellow {

      background:#d8c38f;

      color:#30291e;

    }


    .admin-clear {

      padding:9px;

      border-radius:10px;

      background:#2c4632;

      color:#d9f0dd;

      font-size:
        10px;

    }


    .admin-clear span {

      display:block;

      font-size:
        8px;

      margin-top:
        2px;

    }


    .admin-page-title {

      margin-bottom:
        8px;

    }


    .admin-page-title span {

      display:block;

      color:#c6b17c;

      font-size:
        8px;

      font-weight:
        900;

    }


    .admin-page-title strong {

      display:block;

      color:white;

      font-size:
        18px;

    }


    .admin-searchbar {

      display:grid;

      grid-template-columns:
        1fr auto;

      gap:6px;

    }


    .admin-searchbar input {

      min-height:
        42px !important;

      border:
        1px solid
        #485149 !important;

      background:
        #303930 !important;

      color:
        white !important;

      border-radius:
        999px !important;

    }


    .admin-searchbar button {

      border:
        1px solid
        #485149;

      border-radius:
        999px;

      background:
        #303930;

      color:
        #d3b46d;

      padding:
        0 13px;

      font-size:
        10px;

      font-weight:
        900;

    }


    .admin-filters,
    .admin-report-card {

      margin-top:
        7px;

      padding:9px;

      border:
        1px solid
        #414941;

      border-radius:
        12px;

      background:
        #2a322b;

    }


    .admin-filters label,
    .admin-report-card label {

      color:
        #bac1bb;

      font-size:
        8px;

      margin:
        5px 0 3px;

    }


    .admin-filters select,
    .admin-report-card select {

      min-height:
        39px;

      background:
        #202721;

      color:white;

      border-color:
        #4a534b;

    }


    .admin-panel {

      margin-top:
        7px;

      border:
        1px solid
        #414a42;

      border-radius:
        12px;

      background:
        #2d352e;

      overflow:hidden;

    }


    .admin-panel > summary {

      list-style:none;

      display:grid;

      grid-template-columns:
        8px 1fr auto;

      align-items:center;

      gap:7px;

      min-height:
        46px;

      padding:
        0 10px;

      color:white;

      font-size:
        12px;

    }


    .admin-panel
    > summary::-webkit-details-marker {

      display:none;

    }


    .admin-panel
    > summary strong {

      padding:
        3px 7px;

      border-radius:
        999px;

      background:
        #e7e3d8;

      color:#555;

      font-size:
        9px;

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
      background:#aaaaaa;
    }


    .admin-panel-body {

      padding:
        4px 7px 7px;

      background:
        #202721;

      border-top:
        1px solid
        #424b43;

    }


    .admin-order-card {

      width:100%;

      margin-top:
        6px;

      padding:9px;

      border:
        1px solid
        #d8d5cd;

      border-radius:
        11px;

      background:white;

      text-align:left;

      color:#202722;

    }


    .admin-order-card > div {

      display:flex;

      justify-content:
        space-between;

      align-items:center;

    }


    .admin-order-card
    > div > span {

      font-size:
        9px;

      font-weight:
        900;

      color:#8c692f;

    }


    .admin-order-card
    > strong {

      display:block;

      margin-top:
        4px;

      font-size:
        13px;

    }


    .admin-order-card
    small {

      display:block;

      margin-top:
        3px;

      color:#747b75;

      font-size:
        9px;

    }


    .admin-order-card
    em {

      font-style:normal;

    }


    .admin-material-kpis {

      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:6px;

    }


    .admin-material-kpis
    > div {

      padding:9px;

      border-radius:
        11px;

    }


    .admin-material-kpis
    span {

      display:block;

      font-size:
        8px;

      font-weight:
        900;

    }


    .admin-material-kpis
    strong {

      display:block;

      font-size:
        22px;

      margin-top:
        2px;

    }


    .admin-material-kpis
    .orange {

      background:#dfa047;

      color:#2f2415;

    }


    .admin-material-kpis
    .red {

      background:#db6655;

      color:white;

    }


    .admin-material-card,
    .admin-problem {

      margin-top:
        6px;

      padding:9px;

      border-radius:
        11px;

      background:white;

      color:#202722;

    }


    .admin-material-head {

      display:flex;

      justify-content:
        space-between;

      gap:8px;

    }


    .admin-material-head
    strong {

      display:block;

    }


    .admin-material-head
    small {

      display:block;

      color:#777;

      font-size:
        8px;

      margin-top:
        2px;

    }


    .admin-material-head
    > b {

      color:#9a611e;

      font-size:
        11px;

    }


    .admin-material-line {

      display:flex;

      flex-wrap:wrap;

      gap:5px;

      margin-top:
        6px;

      padding-top:
        6px;

      border-top:
        1px solid
        #eeeeee;

      font-size:
        8px;

    }


    .admin-material-line
    > strong {

      min-width:100%;

      font-size:
        10px;

    }


    .admin-material-line
    .ok {

      color:#377744;

    }


    .admin-material-line
    .bad {

      color:#a74646;

    }


    .admin-material-card
    > button,
    .admin-problem
    button {

      width:100%;

      margin-top:
        7px;

      border:0;

      border-radius:
        8px;

      background:#8c692f;

      color:white;

      padding:7px;

      font-size:
        9px;

      font-weight:
        900;

    }


    .admin-problem
    strong,
    .admin-problem
    small,
    .admin-problem
    b {

      display:block;

    }


    .admin-problem
    small {

      color:#777;

      font-size:
        8px;

      margin-top:
        2px;

    }


    .admin-problem
    b {

      color:#a74646;

      font-size:
        9px;

      margin-top:
        3px;

    }


    .admin-wholesale {

      margin-top:
        6px;

      padding:9px;

      border-radius:
        11px;

      background:white;

      color:#202722;

    }


    .admin-wholesale
    summary b,
    .admin-wholesale
    summary small {

      display:block;

    }


    .admin-wholesale
    summary small {

      font-size:
        8px;

      color:#777;

      margin-top:
        2px;

    }


    .admin-report-grid,
    .admin-report-summary {

      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:6px;

    }


    .admin-report-summary {

      margin-top:
        8px;

    }


    .admin-report-summary
    > div {

      padding:8px;

      border:
        1px solid
        #465047;

      border-radius:
        10px;

      background:#202721;

    }


    .admin-report-summary
    strong {

      display:block;

      color:#d8b66a;

      font-size:
        20px;

    }


    .admin-report-summary
    span {

      display:block;

      color:#b6beb7;

      font-size:
        8px;

    }


    .admin-chart {

      height:270px;

      margin-top:
        8px;

      padding:5px;

      border-radius:
        9px;

      background:#f4f1e8;

    }


    .admin-export {

      width:100%;

      min-height:
        42px;

      margin-top:
        8px;

      border:0;

      border-radius:
        10px;

      background:#b48a42;

      color:white;

      font-weight:
        900;

    }


    .admin-detail-top {

      display:flex;

      justify-content:
        space-between;

      gap:8px;

    }


    .admin-detail-top
    small {

      color:#8c692f;

      font-size:
        9px;

      font-weight:
        900;

    }


    .admin-detail-top
    h2 {

      margin:
        3px 0 0;

    }


    .admin-detail-row {

      display:grid;

      grid-template-columns:
        110px 1fr;

      gap:7px;

      margin-top:
        7px;

    }


    .admin-detail-row
    span {

      font-size:
        8px;

      color:#777;

      text-transform:
        uppercase;

      font-weight:
        900;

    }


    .admin-detail-row
    strong {

      font-size:
        11px;

    }


    .admin-category {

      border-left:
        5px solid
        var(--cc);

    }


    .admin-category.green {
      --cc:#71b67a;
    }


    .admin-category.blue {
      --cc:#719fc5;
    }


    .admin-category.orange {
      --cc:#dfa047;
    }


    .admin-return-card {

      border-top:
        5px solid
        #dfa047;

    }


    .admin-return-title {

      display:flex;

      justify-content:
        space-between;

      align-items:center;

      gap:8px;

    }


    .admin-return-title
    small {

      font-size:
        8px;

      color:#9a611e;

      font-weight:
        900;

    }


    .admin-return-title
    h3 {

      margin:
        2px 0;

    }


    .admin-return-title
    button {

      border:0;

      border-radius:
        8px;

      background:#367243;

      color:white;

      padding:7px;

      font-size:
        8px;

      font-weight:
        900;

    }


    .admin-return-summary {

      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:6px;

      margin-top:
        7px;

    }


    .admin-return-summary
    > div {

      padding:7px;

      border-radius:
        9px;

      background:#eee9dd;

    }


    .admin-return-summary
    > div.open {

      background:#f6e4c6;

      color:#915c1d;

    }


    .admin-return-summary
    > div.done {

      background:#dff0e1;

      color:#367243;

    }


    .admin-return-summary
    span {

      display:block;

      font-size:
        8px;

    }


    .admin-return-summary
    strong {

      font-size:
        19px;

    }


    .admin-return-item {

      margin-top:
        7px;

      padding:8px;

      border:
        1px solid
        #dddddd;

      border-radius:
        10px;

      background:#f8f7f3;

    }


    .admin-return-item-head {

      display:flex;

      justify-content:
        space-between;

      gap:7px;

    }


    .admin-return-item-head
    span {

      font-size:
        8px;

      color:#777;

    }


    .admin-return-control {

      display:flex;

      justify-content:
        space-between;

      align-items:center;

      margin-top:
        5px;

      padding:
        5px 7px;

      border-radius:
        8px;

    }


    .admin-return-control.green {

      background:#e1f0e4;

      color:#367243;

    }


    .admin-return-control.orange {

      background:#f6e4c6;

      color:#915c1d;

    }


    .admin-return-control.red {

      background:#f5d6d1;

      color:#a44437;

    }


    .admin-return-control
    > span {

      font-size:
        9px;

      font-weight:
        850;

    }


    .admin-return-control
    > div {

      display:flex;

      align-items:center;

      gap:4px;

    }


    .admin-return-control
    button {

      width:28px;
      height:28px;

      border:0;

      border-radius:
        7px;

      background:white;

      font-size:
        17px;

    }


    .admin-return-control
    b {

      min-width:
        20px;

      text-align:center;

    }


    .admin-return-outside {

      margin-top:
        5px;

      padding:6px;

      border-radius:
        8px;

      background:#eeeeee;

      font-size:
        9px;

      font-weight:
        900;

    }


    .admin-return-outside.done {

      background:#dff0e1;

      color:#367243;

    }


    .admin-return-item
    textarea {

      min-height:
        50px;

      margin-top:
        5px;

      font-size:
        10px;

    }


    .admin-save-return,
    .admin-primary {

      width:100%;

      min-height:
        42px;

      margin-top:
        8px;

      border:0;

      border-radius:
        10px;

      background:#8c692f;

      color:white;

      font-weight:
        900;

    }


    .admin-reset-return,
    .admin-secondary {

      width:100%;

      min-height:
        40px;

      margin-top:
        5px;

      border:
        1px solid
        #cccccc;

      border-radius:
        10px;

      background:white;

      color:#555;

      font-weight:
        850;

    }


    .admin-timeline {

      display:grid;

      gap:5px;

    }


    .admin-timeline-row {

      display:grid;

      grid-template-columns:
        9px 1fr;

      gap:6px;

    }


    .admin-timeline-row
    > i {

      width:8px;
      height:8px;

      margin-top:
        3px;

      border-radius:
        50%;

      background:#cccccc;

    }


    .admin-timeline-row.active
    > i {

      background:#367243;

    }


    .admin-timeline-row
    strong {

      font-size:
        10px;

    }


    .admin-timeline-row
    small {

      display:block;

      color:#777;

      font-size:
        8px;

    }

  `;


  document.head
    .appendChild(
      style
    );

}


/* ===============================
   GLOBAL
================================ */

window.openAdminDashboard =
  openAdminDashboard;


/* ===============================
   AUTO START
================================ */

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
