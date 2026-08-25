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

let adminEventDeliveryProofs = [];

let adminFreeBeerRegistrations = [];

let adminFreeBeerLoaded =
  false;

let adminProducts = [];

let adminPosAvailableStock = {};

let adminCatalogView =
  "pos";

let selectedAdminOrder =
  null;

let adminReportChart =
  null;

let adminRequestView =
  "regular";


/* ===============================
   LAZY LOAD STATUS
================================ */

let adminReportsLoaded =
  false;

let adminReportsLoading =
  null;

const adminEventDeliveryProofChecked =
  new Set();


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

  injectProfessionalReturnStyles();


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
        id="adminTab-stock"
        onclick="switchAdminTab('stock')"
        type="button"
      >
        Voorraad
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
            AANVRAGEN
          </span>

          <strong>
            Open direct
          </strong>

        </div>


        <button
          class="admin-row green"
          onclick="openAdminRequestView('regular')"
          type="button"
        >

          <div>

            <b>
              POS & bier
            </b>

            <small>
              Alleen POS- en bieraanvragen
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
          onclick="openAdminRequestView('events')"
          type="button"
        >

          <div>

            <b>
              Evenementen
            </b>

            <small>
              Alleen evenementaanvragen
            </small>

          </div>

          <strong id="overviewEventCount">
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


      <div class="admin-request-switch">

        <button
          id="adminRequestView-regular"
          class="active"
          type="button"
          onclick="setAdminRequestView('regular')"
        >
          POS & bier
        </button>

        <button
          id="adminRequestView-events"
          type="button"
          onclick="setAdminRequestView('events')"
        >
          Evenementen
        </button>
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


      <div id="adminRequestPane-regular">

        ${adminPanelHtml(
          "POS & bier",
          "adminRegularCount",
          "adminRegularOrdersList",
          "green",
          true
        )}

      </div>


      <div
        id="adminRequestPane-events"
        class="hidden"
      >

        ${adminPanelHtml(
          "Evenementen",
          "adminEventCount",
          "adminEventOrdersList",
          "orange",
          true
        )}

      </div>

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
            Actie nodig
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
            Actie nodig
          </strong>

        </div>

        <div id="adminProblemsList"></div>

      </div>

    </div>


    <!-- VOORRAAD -->

    <div
      id="adminPane-stock"
      class="admin-pane hidden"
    >

      <div class="admin-page-title">

        <span>
          BEHEER
        </span>

        <strong>
          Voorraadbeheer
        </strong>

      </div>


      <div class="admin-stock-intro">

        Beschikbaar wordt automatisch berekend na elke aanvraag.
        Nieuwe leveringen voeg je hier handmatig toe.

      </div>


      <div class="admin-catalog-switch">

        <button
          id="adminCatalogView-pos"
          class="active"
          type="button"
          onclick="setAdminCatalogView('pos')"
        >
          POS
        </button>

        <button
          id="adminCatalogView-beer"
          type="button"
          onclick="setAdminCatalogView('beer')"
        >
          Bieren
        </button>

        <button
          id="adminCatalogView-event"
          type="button"
          onclick="setAdminCatalogView('event')"
        >
          Evenement
        </button>

      </div>


      <div id="adminCatalogList"></div>

    </div>


    <!-- RAPPORTEN -->

    <div
      id="adminPane-reports"
      class="admin-pane hidden"
    >

      <div class="admin-page-title">

        <span>
          ARCHIEF & ANALYSE
        </span>

        <strong>
          Rapporten
        </strong>

      </div>


      <div class="admin-report-central-filters">

        <div class="admin-report-grid">

          <div>

            <label for="reportYear">
              Jaar
            </label>

            <select
              id="reportYear"
              onchange="renderCentralReports()"
            ></select>

          </div>


          <div>

            <label for="reportMonth">
              Maand
            </label>

            <select
              id="reportMonth"
              onchange="renderCentralReports()"
            >

              <option value="">
                Alle maanden
              </option>

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


        <label for="reportRepresentative">
          Vertegenwoordiger
        </label>

        <select
          id="reportRepresentative"
          onchange="renderCentralReports()"
        >

          <option value="">
            Alle vertegenwoordigers
          </option>

        </select>

      </div>


      <!-- GROOTHANDEL -->

      <details
        id="reportFolderWholesale"
        class="admin-report-folder"
        ontoggle="handleCentralReportFolder('wholesale', this.open)"
      >

        <summary>

          <div>

            <span>
              ARCHIEF
            </span>

            <strong>
              Bestellingen groothandel
            </strong>

          </div>

          <b id="centralWholesaleCount">
            0
          </b>

        </summary>


        <div class="admin-report-folder-body">

          <div id="centralWholesaleList">

            <div class="empty">
              Open deze map om het archief te bekijken.
            </div>

          </div>


          <button
            class="admin-export"
            type="button"
            onclick="exportCentralWholesaleExcel()"
          >
            Excel groothandel downloaden
          </button>

        </div>

      </details>


      <!-- GRATIS BIER -->

      <details
        id="reportFolderFreeBeer"
        class="admin-report-folder"
        ontoggle="handleCentralReportFolder('freebeer', this.open)"
      >

        <summary>

          <div>

            <span>
              ARCHIEF
            </span>

            <strong>
              Gratis bier factuur enkel leeggoed
            </strong>

          </div>

          <b id="centralFreeBeerCount">
            0
          </b>

        </summary>


        <div class="admin-report-folder-body">

          <div
            id="adminFreeBeerLoading"
            class="admin-freebeer-loading hidden"
          >
            Gratis bier laden...
          </div>


          <div class="admin-freebeer-kpis">

            <div>

              <span>
                Eenheden
              </span>

              <strong id="adminFreeBeerUnits">
                0
              </strong>

            </div>


            <div>

              <span>
                Registraties
              </span>

              <strong id="adminFreeBeerRegistrationsCount">
                0
              </strong>

            </div>


            <div>

              <span>
                Klanten
              </span>

              <strong id="adminFreeBeerCustomersCount">
                0
              </strong>

            </div>

          </div>


          <div class="admin-freebeer-filter-card">

            <label for="adminFreeBeerProvinceFilter">
              Provincie
            </label>

            <select
              id="adminFreeBeerProvinceFilter"
              onchange="renderAdminFreeBeer(); updateCentralReportCounts()"
            >

              <option value="">
                Alle provincies
              </option>

            </select>


            <label for="adminFreeBeerProductFilter">
              Product
            </label>

            <select
              id="adminFreeBeerProductFilter"
              onchange="renderAdminFreeBeer(); updateCentralReportCounts()"
            >

              <option value="">
                Alle producten
              </option>

            </select>


            <label for="adminFreeBeerSearch">
              Zoeken
            </label>

            <input
              id="adminFreeBeerSearch"
              type="text"
              placeholder="Horecaklant of drankenhandel..."
              oninput="renderAdminFreeBeer(); updateCentralReportCounts()"
            >

          </div>


          <div id="adminFreeBeerList">

            <div class="empty">
              Open deze map om registraties te laden.
            </div>

          </div>


          <button
            class="admin-export"
            type="button"
            onclick="exportAdminFreeBeerExcel()"
          >
            Excel gratis bier downloaden
          </button>

        </div>

      </details>


      <!-- POS / PROMO -->

      <details
        id="reportFolderPos"
        class="admin-report-folder"
        ontoggle="handleCentralReportFolder('pos', this.open)"
      >

        <summary>

          <div>

            <span>
              ARCHIEF
            </span>

            <strong>
              Afgehandelde aanvragen POS / promo
            </strong>

          </div>

          <b id="centralPosCount">
            0
          </b>

        </summary>


        <div class="admin-report-folder-body">

          <div id="centralPosArchiveList">

            <div class="empty">
              Open deze map om het archief te bekijken.
            </div>

          </div>


          <button
            class="admin-export"
            type="button"
            onclick="exportCentralPosExcel()"
          >
            Excel POS / promo downloaden
          </button>

        </div>

      </details>


      <!-- EVENEMENTEN -->

      <details
        id="reportFolderEvents"
        class="admin-report-folder"
        ontoggle="handleCentralReportFolder('events', this.open)"
      >

        <summary>

          <div>

            <span>
              ARCHIEF
            </span>

            <strong>
              Afgehandelde evenementen
            </strong>

          </div>

          <b id="centralEventsCount">
            0
          </b>

        </summary>


        <div class="admin-report-folder-body">

          <div id="centralEventArchiveList">

            <div class="empty">
              Open deze map om het archief te bekijken.
            </div>

          </div>


          <button
            class="admin-export"
            type="button"
            onclick="exportCentralEventsExcel()"
          >
            Excel evenementen downloaden
          </button>

        </div>

      </details>

    </div>


  `;


  appMain
    .appendChild(
      section
    );


  createAdminDetailScreen();

  createReturnProblemModal();

  createEventDeliveryProofModal();

}


/* ============================================================
   RETOUR PROBLEEM POPUP MAKEN
============================================================ */

function createReturnProblemModal() {

  if (
    document.getElementById(
      "returnProblemModal"
    )
  ) {

    return;

  }


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "returnProblemModal";


  modal.className =
    "return-problem-overlay hidden";


  modal.innerHTML = `

    <div
      class="return-problem-modal"
      onclick="event.stopPropagation()"
    >

      <div class="return-problem-modal-head">

        <div>

          <span>
            PROBLEEM MELDEN
          </span>

          <h3 id="returnProblemTitle">
            Materiaal
          </h3>

          <small id="returnProblemLoaned">
            0 stuks uitgeleend
          </small>

        </div>

        <button
          type="button"
          onclick="closeReturnProblemModal()"
        >
          ×
        </button>

      </div>


      <div class="return-problem-good-preview">

        <span>
          Goed terug
        </span>

        <strong id="returnProblemGood">
          0
        </strong>

      </div>


      <div class="return-problem-option">

        <div>

          <strong>
            Beschadigd
          </strong>

          <span>
            Terug, maar niet inzetbaar
          </span>

        </div>

        <div class="return-problem-stepper">

          <button
            type="button"
            onclick="changeReturnProblemDamaged(-1)"
          >
            −
          </button>

          <strong id="returnProblemDamaged">
            0
          </strong>

          <button
            type="button"
            onclick="changeReturnProblemDamaged(1)"
          >
            +
          </button>

        </div>

      </div>


      <div class="return-problem-option">

        <div>

          <strong>
            Niet terug
          </strong>

          <span>
            Materiaal ontbreekt
          </span>

        </div>

        <div class="return-problem-stepper">

          <button
            type="button"
            onclick="changeReturnProblemMissing(-1)"
          >
            −
          </button>

          <strong id="returnProblemMissing">
            0
          </strong>

          <button
            type="button"
            onclick="changeReturnProblemMissing(1)"
          >
            +
          </button>

        </div>

      </div>


      <label for="returnProblemNote">
        Opmerking
      </label>

      <textarea
        id="returnProblemNote"
        placeholder="Bijv. poot geplooid, doek gescheurd..."
      ></textarea>


      <div class="return-problem-actions">

        <button
          type="button"
          class="return-problem-cancel"
          onclick="closeReturnProblemModal()"
        >
          Annuleren
        </button>

        <button
          type="button"
          class="return-problem-save"
          onclick="saveReturnProblemModal()"
        >
          Probleem opslaan
        </button>

      </div>

    </div>

  `;


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeReturnProblemModal();

      }

    }
  );


  document.body.appendChild(
    modal
  );

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

/* ============================================================
   EVENT LEVERINGSBEWIJS MODAL
============================================================ */

function createEventDeliveryProofModal() {

  if (
    document.getElementById(
      "eventDeliveryProofModal"
    )
  ) {
    return;
  }

  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "eventDeliveryProofModal";

  modal.className =
    "return-problem-overlay hidden";

  modal.innerHTML = `

    <div
      class="event-delivery-modal"
      onclick="event.stopPropagation()"
    >

      <div class="return-problem-modal-head">

        <div>
          <span>UITLEENBEWIJS</span>
          <h3 id="eventDeliveryModalTitle">Evenement</h3>
          <small id="eventDeliveryModalPeriod"></small>
        </div>

        <button
          type="button"
          onclick="closeEventDeliveryProofModal()"
        >
          ×
        </button>

      </div>

      <div
        id="eventDeliveryItemsEditor"
        class="event-delivery-items"
      ></div>

      <label for="eventDeliverySignerName">
        Naam ontvanger
      </label>

      <input
        id="eventDeliverySignerName"
        type="text"
        placeholder="Naam klant / ontvanger"
      >

      <label>
        Handtekening
      </label>

      <div class="event-signature-box">
        <canvas id="eventDeliverySignatureCanvas"></canvas>
      </div>

      <button
        type="button"
        class="admin-secondary"
        onclick="clearEventDeliverySignature()"
      >
        Handtekening wissen
      </button>

      <div class="return-problem-actions">

        <button
          type="button"
          class="return-problem-cancel"
          onclick="closeEventDeliveryProofModal()"
        >
          Annuleren
        </button>

        <button
          type="button"
          class="return-problem-save"
          onclick="saveEventDeliveryProof()"
        >
          Ontvangst laten tekenen
        </button>

      </div>

    </div>

  `;

  modal.addEventListener(
    "click",
    event => {
      if (
        event.target === modal
      ) {
        closeEventDeliveryProofModal();
      }
    }
  );

  document.body.appendChild(
    modal
  );

}


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


    adminReportsLoaded =
      false;

    adminReportsLoading =
      null;

    adminWholesaleOrders =
      [];

    adminWholesaleItems =
      [];

    adminWholesaleProofs =
      [];

    adminEventDeliveryProofs =
      [];

    adminEventDeliveryProofChecked.clear();

    adminFreeBeerLoaded =
      false;

    adminFreeBeerRegistrations =
      [];


    await loadAdminDashboard();


    await switchAdminTab(
      "overview"
    );

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

async function switchAdminTab(
  tab
) {

  [
    "overview",
    "requests",
    "material",
    "stock",
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
    "requests"
  ) {

    setAdminRequestView(
      adminRequestView ||
      "regular"
    );

  }


  if (
    tab ===
    "stock"
  ) {

    setAdminCatalogView(
      adminCatalogView ||
      "pos"
    );

  }



  if (
    tab ===
    "reports"
  ) {

    await loadAdminReportsData();

    fillReportYears();

    renderCentralReports();

  }


  window.scrollTo({

    top:
      0,

    behavior:
      "smooth"

  });

}


function openAdminRequestView(
  view
) {

  adminRequestView =
    view;

  switchAdminTab(
    "requests"
  );

  setAdminRequestView(
    view
  );

}


function setAdminRequestView(
  view
) {

  adminRequestView =
    [
      "regular",
      "events",
      "archive"
    ]
      .includes(
        view
      )

      ? view

      : "regular";


  [
    "regular",
    "events",
    "archive"
  ]
    .forEach(
      name => {

        document
          .getElementById(
            `adminRequestPane-${name}`
          )
          ?.classList
          .toggle(
            "hidden",
            name !==
            adminRequestView
          );


        document
          .getElementById(
            `adminRequestView-${name}`
          )
          ?.classList
          .toggle(
            "active",
            name ===
            adminRequestView
          );

      }
    );


  renderAdminSections();

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

  const statusFilter =
    document.getElementById(
      "adminStatusFilter"
    );

  if (statusFilter) {
    statusFilter.value = "";
  }

  openAdminRequestView(
    "archive"
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

    const [
      profilesResult,
      ordersResult,
      itemsResult,
      returnsResult,
      productsResult,
      posAvailableStockResult
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
            event_delivery_mode,
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
          `),

        supabaseClient
          .from(
            "products"
          )
          .select(`
            id,
            naam,
            categorie,
            eenheid,
            actief,
            sort_order,
            voorraad,
            minimum_voorraad,
            voorraad_beheren,
            tijdelijk_onbeschikbaar,
            inhoud_per_eenheid
          `)
          .order(
            "categorie",
            {
              ascending:
                true
            }
          )
          .order(
            "sort_order",
            {
              ascending:
                true
            }
          ),

        supabaseClient
          .rpc(
            "get_pos_available_stock"
          )

      ]);


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


    adminProducts =
      productsResult.error

        ? []

        : (
            productsResult.data ||
            []
          );


    adminPosAvailableStock =
      {};


    if (
      !posAvailableStockResult.error
    ) {

      (
        posAvailableStockResult.data ||
        []
      )
        .forEach(
          row => {

            adminPosAvailableStock[
              String(
                row.product_id
              )
            ] = {

              totaal:
                Math.max(
                  0,
                  Number(
                    row.totale_voorraad ||
                    0
                  )
                ),

              gereserveerd:
                Math.max(
                  0,
                  Number(
                    row.gereserveerd ||
                    0
                  )
                ),

              beschikbaar:
                Math.max(
                  0,
                  Number(
                    row.beschikbaar ||
                    0
                  )
                ),

              minimum:
                row.minimum_voorraad ===
                null
                  ? null
                  : Number(
                      row.minimum_voorraad
                    ),

              tijdelijk_onbeschikbaar:
                row.tijdelijk_onbeschikbaar ===
                true

            };

          }
        );

    }

    else {

      console.warn(
        "BESCHIKBARE POS-VOORRAAD:",
        posAvailableStockResult.error
      );

    }


    if (
      productsResult.error
    ) {

      console.warn(
        "PRODUCTEN / VOORRAAD:",
        productsResult.error
      );

    }


    fillRepresentativeFilters();

    fillReportYears();

    setCurrentReportMonth();

    renderAdminStatistics();

    renderAdminSections();

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


/* ============================================================
   RAPPORTEN DATA - PAS LADEN WANNEER RAPPORTEN WORDT GEOPEND
============================================================ */

async function loadAdminReportsData(
  force = false
) {

  if (
    adminReportsLoaded
    &&
    !force
  ) {

    return;

  }


  if (
    adminReportsLoading
    &&
    !force
  ) {

    return adminReportsLoading;

  }


  adminReportsLoading =
    (async () => {

      const [
        wholesaleResult,
        wholesaleItemsResult,
        wholesaleProofsResult
      ] =
        await Promise.all([

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
            ),

          supabaseClient
            .from(
              "wholesale_order_proofs"
            )
            .select(`
              order_id,
              signer_name,
              signed_at,
              proof_hash
            `)

        ]);


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


      adminReportsLoaded =
        !wholesaleResult.error
        &&
        !wholesaleItemsResult.error
        &&
        !wholesaleProofsResult.error;


      fillReportYears();

    })();


  try {

    await adminReportsLoading;

  }

  finally {

    adminReportsLoading =
      null;

  }

}


/* ============================================================
   UITLEENBEWIJS - ALLEEN VOOR DE GEOPENDE EVENTAANVRAAG
============================================================ */

async function loadAdminEventDeliveryProofForOrder(
  orderId,
  force = false
) {

  if (
    !orderId
  ) {

    return;

  }


  if (
    adminEventDeliveryProofChecked.has(
      orderId
    )
    &&
    !force
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "event_delivery_proofs"
      )
      .select(`
        order_id,
        signer_name,
        signed_at,
        snapshot,
        signature_data,
        proof_hash,
        created_at
      `)
      .eq(
        "order_id",
        orderId
      )
      .maybeSingle();


  if (
    error
  ) {

    console.warn(
      "EVENT DELIVERY PROOF:",
      error
    );

    return;

  }


  adminEventDeliveryProofs =
    adminEventDeliveryProofs
      .filter(
        proof =>
          proof.order_id !==
          orderId
      );


  if (
    data
  ) {

    adminEventDeliveryProofs.push(
      data
    );

  }


  adminEventDeliveryProofChecked.add(
    orderId
  );

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
          "afgehaald" ||
          order.event_returned_at
        ) {

          return false;

        }


        return getEventMaterialItems(
          order.id
        ).length > 0;

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

  const matchingRegular =
    adminOrders
      .filter(
        order =>
          !order.event_naam &&
          !isArchivedOrder(order) &&
          order.status === status
      )
      .length;


  const matchingEvents =
    adminOrders
      .filter(
        order =>
          Boolean(order.event_naam) &&
          !isArchivedOrder(order) &&
          order.status === status
      )
      .length;


  adminRequestView =
    matchingRegular === 0 &&
    matchingEvents > 0
      ? "events"
      : "regular";


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


  setAdminRequestView(
    adminRequestView
  );

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


  const lowStock =
    getLowStockProducts()
      .length;


  let html =
    "";


  if (
    lowStock
  ) {

    html +=
      adminAttention(

        "orange",

        "!",

        `${lowStock} lage voorraad${lowStock === 1 ? "" : "en"}`,

        "POS-voorraad aanvullen",

        "switchAdminTab('stock'); setAdminCatalogView('pos')"

      );

  }


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


function getArchiveFilteredOrders() {

  const representative =
    document
      .getElementById(
        "adminRepFilter"
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
          representative &&
          order.user_id !== representative
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

        return [
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
          .toLowerCase()
          .includes(search);

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
          getEventMaterialItems(
            order.id
          ).length > 0
      );


  const archiveSource =
    getArchiveFilteredOrders();


  const archive =
    archiveSource
      .filter(
        order =>
          !order.event_naam
          &&
          isArchivedOrder(
            order
          )
      );


  const returnArchive =
    archiveSource
      .filter(
        order =>
          Boolean(order.event_naam)
          &&
          Boolean(order.event_returned_at)
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


  renderReturnArchiveList(
    returnArchive
  );



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
          Geen materiaal dat actie nodig heeft
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


          const damaged =
            Number(
              row.beschadigd ||
              0
            );


          const missing =
            Number(
              row.ontbreekt ||
              0
            );


          return `

            <div class="admin-problem action-needed">

              <div class="admin-problem-head">

                <div>

                  <strong>
                    ${adminEscapeHtml(row.product_naam)}
                  </strong>

                  <small>
                    ${adminEscapeHtml(order?.event_naam || "Onbekend evenement")}
                  </small>

                </div>

                <span>
                  Actie nodig
                </span>

              </div>


              <div class="admin-problem-badges">

                ${
                  damaged > 0
                    ? `<b>${damaged} beschadigd</b>`
                    : ""
                }

                ${
                  missing > 0
                    ? `<b>${missing} ontbreekt</b>`
                    : ""
                }

              </div>


              ${
                row.opmerking
                  ? `
                      <div class="admin-problem-note">
                        ${adminEscapeHtml(row.opmerking)}
                      </div>
                    `
                  : ""
              }


              <div class="admin-problem-actions">

                ${
                  damaged > 0
                    ? `
                        <button
                          type="button"
                          class="problem-resolve green"
                          onclick="resolveDamagedMaterial('${row.id}')"
                        >
                          Hersteld · terug beschikbaar
                        </button>
                      `
                    : ""
                }


                ${
                  missing > 0
                    ? `
                        <button
                          type="button"
                          class="problem-resolve gold"
                          onclick="resolveMissingMaterial('${row.id}')"
                        >
                          Alsnog terug · beschikbaar
                        </button>
                      `
                    : ""
                }


                ${
                  order
                    ? `
                        <button
                          type="button"
                          class="problem-view"
                          onclick="openAdminOrder('${order.id}')"
                        >
                          Retour bekijken
                        </button>
                      `
                    : ""
                }

              </div>

            </div>

          `;

        }
      )
      .join("");

}


async function resolveDamagedMaterial(
  returnRowId
) {

  const row =
    adminEventReturns
      .find(
        item =>
          item.id ===
          returnRowId
      );


  if (
    !row ||
    Number(row.beschadigd || 0) <= 0
  ) {

    return;

  }


  if (
    !confirm(
      `${row.product_naam}: beschadigd materiaal terug beschikbaar zetten?`
    )
  ) {

    return;

  }


  const repaired =
    Number(
      row.beschadigd ||
      0
    );


  const {
    error
  } =
    await supabaseClient
      .from(
        "event_material_returns"
      )
      .update({

        goed_terug:
          Number(row.goed_terug || 0) +
          repaired,

        beschadigd:
          0,

        updated_by:
          currentUser?.id ||
          null,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        returnRowId
      );


  if (
    error
  ) {

    alert(
      "Materiaal kon niet worden bijgewerkt.\n\n" +
      adminReadableError(error)
    );

    return;

  }


  await loadAdminDashboard();

  switchAdminTab(
    "material"
  );

}


async function resolveMissingMaterial(
  returnRowId
) {

  const row =
    adminEventReturns
      .find(
        item =>
          item.id ===
          returnRowId
      );


  if (
    !row ||
    Number(row.ontbreekt || 0) <= 0
  ) {

    return;

  }


  if (
    !confirm(
      `${row.product_naam}: ontbrekend materiaal als teruggekomen registreren?`
    )
  ) {

    return;

  }


  const returned =
    Number(
      row.ontbreekt ||
      0
    );


  const {
    error
  } =
    await supabaseClient
      .from(
        "event_material_returns"
      )
      .update({

        goed_terug:
          Number(row.goed_terug || 0) +
          returned,

        ontbreekt:
          0,

        updated_by:
          currentUser?.id ||
          null,

        updated_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        returnRowId
      );


  if (
    error
  ) {

    alert(
      "Materiaal kon niet worden bijgewerkt.\n\n" +
      adminReadableError(error)
    );

    return;

  }


  await loadAdminDashboard();

  switchAdminTab(
    "material"
  );

}


/* ============================================================
   VOORRAAD & CATALOGUSBEHEER
============================================================ */

function getAdminPosStockData(
  productId
) {

  return adminPosAvailableStock[
    String(
      productId
    )
  ] || null;

}


function getAdminAvailableStock(
  product
) {

  if (
    !product
  ) {

    return 0;

  }


  const category =
    normalizeAdminProductCategory(
      product.categorie
    );


  if (
    category ===
    "pos"
  ) {

    const stockData =
      getAdminPosStockData(
        product.id
      );


    if (
      stockData
    ) {

      return Math.max(
        0,
        Number(
          stockData.beschikbaar ||
          0
        )
      );

    }

  }


  return Math.max(
    0,
    Number(
      product.voorraad ||
      0
    )
  );

}


async function refreshAdminPosAvailableStock() {

  const {
    data,
    error
  } =
    await supabaseClient
      .rpc(
        "get_pos_available_stock"
      );


  if (
    error
  ) {

    throw error;

  }


  adminPosAvailableStock =
    {};


  (
    data ||
    []
  )
    .forEach(
      row => {

        adminPosAvailableStock[
          String(
            row.product_id
          )
        ] = {

          totaal:
            Math.max(
              0,
              Number(
                row.totale_voorraad ||
                0
              )
            ),

          gereserveerd:
            Math.max(
              0,
              Number(
                row.gereserveerd ||
                0
              )
            ),

          beschikbaar:
            Math.max(
              0,
              Number(
                row.beschikbaar ||
                0
              )
            ),

          minimum:
            row.minimum_voorraad ===
            null
              ? null
              : Number(
                  row.minimum_voorraad
                ),

          tijdelijk_onbeschikbaar:
            row.tijdelijk_onbeschikbaar ===
            true

        };

      }
    );

}


function normalizeAdminProductCategory(
  category
) {

  return String(
    category ||
    ""
  )
    .trim()
    .toLowerCase();

}


function getAdminCatalogProducts(
  view = adminCatalogView
) {

  return adminProducts
    .filter(
      product => {

        const category =
          normalizeAdminProductCategory(
            product.categorie
          );


        if (
          view ===
          "pos"
        ) {

          return category ===
            "pos";

        }


        if (
          view ===
          "beer"
        ) {

          return [
            "bier",
            "bieren"
          ]
            .includes(
              category
            );

        }


        if (
          view ===
          "event"
        ) {

          return isEventMaterialCategory(
            category
          );

        }


        return false;

      }
    )
    .sort(
      (
        first,
        second
      ) => {

        const firstOrder =
          Number(
            first.sort_order ||
            0
          );

        const secondOrder =
          Number(
            second.sort_order ||
            0
          );


        if (
          firstOrder !==
          secondOrder
        ) {

          return firstOrder -
            secondOrder;

        }


        return String(
          first.naam ||
          ""
        )
          .localeCompare(
            String(
              second.naam ||
              ""
            ),
            "nl"
          );

      }
    );

}


function getLowStockProducts() {

  return adminProducts
    .filter(
      product => {

        if (
          product.voorraad_beheren !==
          true
        ) {

          return false;

        }


        if (
          normalizeAdminProductCategory(
            product.categorie
          ) !==
          "pos"
        ) {

          return false;

        }


        if (
          product.minimum_voorraad ===
          null
          ||
          product.minimum_voorraad ===
          undefined
        ) {

          return false;

        }


        return getAdminAvailableStock(
          product
        ) <=
        Number(
          product.minimum_voorraad ||
          0
        );

      }
    );

}


function setAdminCatalogView(
  view
) {

  adminCatalogView =
    [
      "pos",
      "beer",
      "event"
    ]
      .includes(
        view
      )

      ? view

      : "pos";


  [
    "pos",
    "beer",
    "event"
  ]
    .forEach(
      name => {

        document
          .getElementById(
            `adminCatalogView-${name}`
          )
          ?.classList
          .toggle(
            "active",
            name ===
            adminCatalogView
          );

      }
    );


  renderAdminProductManagement();

}


function renderAdminProductManagement() {

  const container =
    document.getElementById(
      "adminCatalogList"
    );


  if (
    !container
  ) {

    return;

  }


  const products =
    getAdminCatalogProducts();


  if (
    !products.length
  ) {

    container.innerHTML = `

      <div class="admin-clear">
        <b>Geen producten in deze categorie</b>
      </div>

    `;

    return;

  }


  container.innerHTML =
    products
      .map(
        buildAdminProductManagementRow
      )
      .join("");

}


function buildAdminProductManagementRow(
  product
) {

  const managesStock =
    product.voorraad_beheren ===
    true;


  const category =
    normalizeAdminProductCategory(
      product.categorie
    );


  const physicalStock =
    managesStock

      ? Math.max(
          0,
          Number(
            product.voorraad ||
            0
          )
        )

      : null;


  const availableStock =
    managesStock

      ? getAdminAvailableStock(
          product
        )

      : null;


  const shownStock =
    category === "pos"
      ? availableStock
      : physicalStock;


  const minimum =
    product.minimum_voorraad ===
      null
      ||
      product.minimum_voorraad ===
      undefined

      ? null

      : Math.max(
          0,
          Number(
            product.minimum_voorraad ||
            0
          )
        );


  const unavailable =
    product.tijdelijk_onbeschikbaar ===
    true;


  const low =
    category === "pos"
    &&
    managesStock
    &&
    minimum !==
      null
    &&
    availableStock <=
      minimum;


  const unit =
    formatAdminProductUnit(
      product.eenheid,
      shownStock
    );


  const glassInfo =
    Number(
      product.inhoud_per_eenheid ||
      0
    ) > 0

      ? `${Number(product.inhoud_per_eenheid)} glazen per ${adminEscapeHtml(product.eenheid || "eenheid")}`

      : "";


  return `

    <div
      class="admin-catalog-item ${unavailable ? "unavailable" : ""} ${low ? "low" : ""}"
    >

      <div class="admin-catalog-head">

        <div>

          <strong>
            ${adminEscapeHtml(product.naam || "Product")}
          </strong>

          <small>
            ${
              managesStock

                ? (
                    unavailable

                      ? "Tijdelijk onbeschikbaar"

                      : `${shownStock}${unit ? ` ${adminEscapeHtml(unit)}` : ""} beschikbaar`
                  )

                : (
                    unavailable
                      ? "Tijdelijk onbeschikbaar"
                      : "Beschikbaar"
                  )
            }
          </small>

          ${
            glassInfo && !unavailable
              ? `
                  <small class="admin-catalog-sub">
                    ${glassInfo}
                  </small>
                `
              : ""
          }

        </div>


        <button
          type="button"
          class="admin-availability-toggle ${unavailable ? "off" : "on"}"
          onclick="toggleAdminProductAvailability('${product.id}')"
        >
          ${unavailable ? "Onbeschikbaar" : "Beschikbaar"}
        </button>

      </div>


      ${
        low && !unavailable

          ? `
              <div class="admin-stock-warning">
                Voorraad bijna op · nog ${availableStock}${unit ? ` ${adminEscapeHtml(formatAdminProductUnit(product.eenheid, availableStock))}` : ""}
              </div>
            `

          : ""
      }


      ${
        managesStock

          ? `

              <div class="admin-stock-control">

                <button
                  type="button"
                  aria-label="Voorraad verlagen"
                  onclick="changeAdminProductStock('${product.id}', -1)"
                >
                  −
                </button>

                <strong>
                  ${shownStock}
                </strong>

                <button
                  type="button"
                  aria-label="Voorraad verhogen"
                  onclick="changeAdminProductStock('${product.id}', 1)"
                >
                  +
                </button>

              </div>

            `

          : ""
      }

    </div>

  `;

}

function formatAdminProductUnit(
  unit,
  amount
) {

  const clean =
    String(
      unit ||
      ""
    )
      .trim();


  if (
    !clean
  ) {

    return "";

  }


  if (
    clean.toLowerCase() ===
    "doos"
  ) {

    return Number(amount) === 1
      ? "doos"
      : "dozen";

  }


  return clean;

}


async function changeAdminProductStock(
  productId,
  amount
) {

  const product =
    adminProducts
      .find(
        item =>
          String(item.id) ===
          String(productId)
      );


  if (
    !product
    ||
    product.voorraad_beheren !==
      true
  ) {

    return;

  }


  const current =
    Math.max(
      0,
      Number(
        product.voorraad ||
        0
      )
    );


  const next =
    Math.max(
      0,
      current +
      Number(
        amount ||
        0
      )
    );


  if (
    next ===
    current
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "products"
      )
      .update({
        voorraad:
          next
      })
      .eq(
        "id",
        product.id
      )
      .select(`
        id,
        naam,
        categorie,
        eenheid,
        actief,
        sort_order,
        voorraad,
        minimum_voorraad,
        voorraad_beheren,
        tijdelijk_onbeschikbaar,
        inhoud_per_eenheid
      `)
      .single();


  if (
    error
  ) {

    alert(
      "Voorraad kon niet worden aangepast.\n\n" +
      adminReadableError(error)
    );

    return;

  }


  updateLocalAdminProduct(
    data
  );


  try {

    await refreshAdminPosAvailableStock();

  }

  catch (
    refreshError
  ) {

    console.warn(
      "Voorraad werd aangepast, maar beschikbaar aantal kon niet opnieuw worden berekend:",
      refreshError
    );

  }


  renderAdminProductManagement();

  renderAdminAttentionPanel();

}


async function toggleAdminProductAvailability(
  productId
) {

  const product =
    adminProducts
      .find(
        item =>
          String(item.id) ===
          String(productId)
      );


  if (
    !product
  ) {

    return;

  }


  const next =
    product.tijdelijk_onbeschikbaar !==
    true;


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "products"
      )
      .update({
        tijdelijk_onbeschikbaar:
          next
      })
      .eq(
        "id",
        product.id
      )
      .select(`
        id,
        naam,
        categorie,
        eenheid,
        actief,
        sort_order,
        voorraad,
        minimum_voorraad,
        voorraad_beheren,
        tijdelijk_onbeschikbaar,
        inhoud_per_eenheid
      `)
      .single();


  if (
    error
  ) {

    alert(
      "Beschikbaarheid kon niet worden aangepast.\n\n" +
      adminReadableError(error)
    );

    return;

  }


  updateLocalAdminProduct(
    data
  );


  try {

    await refreshAdminPosAvailableStock();

  }

  catch (
    refreshError
  ) {

    console.warn(
      "Beschikbaarheidsstatus werd aangepast, maar voorraad kon niet opnieuw worden berekend:",
      refreshError
    );

  }


  renderAdminProductManagement();

  renderAdminAttentionPanel();

}


function updateLocalAdminProduct(
  updated
) {

  const index =
    adminProducts
      .findIndex(
        product =>
          String(product.id) ===
          String(updated.id)
      );


  if (
    index ===
    -1
  ) {

    adminProducts.push(
      updated
    );

    return;

  }


  adminProducts[
    index
  ] =
    updated;

}


/* ===============================
   RETOURARCHIEF
================================ */

function renderReturnArchiveList(
  orders
) {

  const container =
    document.getElementById(
      "adminReturnArchiveList"
    );

  if (!container) {
    return;
  }

  if (!orders.length) {

    container.innerHTML = `
      <div class="admin-clear">
        <b>Geen afgehandelde retouren</b>
      </div>
    `;

    return;
  }

  container.innerHTML =
    orders
      .map(
        order => {

          const profile =
            getAdminProfile(
              order.user_id
            );

          const problemCount =
            getEventReturnsForOrder(
              order.id
            )
              .reduce(
                (total, row) =>
                  total +
                  Number(row.beschadigd || 0) +
                  Number(row.ontbreekt || 0),
                0
              );

          return `
            <button
              type="button"
              class="admin-order-card"
              onclick="openAdminOrder('${order.id}')"
            >
              <div>
                <span>RETOUR</span>

                <em class="status status-klaar">
                  Afgehandeld
                </em>
              </div>

              <strong>
                ${adminEscapeHtml(
                  order.event_naam ||
                  "Evenement"
                )}
              </strong>

              <small>
                ${adminEscapeHtml(
                  profile?.naam ||
                  "Onbekend"
                )}
                ·
                ${adminFormatDateTime(
                  order.event_returned_at
                )}
                ${
                  problemCount > 0
                    ? ` · ${problemCount} actie nodig`
                    : " · volledig in orde"
                }
              </small>
            </button>
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
          event_delivery_mode,
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


  if (
    order.event_naam
    &&
    order.event_delivery_mode ===
    "enkel_levering"
  ) {

    await loadAdminEventDeliveryProofForOrder(
      order.id
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

            +

            detailRow(
              "Uitvoering",
              order.event_delivery_mode ===
              "enkel_levering"
                ? "Enkel levering / uitleen"
                : "Achel aanwezig"
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


    ${buildEventDeliveryProofCard(
      order
    )}


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
   EVENT LEVERINGSBEWIJS
============================================================ */

let activeEventDeliveryOrderId =
  null;

let eventDeliverySignatureActive =
  false;

let eventDeliverySignatureContext =
  null;


function getEventDeliveryProof(
  orderId
) {

  return adminEventDeliveryProofs
    .find(
      proof =>
        proof.order_id === orderId
    ) ||
    null;

}


function buildEventDeliveryProofCard(
  order
) {

  if (
    !order?.event_naam
    ||
    order.event_delivery_mode !==
    "enkel_levering"
  ) {
    return "";
  }

  const proof =
    getEventDeliveryProof(
      order.id
    );

  if (
    proof
  ) {
    return `

      <div class="card">

        <div class="admin-detail-top">

          <div>
            <small>UITLEENBEWIJS</small>
            <h3>Levering ondertekend</h3>
          </div>

          <span class="status status-klaar">
            Ondertekend
          </span>

        </div>

        ${detailRow(
          "Ontvangen door",
          proof.signer_name || ""
        )}

        ${detailRow(
          "Ondertekend op",
          adminFormatDateTime(
            proof.signed_at
          )
        )}

        <button
          type="button"
          class="admin-primary"
          onclick="downloadEventDeliveryProofPdf('${order.id}')"
        >
          PDF uitleenbewijs downloaden
        </button>

      </div>

    `;
  }

  return `

    <div class="card">

      <h3>Uitleenbewijs</h3>

      <div class="info">
        Deze aanvraag is ingesteld op enkel levering.
        Laat de klant bij aflevering digitaal tekenen voor de ontvangen artikelen.
      </div>

      <button
        type="button"
        class="admin-primary"
        onclick="openEventDeliveryProofModal('${order.id}')"
        style="margin-top:10px;"
      >
        Leveringsdocument openen
      </button>

    </div>

  `;

}


function openEventDeliveryProofModal(
  orderId
) {

  const order =
    adminOrders.find(
      item =>
        item.id === orderId
    );

  if (
    !order
  ) {
    return;
  }

  const proof =
    getEventDeliveryProof(
      orderId
    );

  if (
    proof
  ) {
    downloadEventDeliveryProofPdf(
      orderId
    );
    return;
  }

  activeEventDeliveryOrderId =
    orderId;

  const items =
    getAdminOrderItems(
      orderId
    )
      .filter(
        item =>
          item.categorie === "bier"
          ||
          isEventMaterialCategory(
            item.categorie
          )
      );

  document
    .getElementById(
      "eventDeliveryModalTitle"
    )
    .textContent =
      order.event_naam ||
      "Evenement";

  document
    .getElementById(
      "eventDeliveryModalPeriod"
    )
    .textContent =
      `${order.event_vanaf || ""} t/m ${order.event_tot || ""}`;

  document
    .getElementById(
      "eventDeliverySignerName"
    )
    .value =
      "";

  document
    .getElementById(
      "eventDeliveryItemsEditor"
    )
    .innerHTML =
      items
        .map(
          item => `

            <div class="event-delivery-item">

              <strong>
                ${Number(item.aantal || 0)} × ${adminEscapeHtml(item.product_naam || "")}
              </strong>

              <small>
                ${
                  item.categorie === "bier"
                    ? "Bier"
                    : "Evenementmateriaal"
                }
              </small>

              <label>
                Staat bij levering
              </label>

              <input
                type="text"
                class="event-delivery-state"
                data-product="${adminEscapeHtml(item.product_naam || "")}"
                data-category="${adminEscapeHtml(item.categorie || "")}"
                data-amount="${Number(item.aantal || 0)}"
                value="Goed"
              >

            </div>

          `
        )
        .join("");

  document
    .getElementById(
      "eventDeliveryProofModal"
    )
    .classList
    .remove(
      "hidden"
    );

  document.body.style.overflow =
    "hidden";

  requestAnimationFrame(
    () => {
      prepareEventDeliverySignatureCanvas();
    }
  );

}


function closeEventDeliveryProofModal() {

  document
    .getElementById(
      "eventDeliveryProofModal"
    )
    ?.classList
    .add(
      "hidden"
    );

  document.body.style.overflow =
    "";

  activeEventDeliveryOrderId =
    null;

}


function prepareEventDeliverySignatureCanvas() {

  const canvas =
    document.getElementById(
      "eventDeliverySignatureCanvas"
    );

  if (
    !canvas
  ) {
    return;
  }

  const ratio =
    Math.max(
      1,
      window.devicePixelRatio || 1
    );

  const width =
    canvas.clientWidth || 300;

  const height =
    150;

  canvas.width =
    width * ratio;

  canvas.height =
    height * ratio;

  canvas.style.height =
    `${height}px`;

  const context =
    canvas.getContext(
      "2d"
    );

  context.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  context.lineWidth = 2;
  context.lineCap = "round";
  context.strokeStyle = "#182019";

  eventDeliverySignatureContext =
    context;

  eventDeliverySignatureActive =
    false;

  let drawing =
    false;

  const point =
    event => {
      const rect =
        canvas.getBoundingClientRect();

      return {
        x:
          event.clientX -
          rect.left,
        y:
          event.clientY -
          rect.top
      };
    };

  canvas.onpointerdown =
    event => {
      event.preventDefault();
      drawing = true;

      const p =
        point(
          event
        );

      context.beginPath();
      context.moveTo(
        p.x,
        p.y
      );

      canvas.setPointerCapture?.(
        event.pointerId
      );
    };

  canvas.onpointermove =
    event => {
      if (
        !drawing
      ) {
        return;
      }

      event.preventDefault();

      const p =
        point(
          event
        );

      context.lineTo(
        p.x,
        p.y
      );

      context.stroke();

      eventDeliverySignatureActive =
        true;
    };

  canvas.onpointerup =
    () => {
      drawing = false;
    };

  canvas.onpointercancel =
    () => {
      drawing = false;
    };

}


function clearEventDeliverySignature() {

  const canvas =
    document.getElementById(
      "eventDeliverySignatureCanvas"
    );

  if (
    !canvas ||
    !eventDeliverySignatureContext
  ) {
    return;
  }

  eventDeliverySignatureContext.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  eventDeliverySignatureActive =
    false;

}


async function createEventDeliveryHash(
  value
) {

  const encoded =
    new TextEncoder()
      .encode(
        value
      );

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      encoded
    );

  return Array
    .from(
      new Uint8Array(
        hash
      )
    )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");

}


async function saveEventDeliveryProof() {

  const orderId =
    activeEventDeliveryOrderId;

  const order =
    adminOrders.find(
      item =>
        item.id === orderId
    );

  if (
    !order
  ) {
    return;
  }

  const signerName =
    document
      .getElementById(
        "eventDeliverySignerName"
      )
      .value
      .trim();

  if (
    !signerName
  ) {
    alert(
      "Vul de naam van de ontvanger in."
    );
    return;
  }

  if (
    !eventDeliverySignatureActive
  ) {
    alert(
      "Laat de klant eerst tekenen."
    );
    return;
  }

  const canvas =
    document.getElementById(
      "eventDeliverySignatureCanvas"
    );

  const signatureData =
    canvas.toDataURL(
      "image/png"
    );

  const items =
    Array
      .from(
        document.querySelectorAll(
          ".event-delivery-state"
        )
      )
      .map(
        input => ({
          product_naam:
            input.dataset.product || "",
          categorie:
            input.dataset.category || "",
          aantal:
            Number(
              input.dataset.amount || 0
            ),
          staat:
            input.value.trim() || "Goed"
        })
      );

  const profile =
    getAdminProfile(
      order.user_id
    );

  const snapshot = {
    order_id:
      order.id,
    aanvraag:
      createOrderReference(
        order.id,
        order.created_at
      ),
    evenement:
      order.event_naam || "",
    periode_vanaf:
      order.event_vanaf || "",
    periode_tot:
      order.event_tot || "",
    vertegenwoordiger:
      profile?.naam || "",
    vertegenwoordiger_email:
      profile?.email || "",
    opmerking:
      order.opmerking || "",
    items:
      items
  };

  const signedAt =
    new Date().toISOString();

  const proofHash =
    await createEventDeliveryHash(
      JSON.stringify({
        snapshot,
        signerName,
        signedAt,
        signatureData
      })
    );

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "event_delivery_proofs"
      )
      .insert({
        order_id:
          order.id,
        signer_name:
          signerName,
        signed_at:
          signedAt,
        snapshot:
          snapshot,
        signature_data:
          signatureData,
        proof_hash:
          proofHash,
        created_by:
          currentUser?.id || null
      })
      .select(`
        order_id,
        signer_name,
        signed_at,
        snapshot,
        signature_data,
        proof_hash,
        created_at
      `)
      .single();

  if (
    error
  ) {
    alert(
      "Uitleenbewijs kon niet worden opgeslagen.\n\n" +
      adminReadableError(
        error
      )
    );
    return;
  }

  adminEventDeliveryProofs =
    adminEventDeliveryProofs.filter(
      proof =>
        proof.order_id !== order.id
    );

  adminEventDeliveryProofs.push(
    data
  );

  adminEventDeliveryProofChecked.add(
    order.id
  );

  closeEventDeliveryProofModal();

  renderAdminDetail(
    order
  );

}


function downloadEventDeliveryProofPdf(
  orderId
) {

  const proof =
    getEventDeliveryProof(
      orderId
    );

  if (
    !proof
  ) {
    alert(
      "Geen ondertekend uitleenbewijs gevonden."
    );
    return;
  }

  if (
    !window.jspdf?.jsPDF
  ) {
    alert(
      "PDF-module is niet geladen."
    );
    return;
  }

  const {
    jsPDF
  } =
    window.jspdf;

  const pdf =
    new jsPDF({
      unit:
        "mm",
      format:
        "a4"
    });

  const snapshot =
    proof.snapshot || {};

  let y = 18;

  pdf.setFontSize(18);
  pdf.text(
    "Achelse Kluis - Uitleenbewijs evenement",
    15,
    y
  );

  y += 12;
  pdf.setFontSize(10);

  const addLine =
    (
      label,
      value
    ) => {
      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        `${label}:`,
        15,
        y
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.text(
        String(value || "-"),
        55,
        y
      );

      y += 6;
    };

  addLine(
    "Aanvraag",
    snapshot.aanvraag
  );

  addLine(
    "Evenement",
    snapshot.evenement
  );

  addLine(
    "Periode",
    `${snapshot.periode_vanaf || ""} t/m ${snapshot.periode_tot || ""}`
  );

  addLine(
    "Vertegenwoordiger",
    snapshot.vertegenwoordiger
  );

  addLine(
    "Ontvangen door",
    proof.signer_name
  );

  addLine(
    "Ondertekend op",
    adminFormatDateTime(
      proof.signed_at
    )
  );

  y += 5;

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.text(
    "Geleverde artikelen",
    15,
    y
  );

  y += 7;

  pdf.setFont(
    "helvetica",
    "normal"
  );

  (snapshot.items || [])
    .forEach(
      item => {

        const line =
          `${Number(item.aantal || 0)} x ${item.product_naam || ""} - staat: ${item.staat || "Goed"}`;

        const lines =
          pdf.splitTextToSize(
            line,
            175
          );

        pdf.text(
          lines,
          15,
          y
        );

        y +=
          lines.length * 5;

        if (
          y > 245
        ) {
          pdf.addPage();
          y = 18;
        }

      }
    );

  if (
    snapshot.opmerking
  ) {
    y += 5;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      "Opmerking",
      15,
      y
    );

    y += 6;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.text(
      pdf.splitTextToSize(
        snapshot.opmerking,
        175
      ),
      15,
      y
    );
  }

  if (
    proof.signature_data
  ) {
    y += 15;

    if (
      y > 235
    ) {
      pdf.addPage();
      y = 18;
    }

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      "Handtekening ontvanger",
      15,
      y
    );

    y += 5;

    pdf.addImage(
      proof.signature_data,
      "PNG",
      15,
      y,
      70,
      28
    );
  }

  pdf.setFontSize(7);

  pdf.text(
    `Bewijshash: ${proof.proof_hash || "-"}`,
    15,
    287
  );

  pdf.save(
    `Achel_uitleenbewijs_${safeFilename(snapshot.evenement || orderId)}.pdf`
  );

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
    order.event_returned_at
  ) {

    return buildArchivedReturnSummary(
      order
    );

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

          Retourregistratie wordt beschikbaar
          zodra het materiaal als afgehaald staat.

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

          Er zijn geen evenementmaterialen
          gekoppeld aan deze aanvraag.

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


  const totalProcessed =
    materials.reduce(
      (
        total,
        item
      ) =>

        total +
        item.goed_terug +
        item.beschadigd +
        item.ontbreekt,

      0
    );


  return `

    <div class="return-simple-workspace">

      <div class="return-simple-header">

        <div>

          <span>
            LOGISTIEK
          </span>

          <h2>
            Retour verwerken
          </h2>

        </div>

      </div>


      <div class="return-simple-summary">

        <div>

          <span>
            Uitgeleend
          </span>

          <strong>
            ${totalLoaned}
          </strong>

        </div>


        <div>

          <span>
            Verwerkt
          </span>

          <strong id="returnSimpleProcessed">
            ${totalProcessed}
          </strong>

        </div>

      </div>


      <div class="return-simple-list">

        ${
          materials
            .map(
              item =>
                buildSimpleReturnItem(
                  order,
                  item
                )
            )
            .join("")
        }

      </div>


      <div
        id="returnValidationMessage"
        class="return-validation hidden"
      ></div>


      <div class="return-simple-footer">

        <button
          type="button"
          class="return-simple-cancel"
          onclick="backToAdminDashboard()"
        >
          Annuleren
        </button>


        <button
          type="button"
          class="return-simple-save"
          onclick="saveEventReturnRegistration('${order.id}')"
        >
          Retour verwerken
        </button>

      </div>

    </div>

  `;

}


function buildArchivedReturnSummary(
  order
) {

  const materials =
    getEventMaterialStatus(
      order.id
    );


  return `

    <div class="return-archive-card">

      <div class="return-archive-head">

        <div>

          <span>
            RETOURARCHIEF
          </span>

          <h3>
            Retour afgehandeld
          </h3>

          <small>
            ${adminFormatDateTime(order.event_returned_at)}
          </small>

        </div>

        <div class="return-archive-lock">
          🔒
        </div>

      </div>


      <div class="return-archive-list">

        ${
          materials
            .map(
              item => `

                <div class="return-archive-row">

                  <div>

                    <strong>
                      ${adminEscapeHtml(item.product_naam)}
                    </strong>

                    <small>
                      ${item.uitgeleend} ${item.uitgeleend === 1 ? "stuk" : "stuks"}
                    </small>

                  </div>

                  <div class="return-archive-values">

                    <span class="ok">
                      ${item.goed_terug} goed
                    </span>

                    ${
                      item.beschadigd
                        ? `<span class="bad">${item.beschadigd} beschadigd</span>`
                        : ""
                    }

                    ${
                      item.ontbreekt
                        ? `<span class="bad">${item.ontbreekt} ontbreekt</span>`
                        : ""
                    }

                  </div>

                </div>

              `
            )
            .join("")
        }

      </div>


      <div class="return-archive-note">
        Deze retour is vergrendeld. Alleen via “Retour heropenen” kan de registratie opnieuw worden aangepast.
      </div>


      <button
        type="button"
        class="return-reopen-button"
        onclick="reopenEventReturn('${order.id}')"
      >
        Retour heropenen
      </button>

    </div>

  `;

}


/* ============================================================
   EENVOUDIG RETOURARTIKEL
============================================================ */

function buildSimpleReturnItem(
  order,
  item
) {

  const processed =
    item.goed_terug +
    item.beschadigd +
    item.ontbreekt;


  const isFullyProcessed =
    processed ===
    item.uitgeleend;


  const hasProblem =
    item.beschadigd > 0
    ||
    item.ontbreekt > 0;


  let statusText =
    "Nog te verwerken";


  let statusClass =
    "pending";


  if (
    isFullyProcessed &&
    !hasProblem
  ) {

    statusText =
      "Goed";

    statusClass =
      "good";

  }


  if (
    hasProblem
  ) {

    statusText =
      [
        item.beschadigd > 0
          ? `${item.beschadigd} beschadigd`
          : "",

        item.ontbreekt > 0
          ? `${item.ontbreekt} ontbreekt`
          : ""
      ]
        .filter(
          Boolean
        )
        .join(
          " · "
        );


    statusClass =
      "problem";

  }


  return `

    <div
      class="return-simple-item ${statusClass}"
      id="${returnDomId(
        order.id,
        item.product_naam,
        "row"
      )}"
    >

      <div class="return-simple-item-main">

        <div>

          <strong>
            ${adminEscapeHtml(item.product_naam)}
          </strong>

          <span>
            ${item.uitgeleend}
            ${item.uitgeleend === 1 ? "stuk" : "stuks"}
          </span>

        </div>


        <div
          id="${returnDomId(
            order.id,
            item.product_naam,
            "simpleStatus"
          )}"
          class="return-simple-status ${statusClass}"
        >
          ${adminEscapeHtml(statusText)}
        </div>

      </div>


      <span
        id="${returnDomId(
          order.id,
          item.product_naam,
          "good"
        )}"
        class="hidden"
      >${item.goed_terug}</span>


      <span
        id="${returnDomId(
          order.id,
          item.product_naam,
          "damaged"
        )}"
        class="hidden"
      >${item.beschadigd}</span>


      <span
        id="${returnDomId(
          order.id,
          item.product_naam,
          "missing"
        )}"
        class="hidden"
      >${item.ontbreekt}</span>


      <textarea
        id="${returnDomId(
          order.id,
          item.product_naam,
          "note"
        )}"
        class="hidden"
      >${adminEscapeHtml(item.opmerking)}</textarea>


      <div class="return-simple-actions">

        <button
          type="button"
          id="${returnDomId(
            order.id,
            item.product_naam,
            "goodToggle"
          )}"
          class="return-good-toggle ${
            isFullyProcessed &&
            !hasProblem
              ? "selected"
              : ""
          }"
          onclick="markSingleReturnItemGood(
            '${order.id}',
            '${escapeReturnJsString(item.product_naam)}'
          )"
          aria-label="Alles goed terug"
          title="Alles goed terug"
        >
          ${
            isFullyProcessed &&
            !hasProblem
              ? "✓"
              : ""
          }
        </button>


        <button
          type="button"
          id="${returnDomId(
            order.id,
            item.product_naam,
            "problemButton"
          )}"
          class="return-problem-button ${hasProblem ? "selected" : ""}"
          onclick="openReturnProblemModal(
            '${order.id}',
            '${escapeReturnJsString(item.product_naam)}'
          )"
        >
          Probleem melden
        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   1 ARTIKEL VOLLEDIG GOED TERUG
============================================================ */

function markSingleReturnItemGood(
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


  setReturnScreenValue(
    orderId,
    productName,
    "good",
    Number(
      item.aantal ||
      0
    )
  );


  setReturnScreenValue(
    orderId,
    productName,
    "damaged",
    0
  );


  setReturnScreenValue(
    orderId,
    productName,
    "missing",
    0
  );


  const note =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "note"
      )
    );


  if (
    note
  ) {

    note.value =
      "";

  }


  updateSimpleReturnItemStatus(
    orderId,
    productName
  );


  updateSimpleReturnProcessedTotal(
    orderId
  );

}


/* ============================================================
   STATUS VAN 1 RETOURARTIKEL BIJWERKEN
============================================================ */

function updateSimpleReturnItemStatus(
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


  const processed =
    good +
    damaged +
    missing;


  const fullyProcessed =
    processed ===
    Number(
      item.aantal ||
      0
    );


  const hasProblem =
    damaged > 0
    ||
    missing > 0;


  const statusElement =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "simpleStatus"
      )
    );


  const rowElement =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "row"
      )
    );


  const goodToggle =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "goodToggle"
      )
    );


  const problemButton =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "problemButton"
      )
    );


  if (
    !statusElement ||
    !rowElement
  ) {

    return;

  }


  statusElement.className =
    "return-simple-status";


  rowElement.classList.remove(
    "pending",
    "good",
    "problem"
  );


  if (
    fullyProcessed &&
    !hasProblem
  ) {

    statusElement.classList.add(
      "good"
    );

    statusElement.textContent =
      "Goed";

    rowElement.classList.add(
      "good"
    );


    if (
      goodToggle
    ) {

      goodToggle.classList.add(
        "selected"
      );

      goodToggle.textContent =
        "✓";

    }


    if (
      problemButton
    ) {

      problemButton.classList.remove(
        "selected"
      );

    }


    return;

  }


  if (
    hasProblem
  ) {

    statusElement.classList.add(
      "problem"
    );


    const parts =
      [];


    if (
      damaged > 0
    ) {

      parts.push(
        `${damaged} beschadigd`
      );

    }


    if (
      missing > 0
    ) {

      parts.push(
        `${missing} ontbreekt`
      );

    }


    statusElement.textContent =
      parts.join(
        " · "
      );

    rowElement.classList.add(
      "problem"
    );


    if (
      goodToggle
    ) {

      goodToggle.classList.remove(
        "selected"
      );

      goodToggle.textContent =
        "";

    }


    if (
      problemButton
    ) {

      problemButton.classList.add(
        "selected"
      );

    }


    return;

  }


  statusElement.classList.add(
    "pending"
  );

  statusElement.textContent =
    "Nog te verwerken";

  rowElement.classList.add(
    "pending"
  );


  if (
    goodToggle
  ) {

    goodToggle.classList.remove(
      "selected"
    );

    goodToggle.textContent =
      "";

  }


  if (
    problemButton
  ) {

    problemButton.classList.remove(
      "selected"
    );

  }

}


/* ============================================================
   BOVENAAN VERWERKT TOTAAL BIJWERKEN
============================================================ */

function updateSimpleReturnProcessedTotal(
  orderId
) {

  let processed =
    0;


  getEventMaterialItems(
    orderId
  )
    .forEach(
      item => {

        processed +=

          getReturnScreenValue(
            orderId,
            item.product_naam,
            "good"
          )

          +

          getReturnScreenValue(
            orderId,
            item.product_naam,
            "damaged"
          )

          +

          getReturnScreenValue(
            orderId,
            item.product_naam,
            "missing"
          );

      }
    );


  const element =
    document.getElementById(
      "returnSimpleProcessed"
    );


  if (
    element
  ) {

    element.textContent =
      processed;

  }

}


/* ============================================================
   PROBLEEM POPUP OPENEN
============================================================ */

function openReturnProblemModal(
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


  const modal =
    document.getElementById(
      "returnProblemModal"
    );


  if (
    !modal
  ) {

    alert(
      "Probleemvenster is nog niet geladen."
    );

    return;

  }


  modal.dataset.orderId =
    orderId;


  modal.dataset.productName =
    productName;


  document.getElementById(
    "returnProblemTitle"
  ).textContent =
    productName;


  document.getElementById(
    "returnProblemLoaned"
  ).textContent =
    `${item.aantal} ${
      Number(
        item.aantal
      ) === 1
        ? "stuk uitgeleend"
        : "stuks uitgeleend"
    }`;


  document.getElementById(
    "returnProblemDamaged"
  ).textContent =
    getReturnScreenValue(
      orderId,
      productName,
      "damaged"
    );


  document.getElementById(
    "returnProblemMissing"
  ).textContent =
    getReturnScreenValue(
      orderId,
      productName,
      "missing"
    );


  const note =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "note"
      )
    );


  document.getElementById(
    "returnProblemNote"
  ).value =
    note?.value ||
    "";


  updateReturnProblemGoodPreview();


  modal.classList.remove(
    "hidden"
  );


  document.body.style.overflow =
    "hidden";

}


/* ============================================================
   PROBLEEM POPUP SLUITEN
============================================================ */

function closeReturnProblemModal() {

  const modal =
    document.getElementById(
      "returnProblemModal"
    );


  if (
    !modal
  ) {

    return;

  }


  modal.classList.add(
    "hidden"
  );


  document.body.style.overflow =
    "";

}


/* ============================================================
   BESCHADIGD +/- IN POPUP
============================================================ */

function changeReturnProblemDamaged(
  amount
) {

  changeReturnProblemValue(
    "returnProblemDamaged",
    amount
  );

}


/* ============================================================
   ONTBREKEND +/- IN POPUP
============================================================ */

function changeReturnProblemMissing(
  amount
) {

  changeReturnProblemValue(
    "returnProblemMissing",
    amount
  );

}


/* ============================================================
   POPUP WAARDE VERANDEREN
============================================================ */

function changeReturnProblemValue(
  elementId,
  amount
) {

  const modal =
    document.getElementById(
      "returnProblemModal"
    );


  if (
    !modal
  ) {

    return;

  }


  const orderId =
    modal.dataset.orderId;


  const productName =
    modal.dataset.productName;


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


  const damagedElement =
    document.getElementById(
      "returnProblemDamaged"
    );


  const missingElement =
    document.getElementById(
      "returnProblemMissing"
    );


  let damaged =
    Number(
      damagedElement.textContent ||
      0
    );


  let missing =
    Number(
      missingElement.textContent ||
      0
    );


  if (
    elementId ===
    "returnProblemDamaged"
  ) {

    damaged =
      Math.max(
        0,
        damaged +
        amount
      );

  }


  if (
    elementId ===
    "returnProblemMissing"
  ) {

    missing =
      Math.max(
        0,
        missing +
        amount
      );

  }


  const total =
    Number(
      item.aantal ||
      0
    );


  if (
    damaged +
    missing >
    total
  ) {

    return;

  }


  damagedElement.textContent =
    damaged;


  missingElement.textContent =
    missing;


  updateReturnProblemGoodPreview();

}


/* ============================================================
   GOED TERUG AUTOMATISCH TONEN
============================================================ */

function updateReturnProblemGoodPreview() {

  const modal =
    document.getElementById(
      "returnProblemModal"
    );


  if (
    !modal
  ) {

    return;

  }


  const orderId =
    modal.dataset.orderId;


  const productName =
    modal.dataset.productName;


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


  const damaged =
    Number(
      document
        .getElementById(
          "returnProblemDamaged"
        )
        .textContent ||
      0
    );


  const missing =
    Number(
      document
        .getElementById(
          "returnProblemMissing"
        )
        .textContent ||
      0
    );


  const good =
    Math.max(
      0,
      Number(
        item.aantal ||
        0
      )
      -
      damaged
      -
      missing
    );


  document
    .getElementById(
      "returnProblemGood"
    )
    .textContent =
      good;

}


/* ============================================================
   PROBLEEM OPSLAAN IN HET RETOURFORMULIER
============================================================ */

function saveReturnProblemModal() {

  const modal =
    document.getElementById(
      "returnProblemModal"
    );


  if (
    !modal
  ) {

    return;

  }


  const orderId =
    modal.dataset.orderId;


  const productName =
    modal.dataset.productName;


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


  const damaged =
    Number(
      document
        .getElementById(
          "returnProblemDamaged"
        )
        .textContent ||
      0
    );


  const missing =
    Number(
      document
        .getElementById(
          "returnProblemMissing"
        )
        .textContent ||
      0
    );


  const good =
    Math.max(
      0,
      Number(
        item.aantal ||
        0
      )
      -
      damaged
      -
      missing
    );


  const note =
    document
      .getElementById(
        "returnProblemNote"
      )
      .value
      .trim();


  setReturnScreenValue(
    orderId,
    productName,
    "good",
    good
  );


  setReturnScreenValue(
    orderId,
    productName,
    "damaged",
    damaged
  );


  setReturnScreenValue(
    orderId,
    productName,
    "missing",
    missing
  );


  const noteField =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "note"
      )
    );


  if (
    noteField
  ) {

    noteField.value =
      note;

  }


  updateSimpleReturnItemStatus(
    orderId,
    productName
  );


  updateSimpleReturnProcessedTotal(
    orderId
  );


  closeReturnProblemModal();

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


  const processed =
    good +
    damaged +
    missing;


  const outside =
    Math.max(
      0,
      Number(
        item.aantal ||
        0
      )
      -
      processed
    );


  const status =
    document.getElementById(
      returnDomId(
        orderId,
        productName,
        "status"
      )
    );


  if (
    status
  ) {

    status.className =
      "return-status-circle";


    if (
      outside ===
      0
    ) {

      status.classList.add(
        "done"
      );

      status.textContent =
        "✓";

    }

    else if (
      damaged >
      0
      ||
      missing >
      0
    ) {

      status.classList.add(
        "warning"
      );

      status.textContent =
        "!";

    }

    else {

      status.classList.add(
        "open"
      );

      status.textContent =
        "•";

    }

  }

}


function updateReturnTotal(
  orderId
) {

  let totalLoaned =
    0;


  let totalGood =
    0;


  let totalDamaged =
    0;


  let totalMissing =
    0;


  getEventMaterialItems(
    orderId
  )
    .forEach(
      item => {

        totalLoaned +=
          Number(
            item.aantal ||
            0
          );


        totalGood +=
          getReturnScreenValue(
            orderId,
            item.product_naam,
            "good"
          );


        totalDamaged +=
          getReturnScreenValue(
            orderId,
            item.product_naam,
            "damaged"
          );


        totalMissing +=
          getReturnScreenValue(
            orderId,
            item.product_naam,
            "missing"
          );

      }
    );


  const totalProcessed =
    totalGood +
    totalDamaged +
    totalMissing;


  const totalRemaining =
    Math.max(
      0,
      totalLoaned -
      totalProcessed
    );


  const processedElement =
    document.getElementById(
      "returnTotalProcessed"
    );


  const remainingElement =
    document.getElementById(
      "returnTotalOutside"
    );


  const damagedElement =
    document.getElementById(
      "returnTotalDamaged"
    );


  if (
    processedElement
  ) {

    processedElement.textContent =
      totalProcessed;

  }


  if (
    remainingElement
  ) {

    remainingElement.textContent =
      totalRemaining;

  }


  if (
    damagedElement
  ) {

    damagedElement.textContent =
      totalDamaged;

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


    const incomplete =
      returns
        .find(
          (row, index) => {

            const expected =
              Number(
                items[index]?.aantal ||
                0
              );


            const processed =
              Number(row.goed_terug || 0) +
              Number(row.beschadigd || 0) +
              Number(row.ontbreekt || 0);


            return processed !== expected;

          }
        );


    if (
      incomplete
    ) {

      const message =
        document.getElementById(
          "returnValidationMessage"
        );


      if (
        message
      ) {

        message.textContent =
          "Duid eerst elk artikel aan als goed terug of registreer een probleem.";

        message.classList.remove(
          "hidden"
        );

        message.scrollIntoView({
          behavior:
            "smooth",
          block:
            "center"
        });

      }


      return;

    }


    const saveButton =
      document.querySelector(
        ".return-simple-save"
      );


    if (
      saveButton
    ) {

      saveButton.disabled =
        true;

      saveButton.textContent =
        "Verwerken…";

    }


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


    const {
      data: savedReturnRows,
      error: verifyError
    } =
      await supabaseClient
        .from(
          "event_material_returns"
        )
        .select(
          "order_id, product_naam, goed_terug, beschadigd, ontbreekt, opmerking"
        )
        .eq(
          "order_id",
          orderId
        );


    if (verifyError) {
      throw verifyError;
    }


    const saveIsComplete =
      items.every(
        item => {

          const saved =
            (savedReturnRows || [])
              .find(
                row =>
                  row.product_naam ===
                  item.product_naam
              );

          if (!saved) {
            return false;
          }

          const processed =
            Number(saved.goed_terug || 0) +
            Number(saved.beschadigd || 0) +
            Number(saved.ontbreekt || 0);

          return processed ===
            Number(item.aantal || 0);

        }
      );


    if (!saveIsComplete) {
      throw new Error(
        "Retourgegevens zijn niet volledig opgeslagen. De retour is daarom niet afgesloten."
      );
    }


    const {
      error: closeError
    } =
      await supabaseClient
        .from(
          "orders"
        )
        .update({

          event_returned_at:
            new Date().toISOString(),

          event_returned_by:
            currentUser?.id ||
            null

        })
        .eq(
          "id",
          orderId
        );


    if (
      closeError
    ) {

      throw closeError;

    }


    await loadAdminDashboard();


    selectedAdminOrder =
      null;


    showOnly(
      "adminScreen"
    );


    switchAdminTab(
      "material"
    );

  }

  catch (
    error
  ) {

    const message =
      document.getElementById(
        "returnValidationMessage"
      );


    if (
      message
    ) {

      message.textContent =
        "Retour kon niet worden verwerkt: " +
        adminReadableError(error);

      message.classList.remove(
        "hidden"
      );

    }

    else {

      alert(
        "Retour kon niet worden verwerkt.\n\n" +
        adminReadableError(error)
      );

    }

  }

}


async function reopenEventReturn(
  orderId
) {

  if (
    !confirm(
      "Retour heropenen? De registratie kan daarna opnieuw worden aangepast."
    )
  ) {

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from(
        "orders"
      )
      .update({

        event_returned_at:
          null,

        event_returned_by:
          null

      })
      .eq(
        "id",
        orderId
      );


  if (
    error
  ) {

    alert(
      "Retour kon niet worden heropend.\n\n" +
      adminReadableError(error)
    );

    return;

  }


  await loadAdminDashboard();


  const reopened =
    adminOrders
      .find(
        order =>
          order.id ===
          orderId
      );


  if (
    reopened
  ) {

    selectedAdminOrder =
      reopened;

    renderAdminDetail(
      reopened
    );

    showOnly(
      "adminDetailScreen"
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
          status,

        ...(
          status === "in_behandeling"
          &&
          !selectedAdminOrder.opened_at
            ? {
                opened_at:
                  new Date().toISOString()
              }
            : {}
        ),

        ...(
          status === "klaar"
          &&
          !selectedAdminOrder.completed_at
            ? {
                completed_at:
                  new Date().toISOString()
              }
            : {}
        ),

        ...(
          status === "afgehaald"
            ? {
                collected_at:
                  selectedAdminOrder.collected_at ||
                  new Date().toISOString()
              }
            : {}
        )

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
   GRATIS BIER - BEHEER
============================================================ */

async function loadAdminFreeBeerData(
  force = false
) {

  if (
    adminFreeBeerLoaded
    &&
    !force
  ) {

    renderAdminFreeBeer();

    return;

  }


  const loading =
    document.getElementById(
      "adminFreeBeerLoading"
    );


  if (
    loading
  ) {

    loading.classList.remove(
      "hidden"
    );

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient

        .from(
          "free_beer_registrations"
        )

        .select(`
          id,
          user_id,
          datum,
          inhoud,
          sku,
          aantal,
          drankenhandel,
          horecaklant,
          provincie,
          created_at
        `)

        .order(
          "datum",
          {
            ascending:
              false
          }
        )

        .order(
          "created_at",
          {
            ascending:
              false
          }
        );


    if (
      error
    ) {

      throw error;

    }


    adminFreeBeerRegistrations =
      data ||
      [];


    adminFreeBeerLoaded =
      true;


    fillAdminFreeBeerFilters();

    renderAdminFreeBeer();

  }

  catch (
    error
  ) {

    console.error(
      "GRATIS BIER BEHEER FOUT:",
      error
    );


    const container =
      document.getElementById(
        "adminFreeBeerList"
      );


    if (
      container
    ) {

      container.innerHTML = `

        <div class="info error">

          Gratis bier kon niet worden geladen.

          <br><br>

          ${adminEscapeHtml(
            adminReadableError(
              error
            )
          )}

        </div>

      `;

    }

  }

  finally {

    if (
      loading
    ) {

      loading.classList.add(
        "hidden"
      );

    }

  }

}


/* ===============================
   GRATIS BIER FILTERS
================================ */

function fillAdminFreeBeerFilters() {

  const provinceSelect =
    document.getElementById(
      "adminFreeBeerProvinceFilter"
    );


  const productSelect =
    document.getElementById(
      "adminFreeBeerProductFilter"
    );


  if (
    provinceSelect
  ) {

    const oldProvince =
      provinceSelect.value;


    const provinces =
      [
        ...new Set(
          adminFreeBeerRegistrations
            .map(
              row =>
                String(
                  row.provincie ||
                  ""
                )
                  .trim()
            )
            .filter(
              Boolean
            )
        )
      ]
        .sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second,
              "nl"
            )
        );


    provinceSelect.innerHTML =
      `

        <option value="">
          Alle provincies
        </option>

      `
      +
      provinces
        .map(
          province => `

            <option value="${adminEscapeHtml(province)}">
              ${adminEscapeHtml(province)}
            </option>

          `
        )
        .join("");


    if (
      provinces.includes(
        oldProvince
      )
    ) {

      provinceSelect.value =
        oldProvince;

    }

  }


  if (
    productSelect
  ) {

    const oldProduct =
      productSelect.value;


    const products =
      [
        ...new Set(
          adminFreeBeerRegistrations
            .map(
              row =>
                String(
                  row.sku ||
                  ""
                )
                  .trim()
            )
            .filter(
              Boolean
            )
        )
      ]
        .sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second,
              "nl"
            )
        );


    productSelect.innerHTML =
      `

        <option value="">
          Alle producten
        </option>

      `
      +
      products
        .map(
          product => `

            <option value="${adminEscapeHtml(product)}">
              ${adminEscapeHtml(product)}
            </option>

          `
        )
        .join("");


    if (
      products.includes(
        oldProduct
      )
    ) {

      productSelect.value =
        oldProduct;

    }

  }

}


/* ===============================
   GRATIS BIER FILTER DATA
================================ */

function getFilteredAdminFreeBeerRows() {

  const year =
    document
      .getElementById(
        "reportYear"
      )
      ?.value ||
    "";


  const month =
    document
      .getElementById(
        "reportMonth"
      )
      ?.value ||
    "";


  const representative =
    document
      .getElementById(
        "reportRepresentative"
      )
      ?.value ||
    "";


  const province =
    document
      .getElementById(
        "adminFreeBeerProvinceFilter"
      )
      ?.value ||
    "";


  const product =
    document
      .getElementById(
        "adminFreeBeerProductFilter"
      )
      ?.value ||
    "";


  const search =
    (
      document
        .getElementById(
          "adminFreeBeerSearch"
        )
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  return adminFreeBeerRegistrations
    .filter(
      row => {

        const date =
          String(
            row.datum ||
            ""
          );


        if (
          year
          &&
          date.slice(
            0,
            4
          ) !==
          year
        ) {

          return false;

        }


        if (
          month
          &&
          Number(
            date.slice(
              5,
              7
            )
          ) !==
          Number(
            month
          )
        ) {

          return false;

        }


        if (
          representative
          &&
          row.user_id !==
          representative
        ) {

          return false;

        }


        if (
          province
          &&
          row.provincie !==
          province
        ) {

          return false;

        }


        if (
          product
          &&
          row.sku !==
          product
        ) {

          return false;

        }


        if (
          search
        ) {

          const profile =
            getAdminProfile(
              row.user_id
            );


          const haystack =
            [

              row.horecaklant,

              row.drankenhandel,

              row.provincie,

              row.sku,

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


          if (
            !haystack.includes(
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


/* ===============================
   GRATIS BIER GROEPEREN
================================ */

function groupAdminFreeBeerRows(
  rows
) {

  const groups =
    new Map();


  rows
    .forEach(
      row => {

        const key =
          [

            row.user_id ||
            "",

            row.datum ||
            "",

            row.drankenhandel ||
            "",

            row.horecaklant ||
            "",

            row.provincie ||
            ""

          ]
            .join(
              "||"
            );


        if (
          !groups.has(
            key
          )
        ) {

          groups.set(
            key,
            {

              key:
                key,

              user_id:
                row.user_id,

              datum:
                row.datum,

              drankenhandel:
                row.drankenhandel,

              horecaklant:
                row.horecaklant,

              provincie:
                row.provincie,

              created_at:
                row.created_at,

              items:
                []

            }
          );

        }


        groups
          .get(
            key
          )
          .items
          .push(
            row
          );

      }
    );


  return [
    ...groups.values()
  ]
    .sort(
      (
        first,
        second
      ) => {

        const firstDate =
          new Date(
            first.datum ||
            first.created_at ||
            0
          )
            .getTime();


        const secondDate =
          new Date(
            second.datum ||
            second.created_at ||
            0
          )
            .getTime();


        return secondDate -
          firstDate;

      }
    );

}


/* ===============================
   GRATIS BIER RENDER
================================ */

function renderAdminFreeBeer() {

  const container =
    document.getElementById(
      "adminFreeBeerList"
    );


  if (
    !container
  ) {

    return;

  }


  if (
    !adminFreeBeerLoaded
  ) {

    container.innerHTML = `

      <div class="empty">
        Gratis bier laden...
      </div>

    `;


    return;

  }


  const rows =
    getFilteredAdminFreeBeerRows();


  const groups =
    groupAdminFreeBeerRows(
      rows
    );


  const totalUnits =
    rows.reduce(
      (
        total,
        row
      ) =>
        total +
        Number(
          row.aantal ||
          0
        ),
      0
    );


  const uniqueCustomers =
    new Set(
      groups
        .map(
          group =>
            String(
              group.horecaklant ||
              ""
            )
              .trim()
              .toLowerCase()
        )
        .filter(
          Boolean
        )
    )
      .size;


  setCount(
    "adminFreeBeerUnits",
    totalUnits
  );


  setCount(
    "adminFreeBeerRegistrationsCount",
    groups.length
  );


  setCount(
    "adminFreeBeerCustomersCount",
    uniqueCustomers
  );


  if (
    !groups.length
  ) {

    container.innerHTML = `

      <div class="admin-clear">

        <b>
          Geen registraties gevonden
        </b>

        <span>
          Pas de filters aan of kies een andere periode.
        </span>

      </div>

    `;


    return;

  }


  container.innerHTML =
    groups

      .map(
        group => {

          const profile =
            getAdminProfile(
              group.user_id
            );


          const units =
            group.items
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  Number(
                    item.aantal ||
                    0
                  ),
                0
              );


          return `

            <details class="admin-freebeer-card">

              <summary>

                <div>

                  <span>
                    ${adminFormatFreeBeerDate(
                      group.datum
                    )}
                  </span>

                  <strong>
                    ${adminEscapeHtml(
                      group.horecaklant ||
                      "Geen horecaklant"
                    )}
                  </strong>

                  <small>

                    ${adminEscapeHtml(
                      group.drankenhandel ||
                      "Geen drankenhandel"
                    )}

                    ·

                    ${adminEscapeHtml(
                      group.provincie ||
                      ""
                    )}

                  </small>

                </div>


                <div class="admin-freebeer-card-side">

                  <b>
                    ${units}
                  </b>

                  <small>
                    eenheden
                  </small>

                </div>

              </summary>


              <div class="admin-freebeer-card-body">

                <div class="admin-freebeer-rep">

                  <span>
                    Vertegenwoordiger
                  </span>

                  <strong>
                    ${adminEscapeHtml(
                      profile?.naam ||
                      profile?.email ||
                      "Onbekend"
                    )}
                  </strong>

                </div>


                ${
                  group.items

                    .map(
                      item => `

                        <div class="admin-freebeer-item">

                          <div>

                            <strong>
                              ${adminEscapeHtml(
                                item.sku ||
                                ""
                              )}
                            </strong>

                            <small>
                              ${adminEscapeHtml(
                                item.inhoud ||
                                ""
                              )}
                            </small>

                          </div>

                          <b>
                            ${Number(
                              item.aantal ||
                              0
                            )}
                          </b>

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


/* ===============================
   GRATIS BIER DATUM
================================ */

function adminFormatFreeBeerDate(
  date
) {

  if (
    !date
  ) {

    return "";

  }


  const parsed =
    new Date(
      `${date}T00:00:00`
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return String(
      date
    );

  }


  return parsed
    .toLocaleDateString(
      "nl-BE",
      {

        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric"

      }
    );

}


/* ===============================
   GRATIS BIER EXCEL
================================ */

function exportAdminFreeBeerExcel() {

  if (
    typeof XLSX ===
    "undefined"
  ) {

    alert(
      "Excel-module niet geladen."
    );

    return;

  }


  const rows =
    getFilteredAdminFreeBeerRows();


  if (
    !rows.length
  ) {

    alert(
      "Geen gratis bier voor deze selectie."
    );

    return;

  }


  const excelRows =
    rows
      .map(
        row => {

          const profile =
            getAdminProfile(
              row.user_id
            );


          return {

            "Inhoud":
              row.inhoud ||
              "",

            "SKU":
              row.sku ||
              "",

            "Aantal":
              Number(
                row.aantal ||
                0
              ),

            "Drankenhandel":
              row.drankenhandel ||
              "",

            "Horecaklant":
              row.horecaklant ||
              "",

            "Provincie":
              row.provincie ||
              "",

            "Vertegenwoordiger":
              profile?.naam ||
              profile?.email ||
              ""

          };

        }
      );


  const workbook =
    XLSX.utils
      .book_new();


  const worksheet =
    XLSX.utils
      .json_to_sheet(
        excelRows,
        {
          header: [
            "Inhoud",
            "SKU",
            "Aantal",
            "Drankenhandel",
            "Horecaklant",
            "Provincie",
            "Vertegenwoordiger"
          ]
        }
      );


  worksheet["!cols"] = [

    {
      wch:
        14
    },

    {
      wch:
        44
    },

    {
      wch:
        10
    },

    {
      wch:
        28
    },

    {
      wch:
        28
    },

    {
      wch:
        20
    },

    {
      wch:
        24
    }

  ];


  XLSX.utils
    .book_append_sheet(
      workbook,
      worksheet,
      "Gratis bier"
    );


  const year =
    document
      .getElementById(
        "reportYear"
      )
      ?.value ||
    "alle";


  const month =
    document
      .getElementById(
        "reportMonth"
      )
      ?.value ||
    "alle";


  XLSX.writeFile(
    workbook,
    `Achel_gratis_bier_${safeFilename(year)}_${safeFilename(month)}.xlsx`
  );

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


  const years =
    new Set(
      [
        current,
        current - 1,
        current - 2,
        current - 3,
        current - 4,
        current - 5
      ]
    );


  adminOrders
    .forEach(
      order => {

        if (
          order.created_at
        ) {

          years.add(
            new Date(
              order.created_at
            )
              .getFullYear()
          );

        }

      }
    );


  adminWholesaleOrders
    .forEach(
      order => {

        if (
          order.created_at
        ) {

          years.add(
            new Date(
              order.created_at
            )
              .getFullYear()
          );

        }

      }
    );


  adminFreeBeerRegistrations
    .forEach(
      row => {

        const year =
          Number(
            String(
              row.datum ||
              ""
            )
              .slice(
                0,
                4
              )
          );


        if (
          year
        ) {

          years.add(
            year
          );

        }

      }
    );


  select.innerHTML =
    [
      ...years
    ]
      .filter(
        Number.isFinite
      )
      .sort(
        (
          first,
          second
        ) =>
          second -
          first
      )
      .map(
        year =>
          `<option value="${year}">${year}</option>`
      )
      .join("");


  if (
    old
    &&
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

  else {

    select.value =
      String(
        current
      );

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
      "";


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



/* ============================================================
   CENTRAAL RAPPORTEN & ARCHIEF
============================================================ */

function getCentralReportFilters() {

  return {

    representative:
      document
        .getElementById(
          "reportRepresentative"
        )
        ?.value ||
      "",

    year:
      Number(
        document
          .getElementById(
            "reportYear"
          )
          ?.value
      ),

    month:
      document
        .getElementById(
          "reportMonth"
        )
        ?.value ||
      ""

  };

}


function centralReportDateMatches(
  dateValue,
  filters
) {

  if (
    !dateValue
  ) {

    return false;

  }


  const date =
    new Date(
      dateValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return false;

  }


  if (
    filters.year
    &&
    date.getFullYear() !==
    filters.year
  ) {

    return false;

  }


  if (
    filters.month
    &&
    date.getMonth() + 1 !==
    Number(
      filters.month
    )
  ) {

    return false;

  }


  return true;

}


function getCentralWholesaleOrders() {

  const filters =
    getCentralReportFilters();


  return adminWholesaleOrders
    .filter(
      order => {

        if (
          filters.representative
          &&
          order.user_id !==
          filters.representative
        ) {

          return false;

        }


        return centralReportDateMatches(
          order.created_at,
          filters
        );

      }
    );

}


function getCentralPosArchiveOrders() {

  const filters =
    getCentralReportFilters();


  return adminOrders
    .filter(
      order => {

        if (
          order.event_naam
        ) {

          return false;

        }


        if (
          !isArchivedOrder(
            order
          )
        ) {

          return false;

        }


        if (
          filters.representative
          &&
          order.user_id !==
          filters.representative
        ) {

          return false;

        }


        return centralReportDateMatches(
          order.collected_at ||
          order.updated_at ||
          order.created_at,
          filters
        );

      }
    );

}


function getCentralEventArchiveOrders() {

  const filters =
    getCentralReportFilters();


  return adminOrders
    .filter(
      order => {

        if (
          !order.event_naam
        ) {

          return false;

        }


        const completed =
          Boolean(
            order.event_returned_at
          )
          ||
          order.status ===
          "geannuleerd";


        if (
          !completed
        ) {

          return false;

        }


        if (
          filters.representative
          &&
          order.user_id !==
          filters.representative
        ) {

          return false;

        }


        return centralReportDateMatches(
          order.event_returned_at ||
          order.updated_at ||
          order.created_at,
          filters
        );

      }
    );

}


function renderCentralReports() {

  updateCentralReportCounts();


  const wholesaleFolder =
    document.getElementById(
      "reportFolderWholesale"
    );


  if (
    wholesaleFolder?.open
  ) {

    renderCentralWholesaleArchive();

  }


  const posFolder =
    document.getElementById(
      "reportFolderPos"
    );


  if (
    posFolder?.open
  ) {

    renderCentralPosArchive();

  }


  const eventsFolder =
    document.getElementById(
      "reportFolderEvents"
    );


  if (
    eventsFolder?.open
  ) {

    renderCentralEventArchive();

  }


  const freeBeerFolder =
    document.getElementById(
      "reportFolderFreeBeer"
    );


  if (
    freeBeerFolder?.open
    &&
    adminFreeBeerLoaded
  ) {

    renderAdminFreeBeer();

  }

}


async function handleCentralReportFolder(
  folder,
  open
) {

  if (
    !open
  ) {

    return;

  }


  if (
    !adminReportsLoaded
  ) {

    await loadAdminReportsData();

  }


  if (
    folder ===
    "wholesale"
  ) {

    renderCentralWholesaleArchive();

  }


  if (
    folder ===
    "pos"
  ) {

    renderCentralPosArchive();

  }


  if (
    folder ===
    "events"
  ) {

    renderCentralEventArchive();

  }


  if (
    folder ===
    "freebeer"
  ) {

    await loadAdminFreeBeerData();

    fillReportYears();

    renderAdminFreeBeer();

  }


  updateCentralReportCounts();

}


function updateCentralReportCounts() {

  setCount(
    "centralWholesaleCount",
    getCentralWholesaleOrders()
      .length
  );


  setCount(
    "centralPosCount",
    getCentralPosArchiveOrders()
      .length
  );


  setCount(
    "centralEventsCount",
    getCentralEventArchiveOrders()
      .length
  );


  if (
    adminFreeBeerLoaded
  ) {

    setCount(
      "centralFreeBeerCount",
      groupAdminFreeBeerRows(
        getFilteredAdminFreeBeerRows()
      )
        .length
    );

  }

  else {

    setCount(
      "centralFreeBeerCount",
      0
    );

  }

}


function renderCentralWholesaleArchive() {

  const container =
    document.getElementById(
      "centralWholesaleList"
    );


  if (
    !container
  ) {

    return;

  }


  const orders =
    getCentralWholesaleOrders();


  if (
    !orders.length
  ) {

    container.innerHTML = `

      <div class="admin-clear">

        <b>
          Geen groothandelbestellingen gevonden
        </b>

      </div>

    `;


    return;

  }


  container.innerHTML =
    orders
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


          const total =
            items
              .reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.totaal_aantal ||
                    item.betaald_aantal ||
                    0
                  ),
                0
              );


          const proof =
            adminWholesaleProofs
              .find(
                item =>
                  item.order_id ===
                  order.id
              );


          return `

            <details class="admin-wholesale">

              <summary>

                <div>

                  <b>
                    ${adminEscapeHtml(
                      order.referentie ||
                      "Geen referentie"
                    )}
                  </b>

                  <small>

                    ${adminEscapeHtml(
                      profile?.naam ||
                      "Onbekend"
                    )}

                    ·

                    ${adminEscapeHtml(
                      order.drankenhandel ||
                      "Geen drankenhandel"
                    )}

                  </small>

                </div>


                <span>
                  ${total}
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
                              item.product_naam ||
                              ""
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


                ${
                  proof
                    ? `

                        <button
                          type="button"
                          class="admin-primary"
                          onclick="downloadWholesaleProofPdf('${order.id}')"
                        >
                          PDF bestelbewijs
                        </button>

                      `
                    : ""
                }

              </div>

            </details>

          `;

        }
      )
      .join("");

}


function renderCentralPosArchive() {

  renderOrderList(
    "centralPosArchiveList",
    getCentralPosArchiveOrders(),
    "Geen afgehandelde POS- of promo-aanvragen gevonden."
  );

}


function renderCentralEventArchive() {

  renderOrderList(
    "centralEventArchiveList",
    getCentralEventArchiveOrders(),
    "Geen afgehandelde evenementen gevonden."
  );

}


function buildCentralOrderExcelRows(
  orders,
  type
) {

  const rows =
    [];


  orders
    .forEach(
      order => {

        const profile =
          getAdminProfile(
            order.user_id
          );


        const items =
          getAdminOrderItems(
            order.id
          );


        (
          items.length
            ? items
            : [
                {
                  product_naam:
                    "",
                  categorie:
                    "",
                  aantal:
                    0
                }
              ]
        )
          .forEach(
            item => {

              rows.push({

                "Datum":
                  formatExcelDate(
                    order.event_returned_at ||
                    order.collected_at ||
                    order.updated_at ||
                    order.created_at
                  ),

                "Type":
                  type,

                "Status":
                  formatStatus(
                    order.status
                  ),

                "Vertegenwoordiger":
                  profile?.naam ||
                  "",

                "E-mail":
                  profile?.email ||
                  "",

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
                  Number(
                    item.aantal ||
                    0
                  )

              });

            }
          );

      }
    );


  return rows;

}


function exportCentralPosExcel() {

  exportCentralOrdersExcel(
    getCentralPosArchiveOrders(),
    "POS / promo",
    "Achel_POS_promo_archief"
  );

}


function exportCentralEventsExcel() {

  exportCentralOrdersExcel(
    getCentralEventArchiveOrders(),
    "Evenement",
    "Achel_evenementen_archief"
  );

}


function exportCentralOrdersExcel(
  orders,
  type,
  filename
) {

  if (
    typeof XLSX ===
    "undefined"
  ) {

    alert(
      "Excel-module niet geladen."
    );

    return;

  }


  const rows =
    buildCentralOrderExcelRows(
      orders,
      type
    );


  if (
    !rows.length
  ) {

    alert(
      "Geen gegevens voor deze selectie."
    );

    return;

  }


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
      "Archief"
    );


  const filters =
    getCentralReportFilters();


  XLSX.writeFile(
    workbook,
    `${filename}_${filters.year || "alle"}_${filters.month || "alle"}.xlsx`
  );

}


function exportCentralWholesaleExcel() {

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
    getCentralWholesaleOrders();


  if (
    !orders.length
  ) {

    alert(
      "Geen groothandelbestellingen voor deze selectie."
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


        const proof =
          adminWholesaleProofs
            .find(
              item =>
                item.order_id ===
                order.id
            );


        const items =
          adminWholesaleItems
            .filter(
              item =>
                item.wholesale_order_id ===
                order.id
            );


        (
          items.length
            ? items
            : [
                {
                  product_naam:
                    "",
                  eenheid:
                    "",
                  betaald_aantal:
                    0,
                  actie:
                    "",
                  gratis_aantal:
                    0,
                  totaal_aantal:
                    0
                }
              ]
        )
          .forEach(
            item => {

              rows.push({

                "Aanvraagdatum":
                  formatExcelDate(
                    order.created_at
                  ),

                "Vertegenwoordiger":
                  profile?.naam ||
                  "",

                "E-mail":
                  profile?.email ||
                  "",

                "Referentie":
                  order.referentie ||
                  "",

                "Drankenhandel":
                  order.drankenhandel ||
                  "",

                "Status":
                  formatStatus(
                    order.status
                  ),

                "Product":
                  item.product_naam ||
                  "",

                "Eenheid":
                  item.eenheid ||
                  "",

                "Betaald aantal":
                  Number(
                    item.betaald_aantal ||
                    0
                  ),

                "Actie":
                  item.actie ||
                  "",

                "Gratis aantal":
                  Number(
                    item.gratis_aantal ||
                    0
                  ),

                "Totaal aantal":
                  Number(
                    item.totaal_aantal ||
                    item.betaald_aantal ||
                    0
                  ),

                "Ondertekend":
                  proof
                    ? "Ja"
                    : "Nee",

                "Ondertekend door":
                  proof?.signer_name ||
                  "",

                "Ondertekend op":
                  formatExcelDate(
                    proof?.signed_at
                  )

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
      "Groothandel"
    );


  const filters =
    getCentralReportFilters();


  XLSX.writeFile(
    workbook,
    `Achel_groothandel_${filters.year || "alle"}_${filters.month || "alle"}.xlsx`
  );

}



/* ===============================
   REPORT HELPERS
================================ */

function getAdminReportFilters() {

  const central =
    getCentralReportFilters();


  return {

    representative:
      central.representative,

    requestType:
      "all",

    periodType:
      central.month
        ? "month"
        : "year",

    year:
      central.year,

    month:
      central.month
        ? Number(
            central.month
          )
        : 0

  };

}


function adminReportDateMatches(
  dateValue,
  filters
) {

  if (
    !dateValue
  ) {

    return false;

  }


  const date =
    new Date(
      dateValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return false;

  }


  return (

    date.getFullYear() ===
    filters.year

    &&

    (
      filters.periodType ===
      "year"

      ||

      date.getMonth() + 1 ===
      filters.month
    )

  );

}


/* ===============================
   REPORT GEWONE / EVENT ORDERS
================================ */

function getReportOrders() {

  const filters =
    getAdminReportFilters();


  if (
    filters.requestType ===
    "wholesale"
  ) {

    return [];

  }


  return adminOrders
    .filter(
      order => {

        if (
          filters.representative

          &&

          order.user_id !==
          filters.representative
        ) {

          return false;

        }


        if (
          filters.requestType ===
          "regular"

          &&

          order.event_naam
        ) {

          return false;

        }


        if (
          filters.requestType ===
          "event"

          &&

          !order.event_naam
        ) {

          return false;

        }


        return adminReportDateMatches(
          order.created_at,
          filters
        );

      }
    );

}


/* ===============================
   REPORT GROOTHANDEL
================================ */

function getReportWholesaleOrders() {

  const filters =
    getAdminReportFilters();


  if (
    ![
      "all",
      "wholesale"
    ]
      .includes(
        filters.requestType
      )
  ) {

    return [];

  }


  return adminWholesaleOrders
    .filter(
      order => {

        if (
          filters.representative

          &&

          order.user_id !==
          filters.representative
        ) {

          return false;

        }


        return adminReportDateMatches(
          order.created_at,
          filters
        );

      }
    );

}


/* ===============================
   RAPPORT DATASETS
================================ */

function getReportRows() {

  const rows =
    [];


  getReportOrders()
    .forEach(
      order => {

        const profile =
          getAdminProfile(
            order.user_id
          );


        const items =
          getAdminOrderItems(
            order.id
          );


        if (
          !items.length
        ) {

          rows.push({

            bron:
              order.event_naam
                ? "Evenement"
                : "POS & bier",

            aanvraagdatum:
              order.created_at,

            status:
              order.status ||
              "",

            vertegenwoordiger:
              profile?.naam ||
              "",

            email:
              profile?.email ||
              "",

            referentie:
              order.event_naam ||
              order.referentie ||
              "",

            product:
              "",

            categorie:
              "",

            aantal:
              0,

            order_id:
              order.id

          });


          return;

        }


        items
          .forEach(
            item => {

              rows.push({

                bron:
                  order.event_naam
                    ? "Evenement"
                    : "POS & bier",

                aanvraagdatum:
                  order.created_at,

                status:
                  order.status ||
                  "",

                vertegenwoordiger:
                  profile?.naam ||
                  "",

                email:
                  profile?.email ||
                  "",

                referentie:
                  order.event_naam ||
                  order.referentie ||
                  "",

                product:
                  item.product_naam ||
                  "",

                categorie:
                  item.categorie ||
                  "",

                aantal:
                  Number(
                    item.aantal ||
                    0
                  ),

                order_id:
                  order.id

              });

            }
          );

      }
    );


  getReportWholesaleOrders()
    .forEach(
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


        if (
          !items.length
        ) {

          rows.push({

            bron:
              "Groothandel",

            aanvraagdatum:
              order.created_at,

            status:
              order.status ||
              "",

            vertegenwoordiger:
              profile?.naam ||
              "",

            email:
              profile?.email ||
              "",

            referentie:
              order.referentie ||
              order.drankenhandel ||
              "",

            product:
              "",

            categorie:
              "groothandel",

            aantal:
              0,

            order_id:
              order.id

          });


          return;

        }


        items
          .forEach(
            item => {

              rows.push({

                bron:
                  "Groothandel",

                aanvraagdatum:
                  order.created_at,

                status:
                  order.status ||
                  "",

                vertegenwoordiger:
                  profile?.naam ||
                  "",

                email:
                  profile?.email ||
                  "",

                referentie:
                  order.referentie ||
                  order.drankenhandel ||
                  "",

                product:
                  item.product_naam ||
                  "",

                categorie:
                  "groothandel",

                aantal:
                  Number(
                    item.totaal_aantal ||
                    item.betaald_aantal ||
                    0
                  ),

                order_id:
                  order.id

              });

            }
          );

      }
    );


  return rows;

}


function getReportApplicationCounts() {

  const counts = {

    "POS & bier":
      0,

    "Evenement":
      0,

    "Groothandel":
      0

  };


  getReportOrders()
    .forEach(
      order => {

        if (
          order.event_naam
        ) {

          counts[
            "Evenement"
          ] +=
            1;

        }

        else {

          counts[
            "POS & bier"
          ] +=
            1;

        }

      }
    );


  counts[
    "Groothandel"
  ] =
    getReportWholesaleOrders()
      .length;


  return counts;

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


  const regularOrders =
    getReportOrders();


  const wholesaleOrders =
    getReportWholesaleOrders();


  const totalRequests =
    regularOrders.length +
    wholesaleOrders.length;


  const totalItems =
    getReportRows()
      .reduce(
        (
          total,
          row
        ) =>

          total +
          Number(
            row.aantal ||
            0
          ),

        0
      );


  container.innerHTML = `

    <div>

      <strong>
        ${totalRequests}
      </strong>

      <span>
        Aanvragen
      </span>

    </div>


    <div>

      <strong>
        ${totalItems}
      </strong>

      <span>
        Aangevraagde items
      </span>

    </div>

  `;


  renderAdminReportChart(
    getReportApplicationCounts()
  );

}


/* ===============================
   REPORT CHART
================================ */

function renderAdminReportChart(
  counts
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
        counts
      )
      .filter(
        entry =>
          entry[1] > 0
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
                "Aantal aanvragen",

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

          plugins: {

            legend: {
              display:
                false
            }

          },

          scales: {

            y: {

              beginAtZero:
                true,

              ticks: {

                precision:
                  0

              }

            }

          }

        }

      }
    );

}


/* ===============================
   EXCEL ALLE RAPPORTEN
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


  const rows =
    getReportRows();


  if (
    !rows.length
  ) {

    alert(
      "Geen aanvragen voor deze selectie."
    );

    return;

  }


  const excelRows =
    rows
      .map(
        row => ({

          "Aanvraagdatum":
            formatExcelDate(
              row.aanvraagdatum
            ),

          "Type aanvraag":
            row.bron,

          "Status":
            formatStatus(
              row.status
            ),

          "Vertegenwoordiger":
            row.vertegenwoordiger,

          "E-mail":
            row.email,

          "Referentie / evenement":
            row.referentie,

          "Product / materiaal":
            row.product,

          "Categorie":
            row.categorie,

          "Aantal":
            row.aantal

        })
      );


  const workbook =
    XLSX.utils
      .book_new();


  XLSX.utils
    .book_append_sheet(

      workbook,

      XLSX.utils
        .json_to_sheet(
          excelRows
        ),

      "Aanvragen"

    );


  const counts =
    getReportApplicationCounts();


  const summaryRows =
    Object
      .entries(
        counts
      )
      .map(
        (
          [
            type,
            total
          ]
        ) => ({

          "Type aanvraag":
            type,

          "Aantal aanvragen":
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


  const filters =
    getAdminReportFilters();


  const representative =
    filters.representative

      ? getAdminProfile(
          filters.representative
        )?.naam ||
        "Vertegenwoordiger"

      : "Alle";


  XLSX.writeFile(

    workbook,

    `Achel_rapport_${safeFilename(
      representative
    )}_${filters.year}${
      filters.periodType ===
      "month"

        ? `_${String(filters.month).padStart(2,"0")}`

        : ""
    }_${safeFilename(filters.requestType)}.xlsx`

  );

}


/* ===============================
   EXCEL GROOTHANDEL
================================ */

function exportWholesaleReportExcel() {

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
    adminWholesaleOrders;


  if (
    !orders.length
  ) {

    alert(
      "Geen groothandelbestellingen beschikbaar."
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


        const proof =
          adminWholesaleProofs
            .find(
              item =>
                item.order_id ===
                order.id
            );


        const items =
          adminWholesaleItems
            .filter(
              item =>
                item.wholesale_order_id ===
                order.id
            );


        (
          items.length

            ? items

            : [
                {
                  product_naam:
                    "",
                  eenheid:
                    "",
                  betaald_aantal:
                    0,
                  actie:
                    "",
                  gratis_aantal:
                    0,
                  totaal_aantal:
                    0
                }
              ]
        )
          .forEach(
            item => {

              rows.push({

                "Aanvraagdatum":
                  formatExcelDate(
                    order.created_at
                  ),

                "Vertegenwoordiger":
                  profile?.naam ||
                  "",

                "E-mail":
                  profile?.email ||
                  "",

                "Referentie":
                  order.referentie ||
                  "",

                "Drankenhandel":
                  order.drankenhandel ||
                  "",

                "Status":
                  formatStatus(
                    order.status
                  ),

                "Product":
                  item.product_naam ||
                  "",

                "Eenheid":
                  item.eenheid ||
                  "",

                "Betaald aantal":
                  Number(
                    item.betaald_aantal ||
                    0
                  ),

                "Actie":
                  item.actie ||
                  "",

                "Gratis aantal":
                  Number(
                    item.gratis_aantal ||
                    0
                  ),

                "Totaal aantal":
                  Number(
                    item.totaal_aantal ||
                    item.betaald_aantal ||
                    0
                  ),

                "Ondertekend":
                  proof
                    ? "Ja"
                    : "Nee",

                "Ondertekend door":
                  proof?.signer_name ||
                  "",

                "Ondertekend op":
                  formatExcelDate(
                    proof?.signed_at
                  )

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

      "Groothandel"

    );


  XLSX.writeFile(

    workbook,

    `Achel_groothandel_${new Date()
      .toISOString()
      .slice(
        0,
        10
      )}.xlsx`

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
          5,
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



    .admin-stock-intro {

      margin-bottom:8px;
      padding:8px 10px;

      border-radius:10px;

      background:#273129;
      color:#bfc7c0;

      font-size:8px;
      line-height:1.4;

    }


    .admin-catalog-sub {

      display:block;
      margin-top:2px;

      color:#8c948d !important;
      font-size:8px !important;

    }



    .event-delivery-modal {
      width:100%;
      max-width:560px;
      max-height:90vh;
      overflow-y:auto;
      padding:14px;
      border-radius:18px;
      background:#f8f6f0;
      box-shadow:0 18px 50px rgba(0,0,0,.3);
    }

    .event-delivery-items {
      display:grid;
      gap:8px;
      margin-top:10px;
    }

    .event-delivery-item {
      padding:10px;
      border:1px solid #ded8ce;
      border-radius:11px;
      background:white;
    }

    .event-delivery-item strong {
      display:block;
      color:#182019;
      font-size:11px;
    }

    .event-delivery-item small {
      display:block;
      margin-top:2px;
      color:#7e776d;
      font-size:8px;
    }

    .event-delivery-item label {
      margin-top:8px;
      font-size:8px;
    }

    .event-delivery-item input {
      min-height:40px;
      margin-top:4px;
      font-size:11px;
    }

    .event-signature-box {
      margin-top:5px;
      overflow:hidden;
      border:1px solid #d8d2c8;
      border-radius:11px;
      background:white;
    }

    #eventDeliverySignatureCanvas {
      display:block;
      width:100%;
      height:150px;
      touch-action:none;
    }


    /* ==========================================
       GRATIS BIER
    ========================================== */

    .admin-freebeer-loading {

      margin-bottom:8px;
      padding:9px 10px;

      border-radius:10px;

      background:#2a322b;
      color:#c7cec8;

      font-size:9px;
      font-weight:850;

    }


    .admin-freebeer-kpis {

      display:grid;
      grid-template-columns:repeat(3, 1fr);
      gap:6px;

    }


    .admin-freebeer-kpis > div {

      padding:9px;

      border:
        1px solid
        #465047;

      border-radius:11px;

      background:#303930;

    }


    .admin-freebeer-kpis span {

      display:block;

      color:#b8c0b9;

      font-size:8px;
      font-weight:900;

      text-transform:uppercase;

    }


    .admin-freebeer-kpis strong {

      display:block;

      margin-top:2px;

      color:#d7b66d;

      font-size:21px;

    }


    .admin-freebeer-filter-card {

      margin-top:8px;
      padding:9px;

      border:
        1px solid
        #414941;

      border-radius:12px;

      background:#2a322b;

    }


    .admin-freebeer-filter-grid {

      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;

    }


    .admin-freebeer-filter-card label {

      color:#bac1bb;
      font-size:8px;

      margin:6px 0 3px;

    }


    .admin-freebeer-filter-card select,
    .admin-freebeer-filter-card input {

      min-height:39px !important;

      border:
        1px solid
        #4a534b !important;

      border-radius:10px !important;

      background:#202721 !important;
      color:white !important;

      font-size:11px !important;

    }


    .admin-freebeer-card {

      margin-top:6px;

      border:
        1px solid
        #d8d5cd;

      border-left:
        4px solid
        #b88a3e;

      border-radius:11px;

      background:white;
      color:#202722;

      overflow:hidden;

    }


    .admin-freebeer-card > summary {

      list-style:none;

      display:grid;

      grid-template-columns:1fr auto;
      gap:8px;
      align-items:center;

      padding:10px;

      cursor:pointer;

    }


    .admin-freebeer-card > summary::-webkit-details-marker {

      display:none;

    }


    .admin-freebeer-card > summary span {

      display:block;

      color:#8c692f;

      font-size:8px;
      font-weight:900;

    }


    .admin-freebeer-card > summary strong {

      display:block;

      margin-top:2px;

      color:#202722;

      font-size:12px;

    }


    .admin-freebeer-card > summary small {

      display:block;

      margin-top:2px;

      color:#777;

      font-size:8px;

    }


    .admin-freebeer-card-side {

      min-width:54px;

      text-align:right;

    }


    .admin-freebeer-card-side b {

      display:block;

      color:#8c692f;

      font-size:18px;

    }


    .admin-freebeer-card-side small {

      font-size:7px !important;

    }


    .admin-freebeer-card-body {

      padding:0 10px 10px;

      border-top:
        1px solid
        #ebe7de;

    }


    .admin-freebeer-rep {

      display:flex;
      justify-content:space-between;
      gap:8px;

      padding:8px 0;

      border-bottom:
        1px solid
        #eeeae2;

    }


    .admin-freebeer-rep span {

      color:#777;

      font-size:8px;
      font-weight:850;

    }


    .admin-freebeer-rep strong {

      color:#202722;

      font-size:9px;

      text-align:right;

    }


    .admin-freebeer-item {

      display:grid;
      grid-template-columns:1fr auto;
      align-items:center;
      gap:8px;

      padding:8px 0;

      border-bottom:
        1px solid
        #f0ede6;

    }


    .admin-freebeer-item strong {

      display:block;

      color:#202722;

      font-size:10px;

    }


    .admin-freebeer-item small {

      display:block;

      margin-top:2px;

      color:#777;

      font-size:8px;

    }


    .admin-freebeer-item > b {

      min-width:28px;

      color:#8c692f;

      text-align:right;

      font-size:14px;

    }


    /* ==========================================
       CENTRAAL RAPPORTEN & ARCHIEF
    ========================================== */

    .admin-report-central-filters {

      margin-bottom:9px;
      padding:9px;

      border:
        1px solid
        #414941;

      border-radius:12px;

      background:#2a322b;

    }


    .admin-report-central-filters label {

      color:#bac1bb;
      font-size:8px;

      margin:5px 0 3px;

    }


    .admin-report-central-filters select {

      min-height:39px;

      background:#202721;
      color:white;

      border-color:#4a534b;

    }


    .admin-report-folder {

      margin-top:7px;

      border:
        1px solid
        #414a42;

      border-radius:12px;

      background:#2d352e;

      overflow:hidden;

    }


    .admin-report-folder > summary {

      list-style:none;

      display:grid;
      grid-template-columns:1fr auto;
      align-items:center;
      gap:8px;

      min-height:58px;

      padding:9px 11px;

      cursor:pointer;

    }


    .admin-report-folder > summary::-webkit-details-marker {

      display:none;

    }


    .admin-report-folder > summary span {

      display:block;

      color:#c6b17c;

      font-size:8px;
      font-weight:900;
      letter-spacing:.05em;

    }


    .admin-report-folder > summary strong {

      display:block;

      margin-top:2px;

      color:white;

      font-size:13px;

    }


    .admin-report-folder > summary > b {

      min-width:30px;

      padding:4px 7px;

      border-radius:999px;

      background:#e7e3d8;
      color:#555;

      text-align:center;

      font-size:9px;

    }


    .admin-report-folder-body {

      padding:7px;

      border-top:
        1px solid
        #424b43;

      background:#202721;

    }


    .admin-report-folder .admin-wholesale {

      margin-top:6px;

    }


    @media (
      max-width:520px
    ) {

      .admin-tabs button {

        font-size:7px;

      }


      .admin-freebeer-kpis {

        grid-template-columns:
          repeat(3, 1fr);

      }


      .admin-freebeer-kpis strong {

        font-size:18px;

      }

    }

  `;


  document.head
    .appendChild(
      style
    );

}

/* ============================================================
   PROFESSIONELE RETOUR LAYOUT
============================================================ */

function injectProfessionalReturnStyles() {

  if (
    document.getElementById(
      "achelProfessionalReturnStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "achelProfessionalReturnStyles";


  style.textContent = `

    /* ==========================================
       RETOUR WORKSPACE
    ========================================== */

    .return-workspace {

      background:
        #f7f5ef;

      border:
        1px solid
        #ded9ce;

      border-radius:
        18px;

      overflow:hidden;

      box-shadow:
        0 10px 30px
        rgba(
          40,
          34,
          24,
          .08
        );

    }


    /* ==========================================
       HEADER
    ========================================== */

    .return-workspace-header {

      padding:
        18px;

      border-bottom:
        1px solid
        #ddd7cb;

      background:
        #faf9f5;

    }


    .return-header-top {

      display:flex;

      justify-content:
        space-between;

      align-items:flex-start;

      gap:
        12px;

    }


    .return-kicker {

      display:block;

      color:
        #8c806c;

      font-size:
        10px;

      font-weight:
        900;

      letter-spacing:
        .12em;

      text-transform:
        uppercase;

    }


    .return-header-top h2 {

      margin:
        4px 0 0;

      font-size:
        27px;

      color:
        #181c18;

    }


    .return-all-good {

      min-height:
        42px;

      padding:
        0 15px;

      border:
        0;

      border-radius:
        10px;

      background:
        #194d38;

      color:
        white;

      font-size:
        12px;

      font-weight:
        900;

      white-space:
        nowrap;

    }


    /* ==========================================
       KPI SAMENVATTING
    ========================================== */

    .return-summary-bar {

      display:grid;

      grid-template-columns:
        repeat(
          4,
          1fr
        );

      margin-top:
        16px;

      border:
        1px solid
        #ded9ce;

      border-radius:
        14px;

      background:
        white;

      overflow:hidden;

    }


    .return-summary-stat {

      position:relative;

      padding:
        14px 10px;

      text-align:center;

    }


    .return-summary-stat:not(:last-child) {

      border-right:
        1px solid
        #e6e1d8;

    }


    .return-summary-stat span {

      display:block;

      color:
        #8b8376;

      font-size:
        9px;

      font-weight:
        900;

      text-transform:
        uppercase;

      letter-spacing:
        .05em;

    }


    .return-summary-stat strong {

      display:block;

      margin-top:
        5px;

      color:
        #171c18;

      font-size:
        24px;

    }


    .return-summary-stat.green strong {

      color:
        #256544;

    }


    .return-summary-stat.orange strong {

      color:
        #ad691c;

    }


    .return-summary-stat.red strong {

      color:
        #b73d37;

    }


    /* ==========================================
       KOLOM HEADERS
    ========================================== */

    .return-table-header {

      display:grid;

      grid-template-columns:
        minmax(150px, 1.5fr)
        90px
        1fr
        1fr
        1fr
        58px;

      align-items:center;

      gap:
        7px;

      padding:
        11px 14px;

      border-bottom:
        1px solid
        #ddd7cb;

      background:
        #f0ece4;

      color:
        #766d60;

      font-size:
        9px;

      font-weight:
        900;

      text-transform:
        uppercase;

      letter-spacing:
        .04em;

    }


    .return-table-header div:not(:first-child) {

      text-align:center;

    }


    /* ==========================================
       ARTIKEL
    ========================================== */

    .return-product-row {

      padding:
        13px 14px;

      border-bottom:
        1px solid
        #e4dfd6;

      background:
        white;

    }


    .return-product-grid {

      display:grid;

      grid-template-columns:
        minmax(150px, 1.5fr)
        90px
        1fr
        1fr
        1fr
        58px;

      align-items:center;

      gap:
        7px;

    }


    .return-product-info {

      min-width:0;

    }


    .return-product-info strong {

      display:block;

      color:
        #1d211e;

      font-size:
        14px;

    }


    .return-product-info span {

      display:block;

      margin-top:
        3px;

      color:
        #8a8275;

      font-size:
        10px;

    }


    .return-loaned {

      text-align:center;

      color:
        #554f45;

      font-size:
        16px;

      font-weight:
        850;

    }


    /* ==========================================
       COUNTERS
    ========================================== */

    .return-counter {

      text-align:center;

    }


    .return-counter-label {

      display:none;

    }


    .return-counter-value {

      display:block;

      margin-bottom:
        4px;

      font-size:
        17px;

      font-weight:
        900;

    }


    .return-counter.green
    .return-counter-value {

      color:
        #216140;

    }


    .return-counter.orange
    .return-counter-value {

      color:
        #c46d0a;

    }


    .return-counter.red
    .return-counter-value {

      color:
        #bd2f2c;

    }


    .return-stepper {

      display:grid;

      grid-template-columns:
        34px 34px 34px;

      justify-content:center;

      border:
        1px solid
        #ddd7cb;

      border-radius:
        9px;

      overflow:hidden;

      background:
        white;

    }


    .return-stepper button {

      height:
        34px;

      border:
        0;

      background:
        #faf9f5;

      color:
        #7a7266;

      font-size:
        18px;

    }


    .return-stepper button:first-child {

      border-right:
        1px solid
        #e5dfd6;

    }


    .return-stepper button:last-child {

      border-left:
        1px solid
        #e5dfd6;

    }


    .return-stepper b {

      display:grid;

      place-items:center;

      font-size:
        13px;

      background:
        white;

    }


    /* ==========================================
       STATUS
    ========================================== */

    .return-status {

      display:flex;

      justify-content:center;

      align-items:center;

    }


    .return-status-circle {

      width:
        36px;

      height:
        36px;

      border-radius:
        50%;

      display:grid;

      place-items:center;

      font-size:
        17px;

      font-weight:
        900;

    }


    .return-status-circle.done {

      background:
        #237047;

      color:
        white;

    }


    .return-status-circle.warning {

      background:
        #c77b13;

      color:
        white;

    }


    .return-status-circle.open {

      background:
        #e8e3da;

      color:
        #857c6d;

    }


    /* ==========================================
       OPMERKING
    ========================================== */

    .return-note-toggle {

      display:inline-block;

      margin-top:
        9px;

      padding:
        0;

      border:
        0;

      background:
        transparent;

      color:
        #8a8172;

      text-decoration:
        underline;

      font-size:
        10px;

      font-weight:
        750;

    }


    .return-note {

      width:
        100%;

      min-height:
        58px;

      margin-top:
        8px;

      border:
        1px solid
        #ddd7cb;

      border-radius:
        10px;

      background:
        #faf9f5;

      padding:
        9px 10px;

      font-size:
        11px;

    }


    /* ==========================================
       FOOTER
    ========================================== */

    .return-workspace-footer {

      display:grid;

      grid-template-columns:
        .65fr 1.35fr;

      gap:
        8px;

      padding:
        13px 14px;

      background:
        #f5f2eb;

    }


    .return-cancel {

      min-height:
        45px;

      border:
        1px solid
        #ddd7cb;

      border-radius:
        10px;

      background:
        white;

      color:
        #423e37;

      font-weight:
        850;

    }


    .return-save-main {

      min-height:
        45px;

      border:
        0;

      border-radius:
        10px;

      background:
        #194d38;

      color:
        white;

      font-weight:
        900;

    }


    /* ==========================================
       INFO BALK
    ========================================== */

    .return-help {

      margin:
        10px 14px 0;

      padding:
        8px 10px;

      border-radius:
        9px;

      background:
        #eee9df;

      color:
        #827969;

      font-size:
        9px;

    }


    /* ==========================================
       MOBIEL
    ========================================== */

    @media (
      max-width:700px
    ) {

      .return-workspace {

        margin:
          0 -6px;

        border-radius:
          14px;

      }


      .return-workspace-header {

        padding:
          13px 11px;

      }


      .return-header-top h2 {

        font-size:
          23px;

      }


      .return-all-good {

        min-height:
          37px;

        padding:
          0 9px;

        font-size:
          9px;

      }


      .return-summary-bar {

        grid-template-columns:
          repeat(
            2,
            1fr
          );

      }


      .return-summary-stat:nth-child(2) {

        border-right:
          0;

      }


      .return-summary-stat:nth-child(-n+2) {

        border-bottom:
          1px solid
          #e6e1d8;

      }


      .return-table-header {

        display:none;

      }


      .return-product-row {

        padding:
          12px 10px;

      }


      .return-product-grid {

        grid-template-columns:
          1fr;

        gap:
          9px;

      }


      .return-product-info {

        display:grid;

        grid-template-columns:
          1fr auto;

        align-items:end;

      }


      .return-product-info span {

        text-align:right;

      }


      .return-loaned {

        display:none;

      }


      .return-product-controls {

        display:grid;

        grid-template-columns:
          repeat(
            3,
            1fr
          );

        gap:
          5px;

      }


      .return-counter-label {

        display:block;

        margin-bottom:
          3px;

        color:
          #80776a;

        font-size:
          8px;

        font-weight:
          900;

        text-transform:
          uppercase;

      }


      .return-stepper {

        grid-template-columns:
          1fr 1fr 1fr;

      }


      .return-status {

        justify-content:
          flex-end;

        margin-top:
          -43px;

      }


      .return-status-circle {

        width:
          32px;

        height:
          32px;

      }


      .return-workspace-footer {

        position:sticky;

        bottom:0;

        z-index:5;

      }

    }
/* ==========================================
   EENVOUDIG RETOURSCHERM
========================================== */

.return-simple-workspace {

  background:#f7f5ef;

  border:
    1px solid
    #ded9ce;

  border-radius:16px;

  overflow:hidden;

  box-shadow:
    0 8px 24px
    rgba(
      35,
      30,
      22,
      .08
    );

}


.return-simple-header {

  padding:
    14px;

  background:#faf9f5;

  border-bottom:
    1px solid
    #ded9ce;

}


.return-simple-header span {

  display:block;

  color:#8c692f;

  font-size:8px;

  font-weight:900;

  letter-spacing:.08em;

}


.return-simple-header h2 {

  margin:
    2px 0 0;

  font-size:22px;

  color:#182019;

}


.return-simple-summary {

  display:grid;

  grid-template-columns:
    1fr 1fr;

  gap:6px;

  padding:10px;

  background:#f0ece4;

}


.return-simple-summary > div {

  padding:
    10px;

  border-radius:10px;

  background:white;

  text-align:center;

}


.return-simple-summary span {

  display:block;

  color:#80786c;

  font-size:8px;

  font-weight:900;

  text-transform:uppercase;

}


.return-simple-summary strong {

  display:block;

  margin-top:2px;

  color:#1a211b;

  font-size:22px;

}


.return-simple-list {

  background:white;

}


.return-simple-item {

  padding:
    11px;

  border-bottom:
    1px solid
    #e5e0d7;

  border-left:
    4px solid
    #d0cbc2;

}


.return-simple-item.good {

  border-left-color:
    #2f7449;

  background:#f9fcfa;

}


.return-simple-item.problem {

  border-left-color:
    #d99a3e;

  background:#fffaf3;

}


.return-simple-item-main {

  display:flex;

  justify-content:
    space-between;

  align-items:flex-start;

  gap:8px;

}


.return-simple-item-main strong {

  display:block;

  color:#202720;

  font-size:14px;

}


.return-simple-item-main span {

  display:block;

  margin-top:2px;

  color:#888074;

  font-size:9px;

}


.return-simple-status {

  padding:
    4px 7px;

  border-radius:999px;

  font-size:8px;

  font-weight:900;

  white-space:nowrap;

}


.return-simple-status.pending {

  background:#ece8df;

  color:#777064;

}


.return-simple-status.good {

  background:#e5f3e9;

  color:#2f7449;

}


.return-simple-status.problem {

  background:#f8ead5;

  color:#a36017;

}


.return-simple-actions {

  display:grid;

  grid-template-columns:
    1fr 1fr;

  gap:6px;

  margin-top:9px;

}


.return-good-button,
.return-problem-button {

  min-height:38px;

  border-radius:9px;

  font-size:10px;

  font-weight:900;

}


.return-good-button {

  border:
    1px solid
    #b9d6c2;

  background:#eff7f1;

  color:#2f7449;

}


.return-good-button.selected {

  background:#2f7449;

  color:white;

  border-color:#2f7449;

}


.return-problem-button {

  border:
    1px solid
    #e0c18e;

  background:#fff8ed;

  color:#9c611b;

}


.return-problem-button.selected {

  background:#d99a3e;

  color:white;

  border-color:#d99a3e;

}


.return-simple-footer {

  display:grid;

  grid-template-columns:
    .7fr 1.3fr;

  gap:6px;

  padding:10px;

  background:#f2eee6;

}


.return-simple-cancel,
.return-simple-save {

  min-height:43px;

  border-radius:10px;

  font-weight:900;

}


.return-simple-cancel {

  border:
    1px solid
    #d7d1c6;

  background:white;

  color:#514b42;

}


.return-simple-save {

  border:0;

  background:#194d38;

  color:white;

}


/* ==========================================
   PROBLEEM POPUP OVERLAY
========================================== */

.return-problem-overlay {

  position:fixed;

  inset:0;

  z-index:500;

  display:flex;

  align-items:flex-end;

  justify-content:center;

  padding:
    14px;

  background:
    rgba(
      12,
      18,
      13,
      .55
    );

  backdrop-filter:
    blur(3px);

}


/* ==========================================
   PROBLEEM POPUP
========================================== */

.return-problem-modal {

  width:100%;

  max-width:520px;

  max-height:
    88vh;

  overflow-y:auto;

  padding:
    14px;

  border-radius:
    18px;

  background:
    #f8f6f0;

  box-shadow:
    0 18px 50px
    rgba(
      0,
      0,
      0,
      .3
    );

}


.return-problem-modal-head {

  display:flex;

  justify-content:
    space-between;

  align-items:flex-start;

  gap:10px;

  padding-bottom:10px;

  border-bottom:
    1px solid
    #ded8ce;

}


.return-problem-modal-head span {

  display:block;

  color:#a15f18;

  font-size:8px;

  font-weight:900;

  letter-spacing:.08em;

}


.return-problem-modal-head h3 {

  margin:
    2px 0 0;

  color:#182019;

  font-size:20px;

}


.return-problem-modal-head small {

  display:block;

  margin-top:2px;

  color:#81796d;

  font-size:9px;

}


.return-problem-modal-head > button {

  width:34px;

  height:34px;

  border:0;

  border-radius:9px;

  background:#e8e2d8;

  color:#49443d;

  font-size:21px;

}


/* ==========================================
   GOED TERUG PREVIEW
========================================== */

.return-problem-good-preview {

  display:flex;

  justify-content:
    space-between;

  align-items:center;

  margin-top:10px;

  padding:
    9px 10px;

  border-radius:10px;

  background:#e5f3e9;

  color:#2f7449;

}


.return-problem-good-preview span {

  font-size:10px;

  font-weight:900;

}


.return-problem-good-preview strong {

  font-size:20px;

}


/* ==========================================
   PROBLEEM OPTIES
========================================== */

.return-problem-option {

  display:grid;

  grid-template-columns:
    1fr auto;

  align-items:center;

  gap:8px;

  margin-top:8px;

  padding:10px;

  border:
    1px solid
    #dfd9cf;

  border-radius:11px;

  background:white;

}


.return-problem-option strong {

  display:block;

  color:#282e29;

  font-size:11px;

}


.return-problem-option span {

  display:block;

  margin-top:2px;

  color:#8a8175;

  font-size:8px;

}


/* ==========================================
   POPUP STEPPER
========================================== */

.return-problem-stepper {

  display:grid;

  grid-template-columns:
    34px 40px 34px;

  overflow:hidden;

  border:
    1px solid
    #d8d2c8;

  border-radius:9px;

  background:white;

}


.return-problem-stepper button {

  height:34px;

  border:0;

  background:#f6f3ed;

  color:#5f584e;

  font-size:18px;

}


.return-problem-stepper button:first-child {

  border-right:
    1px solid
    #ded8ce;

}


.return-problem-stepper button:last-child {

  border-left:
    1px solid
    #ded8ce;

}


.return-problem-stepper strong {

  display:grid;

  place-items:center;

  font-size:13px;

}


/* ==========================================
   OPMERKING POPUP
========================================== */

.return-problem-modal label {

  display:block;

  margin-top:10px;

  color:#4d493f;

  font-size:9px;

  font-weight:900;

}


.return-problem-modal textarea {

  width:100%;

  min-height:74px;

  margin-top:5px;

  border:
    1px solid
    #d9d3c9;

  border-radius:10px;

  background:white;

  padding:9px;

  font-size:11px;

}


/* ==========================================
   POPUP ACTIES
========================================== */

.return-problem-actions {

  display:grid;

  grid-template-columns:
    .8fr 1.2fr;

  gap:6px;

  margin-top:10px;

}


.return-problem-cancel,
.return-problem-save {

  min-height:42px;

  border-radius:10px;

  font-size:10px;

  font-weight:900;

}


.return-problem-cancel {

  border:
    1px solid
    #d8d2c8;

  background:white;

  color:#595249;

}


.return-problem-save {

  border:0;

  background:#194d38;

  color:white;

}


/* ==========================================
   DESKTOP POPUP
========================================== */

@media (
  min-width:701px
) {

  .return-problem-overlay {

    align-items:center;

  }

}


/* ==========================================
   NIEUWE COMPACTE RETOURBEDIENING
========================================== */

.return-good-toggle {

  width:30px;
  height:30px;
  min-width:30px;

  padding:0;

  display:grid;
  place-items:center;

  border:
    2px solid
    #9ab6a2;

  border-radius:50%;

  background:white;

  color:white;

  font-size:15px;
  font-weight:900;

}


.return-good-toggle.selected {

  border-color:#2f7449;
  background:#2f7449;
  color:white;

}


.return-simple-actions {

  grid-template-columns:
    38px 1fr;

  align-items:center;

}


.return-problem-button {

  min-height:34px;

  border:
    1px solid
    #e0c18e;

  border-radius:9px;

  background:#fff8ed;
  color:#9c611b;

  font-size:9px;
  font-weight:900;

}


.return-problem-button.selected {

  background:#d99a3e;
  color:white;
  border-color:#d99a3e;

}


.return-validation {

  margin:9px 10px 0;
  padding:8px 10px;

  border-radius:9px;

  background:#fff0dc;
  color:#8b571a;

  font-size:9px;
  font-weight:850;
  line-height:1.35;

}


.return-problem-overlay.hidden {

  display:none !important;

}


/* ==========================================
   RETOURARCHIEF - READ ONLY
========================================== */

.return-archive-card {

  padding:12px;

  border:
    1px solid
    #d8d3c8;

  border-radius:14px;

  background:#f8f6f0;

}


.return-archive-head {

  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:8px;

}


.return-archive-head span {

  display:block;

  color:#8c692f;

  font-size:8px;
  font-weight:900;
  letter-spacing:.08em;

}


.return-archive-head h3 {

  margin:2px 0 0;

  color:#1d241e;
  font-size:18px;

}


.return-archive-head small {

  display:block;
  margin-top:2px;

  color:#7f786c;
  font-size:8px;

}


.return-archive-lock {

  width:32px;
  height:32px;

  display:grid;
  place-items:center;

  border-radius:50%;

  background:#e9e4d9;

}


.return-archive-list {

  margin-top:10px;

  border-top:
    1px solid
    #dfd9cf;

}


.return-archive-row {

  display:grid;
  grid-template-columns:1fr auto;
  gap:8px;

  padding:9px 0;

  border-bottom:
    1px solid
    #e5e0d7;

}


.return-archive-row strong {

  display:block;
  color:#202720;
  font-size:11px;

}


.return-archive-row small {

  display:block;
  margin-top:2px;
  color:#827a6f;
  font-size:8px;

}


.return-archive-values {

  display:flex;
  flex-wrap:wrap;
  justify-content:flex-end;
  gap:4px;

}


.return-archive-values span {

  padding:3px 6px;
  border-radius:999px;
  font-size:8px;
  font-weight:850;

}


.return-archive-values .ok {

  background:#e4f2e8;
  color:#2f7449;

}


.return-archive-values .bad {

  background:#f7e3dc;
  color:#a64b3c;

}


.return-archive-note {

  margin-top:10px;
  padding:8px;

  border-radius:9px;

  background:#ece8df;
  color:#71695d;

  font-size:8px;
  line-height:1.4;

}


.return-reopen-button {

  width:100%;
  min-height:38px;

  margin-top:8px;

  border:
    1px solid
    #cbbfA8;

  border-radius:9px;

  background:white;
  color:#6d5831;

  font-size:9px;
  font-weight:900;

}


/* ==========================================
   AANVRAGEN SWITCH
========================================== */

.admin-request-switch {

  display:grid;
  grid-template-columns:
    repeat(2, 1fr);

  gap:5px;

  margin-bottom:7px;

}


.admin-request-switch button {

  min-height:36px;

  border:
    1px solid
    #465047;

  border-radius:9px;

  background:#2d352e;
  color:#b9c0ba;

  font-size:8px;
  font-weight:900;

}


.admin-request-switch button.active {

  border-color:#b88a3e;
  background:#3b362b;
  color:#e2c47e;

}


/* ==========================================
   DASHBOARD KPI'S - 3 COMPACTE BLOKKEN
========================================== */

.admin-kpis {

  grid-template-columns:
    repeat(3, 1fr) !important;

  gap:6px !important;

}


.admin-kpi {

  min-height:64px !important;
  padding:8px !important;

}


.admin-kpi strong {

  font-size:22px !important;

}


.admin-kpi span {

  margin-top:2px !important;
  font-size:9px !important;

}


/* ==========================================
   GROOTHANDEL IN RAPPORTEN
========================================== */

.admin-wholesale-report-head {

  display:flex;
  align-items:center;
  justify-content:space-between;

  margin-bottom:6px;

}


.admin-wholesale-report-head span {

  color:#b9c0ba;
  font-size:9px;
  font-weight:850;

}


.admin-wholesale-report-head strong {

  min-width:28px;
  padding:4px 7px;

  border-radius:999px;

  background:#e7e3d8;
  color:#555;

  text-align:center;
  font-size:9px;

}


/* ==========================================
   ACTIE NODIG ARTIKELEN
========================================== */

.admin-problem.action-needed {

  border-left:
    4px solid
    #d16a4f;

}


.admin-problem-head {

  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:8px;

}


.admin-problem-head > span {

  padding:3px 6px;
  border-radius:999px;

  background:#f4ded7;
  color:#a34738;

  font-size:8px;
  font-weight:900;

}


.admin-problem-badges {

  display:flex;
  flex-wrap:wrap;
  gap:4px;

  margin-top:7px;

}


.admin-problem-badges b {

  margin:0 !important;
  padding:3px 6px;

  border-radius:999px;

  background:#f4ded7;
  color:#a34738 !important;

  font-size:8px !important;

}


.admin-problem-note {

  margin-top:7px;
  padding:7px;

  border-radius:8px;

  background:#f3efe6;
  color:#5f594f;

  font-size:8px;
  line-height:1.35;

}


.admin-problem-actions {

  display:grid;
  gap:5px;

  margin-top:7px;

}


.admin-problem-actions button {

  margin:0 !important;
  min-height:34px;

}


.problem-resolve.green {

  background:#2f7449 !important;

}


.problem-resolve.gold {

  background:#a9782c !important;

}


.problem-view {

  background:#59625a !important;

}


/* ==========================================
   VOORRAAD & CATALOGUSBEHEER
========================================== */

.admin-catalog-switch {

  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:5px;
  margin-bottom:7px;

}


.admin-catalog-switch button {

  min-height:34px;
  border:1px solid #465047;
  border-radius:9px;
  background:#2d352e;
  color:#b9c0ba;
  font-size:8px;
  font-weight:900;

}


.admin-catalog-switch button.active {

  border-color:#b88a3e;
  background:#3b362b;
  color:#e2c47e;

}


.admin-catalog-item {

  margin-top:6px;
  padding:9px;
  border:1px solid #d8d5cd;
  border-left:4px solid #5d7d64;
  border-radius:11px;
  background:white;
  color:#202722;

}


.admin-catalog-item.unavailable {

  border-left-color:#9b9b9b;
  background:#f1f0ed;

}


.admin-catalog-item.low {

  border-left-color:#d99a3e;

}


.admin-catalog-head {

  display:grid;
  grid-template-columns:1fr auto;
  align-items:start;
  gap:8px;

}


.admin-catalog-head strong {

  display:block;
  font-size:11px;

}


.admin-catalog-head small {

  display:block;
  margin-top:2px;
  color:#777;
  font-size:8px;

}


.admin-availability-toggle {

  min-height:28px;
  padding:0 8px;
  border-radius:999px;
  font-size:8px;
  font-weight:900;

}


.admin-availability-toggle.on {

  border:1px solid #afd0b7;
  background:#e5f3e9;
  color:#2f7449;

}


.admin-availability-toggle.off {

  border:1px solid #d3cec5;
  background:#e9e7e2;
  color:#6f6a62;

}


.admin-stock-warning {

  margin-top:7px;
  padding:6px 7px;
  border-radius:8px;
  background:#fff0dc;
  color:#8b571a;
  font-size:8px;
  font-weight:850;

}


.admin-stock-control {

  display:grid;
  grid-template-columns:32px 44px 32px;
  justify-content:start;
  align-items:center;
  margin-top:7px;
  overflow:hidden;
  width:max-content;
  border:1px solid #d8d2c8;
  border-radius:9px;
  background:white;

}


.admin-stock-control button {

  width:32px;
  height:32px;
  border:0;
  background:#f5f2ec;
  color:#595249;
  font-size:18px;

}


.admin-stock-control strong {

  display:grid;
  place-items:center;
  height:32px;
  border-left:1px solid #e0dbd2;
  border-right:1px solid #e0dbd2;
  font-size:12px;

}
  `;


  document.head.appendChild(
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
