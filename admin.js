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

let adminProductMaster = [];

let adminProductMasterLoaded =
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
            klant,
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

              <div class="admin-stock-edit-wrap">

                <button
                  type="button"
                  class="admin-stock-edit-toggle"
                  onclick="openAdminStockEditor('${product.id}')"
                >
                  Voorraad aanpassen
                </button>

                <div
                  id="adminStockEditor-${product.id}"
                  class="admin-stock-editor hidden"
                >

                  <div class="admin-stock-editor-label">

                    <span>
                      Fysieke voorraad
                    </span>

                    ${
                      category === "pos"
                        ? `
                            <small>
                              Beschikbaar: ${availableStock}
                            </small>
                          `
                        : ""
                    }

                  </div>

                  <div class="admin-stock-control">

                    <button
                      type="button"
                      aria-label="Voorraad verlagen"
                      onclick="adjustAdminStockDraft('${product.id}', -1)"
                    >
                      −
                    </button>

                    <input
                      id="adminStockInput-${product.id}"
                      class="admin-stock-input"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      value="${physicalStock}"
                      aria-label="Nieuwe fysieke voorraad"
                      oninput="this.value=this.value.replace(/[^0-9]/g,'')"
                    >

                    <button
                      type="button"
                      aria-label="Voorraad verhogen"
                      onclick="adjustAdminStockDraft('${product.id}', 1)"
                    >
                      +
                    </button>

                  </div>

                  <div class="admin-stock-editor-actions">

                    <button
                      type="button"
                      class="admin-stock-cancel"
                      onclick="cancelAdminStockEditor('${product.id}')"
                    >
                      Annuleren
                    </button>

                    <button
                      type="button"
                      class="admin-stock-save"
                      onclick="saveAdminStockEditor('${product.id}')"
                    >
                      Opslaan
                    </button>

                  </div>

                </div>

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



function openAdminStockEditor(
  productId
) {

  document
    .querySelectorAll(
      ".admin-stock-editor"
    )
    .forEach(
      editor => {

        if (
          editor.id !==
          `adminStockEditor-${productId}`
        ) {

          editor.classList.add(
            "hidden"
          );

        }

      }
    );


  const editor =
    document.getElementById(
      `adminStockEditor-${productId}`
    );


  if (
    !editor
  ) {

    return;

  }


  editor.classList.toggle(
    "hidden"
  );


  if (
    !editor.classList.contains(
      "hidden"
    )
  ) {

    const input =
      document.getElementById(
        `adminStockInput-${productId}`
      );


    input?.focus();

    input?.select();

  }

}


function adjustAdminStockDraft(
  productId,
  amount
) {

  const input =
    document.getElementById(
      `adminStockInput-${productId}`
    );


  if (
    !input
  ) {

    return;

  }


  const current =
    Math.max(
      0,
      Math.floor(
        Number(
          input.value ||
          0
        )
      )
    );


  input.value =
    Math.max(
      0,
      current +
      Number(
        amount ||
        0
      )
    );

}


function cancelAdminStockEditor(
  productId
) {

  const product =
    adminProducts
      .find(
        item =>
          String(
            item.id
          ) ===
          String(
            productId
          )
      );


  const input =
    document.getElementById(
      `adminStockInput-${productId}`
    );


  if (
    input &&
    product
  ) {

    input.value =
      Math.max(
        0,
        Number(
          product.voorraad ||
          0
        )
      );

  }


  document
    .getElementById(
      `adminStockEditor-${productId}`
    )
    ?.classList
    .add(
      "hidden"
    );

}


async function saveAdminStockEditor(
  productId
) {

  const input =
    document.getElementById(
      `adminStockInput-${productId}`
    );


  if (
    !input
  ) {

    return;

  }


  const rawValue =
    String(
      input.value ??
      ""
    )
      .trim();


  if (
    rawValue === ""
    ||
    !Number.isFinite(
      Number(
        rawValue
      )
    )
  ) {

    alert(
      "Vul een geldig voorraadgetal in."
    );

    return;

  }


  const next =
    Math.max(
      0,
      Math.floor(
        Number(
          rawValue
        )
      )
    );


  await setAdminProductStock(
    productId,
    next
  );

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



async function setAdminProductStock(
  productId,
  value
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


  const numericValue =
    Number(
      value
    );


  if (
    !Number.isFinite(
      numericValue
    )
  ) {

    alert(
      "Vul een geldig voorraadgetal in."
    );

    renderAdminProductManagement();

    return;

  }


  const next =
    Math.max(
      0,
      Math.floor(
        numericValue
      )
    );


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

    renderAdminProductManagement();

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


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });

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


function getEventCustomerData(
  order
) {

  if (
    !order?.klant
  ) {
    return {};
  }

  if (
    typeof order.klant ===
    "object"
  ) {
    return order.klant;
  }

  try {
    return JSON.parse(
      order.klant
    );
  }
  catch (
    error
  ) {
    return {
      company:
        String(order.klant)
    };
  }

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

            <div
              class="event-delivery-item event-delivery-check-item"
            >

              <div class="event-delivery-check-main">

                <div>

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

                </div>

                <span class="event-delivery-check-status">
                  Nog te leveren
                </span>

              </div>

              <input
                type="hidden"
                class="event-delivery-state"
                data-product="${adminEscapeHtml(item.product_naam || "")}"
                data-category="${adminEscapeHtml(item.categorie || "")}"
                data-amount="${Number(item.aantal || 0)}"
                data-delivered="false"
                value="Niet geleverd"
              >

              <button
                type="button"
                class="event-delivery-check-toggle"
                onclick="toggleEventDeliveryItem(this)"
              >
                <span>✓</span>
                Geleverd
              </button>

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


function toggleEventDeliveryItem(
  button
) {

  const item =
    button?.closest(
      ".event-delivery-check-item"
    );


  const input =
    item?.querySelector(
      ".event-delivery-state"
    );


  const status =
    item?.querySelector(
      ".event-delivery-check-status"
    );


  if (
    !item ||
    !input ||
    !status
  ) {

    return;

  }


  const next =
    input.dataset.delivered !==
    "true";


  input.dataset.delivered =
    next
      ? "true"
      : "false";


  input.value =
    next
      ? "Geleverd"
      : "Niet geleverd";


  item.classList.toggle(
    "delivered",
    next
  );


  button.classList.toggle(
    "selected",
    next
  );


  status.textContent =
    next
      ? "Geleverd"
      : "Nog te leveren";

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

  const deliveryInputs =
    Array
      .from(
        document.querySelectorAll(
          ".event-delivery-state"
        )
      );


  const notDelivered =
    deliveryInputs
      .find(
        input =>
          input.dataset.delivered !==
          "true"
      );


  if (
    notDelivered
  ) {

    alert(
      "Vink eerst elk geleverd artikel af."
    );

    notDelivered
      .closest(
        ".event-delivery-check-item"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "center"
      });

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

  const customer =
    getEventCustomerData(
      order
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
    klant_bedrijfsnaam:
      customer.company || "",
    klant_naam:
      customer.contact || "",
    klant_telefoon:
      customer.phone || "",
    klant_email:
      customer.email || "",
    evenement_locatie:
      customer.location || "",
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


function downloadEventDeliveryProofPdfLegacy(
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

  const order =
    adminOrders.find(
      item =>
        item.id === orderId
    );

  const customer =
    getEventCustomerData(
      order
    );

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
          `${Number(item.aantal || 0)} x ${item.product_naam || ""} - levering: ${item.staat || "Geleverd"}`;

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


let eventDeliveryLogoDataCache =
  "data:image/png;base64,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";


function loadEventDeliveryLogoData() {

  return new Promise(
    resolve => {

      const image =
        new Image();

      image.onload =
        () => {

          try {

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            image.naturalWidth;

          canvas.height =
            image.naturalHeight;

          canvas
            .getContext("2d")
            .drawImage(
              image,
              0,
              0
            );

          eventDeliveryLogoDataCache =
            canvas.toDataURL("image/png");

          resolve(
            eventDeliveryLogoDataCache
          );

          }

          catch (
            error
          ) {

            console.warn(
              "Achel-logo kon niet in de PDF worden voorbereid:",
              error
            );

            resolve(null);

          }

        };

      image.onerror =
        () => resolve(null);

      image.src =
        "./achel-logo.png";

    }
  );

}


loadEventDeliveryLogoData();


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
  } = window.jspdf;

  const pdf =
    new jsPDF({
      unit:
        "mm",
      format:
        "a4"
    });

  const snapshot =
    proof.snapshot || {};

  const order =
    adminOrders.find(
      item =>
        item.id === orderId
    );

  const customer =
    getEventCustomerData(
      order
    );

  const colors = {
    ink: [42, 36, 32],
    soft: [107, 95, 80],
    gold: [169, 124, 61],
    line: [229, 220, 199],
    green: [47, 74, 60],
    cream: [250, 246, 238]
  };

  const paintPage =
    () => {
      pdf.setFillColor(...colors.cream);
      pdf.rect(0, 0, 210, 297, "F");
    };

  paintPage();

  const logoData =
    eventDeliveryLogoDataCache;

  if (
    logoData
  ) {

    try {

      pdf.addImage(
        logoData,
        "PNG",
        20,
        12,
        24,
        24,
        undefined,
        "FAST"
      );

    }

    catch (
      error
    ) {

      console.warn(
        "Achel-logo kon niet aan de PDF worden toegevoegd:",
        error
      );

    }

  }

  pdf.setTextColor(...colors.soft);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    "Bewijs van ontvangst",
    190,
    20,
    { align: "right" }
  );

  pdf.setTextColor(...colors.ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(
    String(snapshot.aanvraag || "-"),
    190,
    25,
    { align: "right" }
  );

  pdf.setDrawColor(...colors.gold);
  pdf.setLineWidth(0.6);
  pdf.line(20, 40, 190, 40);

  pdf.setTextColor(...colors.ink);
  pdf.setFont("times", "normal");
  pdf.setFontSize(21);
  pdf.text(
    "Bewijs van ontvangst",
    20,
    54
  );
  pdf.text(
    "evenement materialen",
    20,
    63
  );

  let y = 79;

  const sectionTitle =
    title => {
      pdf.setTextColor(...colors.green);
      pdf.setFont("times", "normal");
      pdf.setFontSize(13);
      pdf.text(title, 20, y);
      y += 4;
      pdf.setDrawColor(...colors.line);
      pdf.setLineWidth(0.25);
      pdf.line(20, y, 190, y);
      y += 7;
    };

  const addLine =
    (
      label,
      value
    ) => {
      pdf.setTextColor(...colors.soft);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(label, 20, y);
      pdf.setTextColor(...colors.ink);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        String(value || "-"),
        63,
        y,
        { maxWidth: 125 }
      );
      y += 6;
    };

  sectionTitle("Klantgegevens");
  addLine("Bedrijfsnaam", snapshot.klant_bedrijfsnaam || customer.company);
  addLine("Contactpersoon", snapshot.klant_naam || customer.contact);
  addLine("Telefoonnummer", snapshot.klant_telefoon || customer.phone);
  addLine("E-mailadres", snapshot.klant_email || customer.email);
  addLine("Locatie evenement", snapshot.evenement_locatie || customer.location);

  y += 5;
  sectionTitle("Aanvraag");
  addLine("Aanvraag", snapshot.aanvraag);
  addLine("Evenement", snapshot.evenement);
  addLine(
    "Periode",
    `${snapshot.periode_vanaf || ""} t/m ${snapshot.periode_tot || ""}`
  );
  addLine("Vertegenwoordiger", snapshot.vertegenwoordiger);
  addLine("Ontvangen door", proof.signer_name);
  addLine(
    "Ondertekend op",
    adminFormatDateTime(
      proof.signed_at
    )
  );

  y += 5;
  sectionTitle("Geleverde artikelen");

  pdf.setTextColor(...colors.soft);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Aantal", 20, y);
  pdf.text("Artikel", 38, y);
  pdf.text(
    "Levering",
    190,
    y,
    { align: "right" }
  );
  y += 3;
  pdf.line(20, y, 190, y);
  y += 7;

  (snapshot.items || [])
    .forEach(
      item => {

        const itemLines =
          pdf.splitTextToSize(
            String(item.product_naam || ""),
            105
          );

        const rowHeight =
          Math.max(
            8,
            itemLines.length * 4.5 + 3
          );

        if (
          y + rowHeight > 238
        ) {
          pdf.addPage();
          paintPage();
          y = 22;
        }

        pdf.setTextColor(...colors.ink);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(
          String(Number(item.aantal || 0)),
          20,
          y
        );
        pdf.text(itemLines, 38, y);

        pdf.setFillColor(231, 237, 231);
        pdf.roundedRect(
          164,
          y - 4,
          26,
          6,
          0.8,
          0.8,
          "F"
        );
        pdf.setTextColor(...colors.green);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.text(
          String(item.staat || "Geleverd"),
          177,
          y,
          { align: "center" }
        );

        y += rowHeight;
        pdf.setDrawColor(...colors.line);
        pdf.line(20, y - 3, 190, y - 3);

      }
    );

  y += 5;

  if (
    y > 238
  ) {
    pdf.addPage();
    paintPage();
    y = 22;
  }

  sectionTitle("Handtekening ontvanger");

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(
    20,
    y,
    170,
    32,
    0.8,
    0.8,
    "FD"
  );

  if (
    proof.signature_data
  ) {

    try {

      pdf.addImage(
        proof.signature_data,
        "PNG",
        24,
        y + 3,
        66,
        25,
        undefined,
        "FAST"
      );

    }

    catch (
      error
    ) {

      console.warn(
        "Handtekening kon niet aan de PDF worden toegevoegd:",
        error
      );

    }

  }

  y += 38;
  pdf.setTextColor(...colors.soft);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    `Getekend door ${proof.signer_name || "-"} op ${adminFormatDateTime(proof.signed_at)}`,
    20,
    y
  );

  pdf.setDrawColor(...colors.line);
  pdf.line(20, 278, 190, 278);
  pdf.setTextColor(...colors.soft);
  pdf.setFontSize(7);
  pdf.text("Achelse Kluis", 20, 284);
  pdf.text(
    `Bewijshash: ${proof.proof_hash || "-"}`,
    190,
    284,
    {
      align: "right",
      maxWidth: 110
    }
  );

  try {

    pdf.save(
      `Achel_uitleenbewijs_${safeFilename(snapshot.evenement || orderId)}.pdf`
    );

  }

  catch (
    error
  ) {

    console.error(
      "PDF-download mislukt:",
      error
    );

    alert(
      "De PDF kon niet worden gedownload. Sluit de app volledig en probeer opnieuw."
    );

  }

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


/* ============================================================
   PRODUCTMASTER - DOUANO
   Alleen laden wanneer een export deze nodig heeft.
============================================================ */

async function loadAdminProductMaster(
  force = false
) {

  if (
    adminProductMasterLoaded
    &&
    !force
  ) {

    return adminProductMaster;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "achel_product_master"
      )
      .select(`
        douano_code,
        app_name,
        douano_name,
        app_category,
        active_free_beer,
        active_wholesale
      `);


  if (
    error
  ) {

    throw error;

  }


  adminProductMaster =
    data || [];


  adminProductMasterLoaded =
    true;


  return adminProductMaster;

}


function getAdminProductMasterForSku(
  sku
) {

  const normalized =
    String(
      sku || ""
    )
      .trim()
      .toLowerCase();


  if (
    !normalized
  ) {

    return null;

  }


  return adminProductMaster
    .find(
      product =>
        String(
          product.app_name || ""
        )
          .trim()
          .toLowerCase()
        ===
        normalized
    ) || null;

}


/* ===============================
   GRATIS BIER EXCEL
================================ */

async function exportAdminFreeBeerExcel() {

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


  try {

    await loadAdminProductMaster();

  }

  catch (
    error
  ) {

    console.error(
      "DOUANO PRODUCTMASTER FOUT:",
      error
    );


    alert(
      "De Douano-productcodes konden niet worden geladen.\n\n" +
      adminReadableError(
        error
      )
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


          const product =
            getAdminProductMasterForSku(
              row.sku
            );


          const freeBeerDate =
            row.datum
              ? new Date(
                  `${row.datum}T00:00:00`
                )
              : null;


          return {

            "Datum":
              row.datum ||
              "",

            "Maand":
              freeBeerDate &&
              !Number.isNaN(
                freeBeerDate.getTime()
              )
                ? freeBeerDate
                    .toLocaleDateString(
                      "nl-BE",
                      {
                        month:
                          "long"
                      }
                    )
                : "",

            "Jaar":
              freeBeerDate &&
              !Number.isNaN(
                freeBeerDate.getTime()
              )
                ? freeBeerDate
                    .getFullYear()
                : "",

            "Douano-code":
              product?.douano_code ||
              "NIET GEKOPPELD",

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
            "Datum",
            "Maand",
            "Jaar",
            "Douano-code",
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
        14
    },

    {
      wch:
        10
    },

    {
      wch:
        14
    },

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


async function exportCentralWholesaleExcel() {

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


  try {

    await loadAdminProductMaster();

  }

  catch (
    error
  ) {

    console.error(
      "DOUANO PRODUCTMASTER FOUT:",
      error
    );


    alert(
      "De Douano-productcodes konden niet worden geladen.\n\n" +
      adminReadableError(
        error
      )
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

              const product =
                getAdminProductMasterForSku(
                  item.product_naam
                );


              rows.push({

                "Aanvraagdatum":
                  formatExcelDate(
                    order.created_at
                  ),

                "Douano-code":
                  product?.douano_code ||
                  "NIET GEKOPPELD",

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

async function exportWholesaleReportExcel() {

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


  try {

    await loadAdminProductMaster();

  }

  catch (
    error
  ) {

    console.error(
      "DOUANO PRODUCTMASTER FOUT:",
      error
    );


    alert(
      "De Douano-productcodes konden niet worden geladen.\n\n" +
      adminReadableError(
        error
      )
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

              const product =
                getAdminProductMasterForSku(
                  item.product_naam
                );


              rows.push({

                "Aanvraagdatum":
                  formatExcelDate(
                    order.created_at
                  ),

                "Douano-code":
                  product?.douano_code ||
                  "NIET GEKOPPELD",

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

      position:static;

      top:auto;

      z-index:auto;

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


    /* ============================================================
       ACHEL HOME THEME — ADMIN OVERRIDES
       Alleen vormgeving. Geen functionele logica.
    ============================================================ */

    .admin-shell {
      color:#f6f0e3;
    }

    .admin-head {
      background:
        radial-gradient(circle at 90% 8%, rgba(201,155,67,.16), transparent 34%),
        linear-gradient(145deg,#202a22,#121813);
      border:1px solid rgba(201,155,67,.30);
      border-radius:18px;
      box-shadow:0 12px 30px rgba(0,0,0,.24);
    }

    .admin-head span,
    .admin-page-title span,
    .admin-block-title span {
      color:#c99b43;
    }

    .admin-head strong,
    .admin-page-title strong,
    .admin-block-title strong {
      color:#fff;
    }

    .admin-tabs,
    .admin-request-switch,
    .admin-catalog-switch {
      background:rgba(255,255,255,.035);
      border:1px solid rgba(201,155,67,.18);
    }

    .admin-tabs button,
    .admin-request-switch button,
    .admin-catalog-switch button {
      color:rgba(246,240,227,.48);
      background:transparent;
    }

    .admin-tabs button.active,
    .admin-request-switch button.active,
    .admin-catalog-switch button.active {
      color:#e0b85f;
      background:
        linear-gradient(
          145deg,
          rgba(201,155,67,.18),
          rgba(201,155,67,.07)
        );
      box-shadow:
        inset 0 0 0 1px
        rgba(201,155,67,.20);
    }

    .admin-block,
    .admin-panel,
    .admin-report-folder,
    .admin-report-central-filters,
    .admin-freebeer-filter-card,
    .admin-freebeer-card,
    .admin-material-card,
    .admin-problem,
    .admin-catalog-item,
    .admin-order-card,
    .admin-wholesale {
      background:
        radial-gradient(circle at 100% 0%, rgba(201,155,67,.07), transparent 32%),
        linear-gradient(145deg,#20271f,#151a15);
      border:1px solid rgba(201,155,67,.24);
      color:#f6f0e3;
      box-shadow:0 10px 24px rgba(0,0,0,.18);
    }

    .admin-panel > summary,
    .admin-report-folder > summary,
    .admin-freebeer-card > summary,
    .admin-wholesale > summary {
      background:rgba(255,255,255,.025);
      color:#fff;
    }

    .admin-row,
    .admin-attention,
    .admin-kpi {
      background:rgba(255,255,255,.045);
      border:1px solid rgba(201,155,67,.18);
      color:#f6f0e3;
    }

    .admin-row b,
    .admin-row strong,
    .admin-attention strong,
    .admin-kpi strong {
      color:#fff;
    }

    .admin-row small,
    .admin-attention span,
    .admin-kpi span,
    .admin-material-head small,
    .admin-problem small,
    .admin-catalog-item small,
    .admin-order-card small {
      color:rgba(246,240,227,.58);
    }

    .admin-row > i,
    .admin-attention > i {
      color:#e0b85f;
    }

    .admin-row > strong,
    .admin-count,
    .admin-badge,
    .admin-freebeer-card-side b {
      background:rgba(201,155,67,.13);
      border:1px solid rgba(201,155,67,.18);
      color:#e0b85f;
    }

    .admin-searchbar input,
    .admin-filters input,
    .admin-filters select,
    .admin-report-central-filters input,
    .admin-report-central-filters select,
    .admin-freebeer-filter-card input,
    .admin-freebeer-filter-card select,
    .admin-catalog-item input,
    .admin-catalog-item select {
      background:rgba(255,255,255,.055);
      border:1px solid rgba(201,155,67,.24);
      color:#fff;
    }

    .admin-searchbar input::placeholder,
    .admin-freebeer-filter-card input::placeholder {
      color:rgba(246,240,227,.32);
    }

    .admin-searchbar button,
    .admin-secondary,
    .problem-view {
      background:rgba(255,255,255,.045);
      border:1px solid rgba(201,155,67,.24);
      color:#e0b85f;
    }

    .admin-primary,
    .admin-export,
    .admin-material-card > button,
    .admin-problem button:not(.problem-view),
    .problem-resolve.gold {
      background:linear-gradient(180deg,#b98936,#8d6427);
      border:1px solid rgba(235,190,97,.28);
      color:#fff;
      box-shadow:0 7px 18px rgba(91,61,18,.28);
    }

    .problem-resolve.green {
      background:linear-gradient(180deg,#387d51,#285f3d);
      color:#fff;
    }

    .admin-stock-intro,
    .admin-clear,
    .admin-stock-warning,
    .admin-problem-note {
      background:rgba(255,255,255,.04);
      border:1px solid rgba(201,155,67,.15);
      color:rgba(246,240,227,.70);
    }

    .admin-clear b,
    .admin-material-head strong,
    .admin-material-line strong,
    .admin-problem strong,
    .admin-order-card > strong {
      color:#fff;
    }

    .admin-catalog-item strong {
      color:#202722;
    }

    .admin-material-line {
      border-top:1px solid rgba(255,255,255,.07);
      color:rgba(246,240,227,.66);
    }

    .admin-material-line .ok {
      color:#91dbaa;
    }

    .admin-material-line .bad,
    .admin-problem b {
      color:#e69b9b;
    }

    .admin-availability-toggle.on {
      background:rgba(66,136,88,.17);
      border:1px solid rgba(97,181,122,.24);
      color:#91dbaa;
    }

    .admin-availability-toggle.off {
      background:rgba(151,67,67,.18);
      border:1px solid rgba(197,94,94,.24);
      color:#e49b9b;
    }

    .admin-stock-control {
      display:grid;
      grid-template-columns:52px 130px 52px;
      align-items:center;
      justify-content:start;
      width:max-content;
      max-width:100%;
      margin-top:10px;
      overflow:hidden;

      background:#f7f4ee;
      border:1px solid #d8d2c8;
      border-radius:12px;
    }

    .admin-stock-control button {
      width:52px;
      height:50px;
      padding:0;
      border:0;
      border-radius:0;

      background:#f3efe7;
      color:#4f493f;

      font-size:22px;
      font-weight:700;
    }

    .admin-stock-control button:first-child {
      border-right:1px solid #d8d2c8;
    }

    .admin-stock-control button:last-child {
      border-left:1px solid #d8d2c8;
    }

    .admin-stock-control button:active {
      background:#e9e1d4;
    }

    .admin-detail-row {
      border-bottom:1px solid rgba(255,255,255,.07);
    }

    .admin-detail-row span {
      color:rgba(246,240,227,.52);
    }

    .admin-detail-row strong {
      color:#fff;
    }

    .admin-timeline-row strong {
      color:#fff;
    }

    .admin-timeline-row small {
      color:rgba(246,240,227,.50);
    }

    .admin-timeline-row i {
      background:rgba(255,255,255,.12);
      border-color:rgba(201,155,67,.18);
    }

    .admin-timeline-row.active i {
      background:#c99b43;
      border-color:#c99b43;
    }

    .admin-freebeer-item,
    .admin-freebeer-rep,
    .event-delivery-item {
      background:rgba(255,255,255,.04);
      border-color:rgba(201,155,67,.16);
      color:#f6f0e3;
    }

    .admin-freebeer-item strong,
    .admin-freebeer-rep strong,
    .event-delivery-item strong {
      color:#fff;
    }

    .admin-freebeer-item small,
    .admin-freebeer-rep span,
    .event-delivery-item small {
      color:rgba(246,240,227,.54);
    }

    .event-delivery-modal,
    .return-problem-modal {
      background:
        radial-gradient(circle at 100% 0%,rgba(201,155,67,.10),transparent 33%),
        linear-gradient(145deg,#20271f,#151a15);
      border:1px solid rgba(201,155,67,.27);
      color:#f6f0e3;
      box-shadow:0 18px 50px rgba(0,0,0,.38);
    }

    .return-problem-modal-head h3,
    .event-delivery-modal h3 {
      color:#fff;
    }

    .return-problem-modal-head span {
      color:#c99b43;
    }

    .return-problem-modal-head small {
      color:rgba(246,240,227,.55);
    }

    .return-problem-option,
    .return-problem-good-preview {
      background:rgba(255,255,255,.045);
      border-color:rgba(201,155,67,.17);
    }

    .return-problem-option strong,
    .return-problem-good-preview strong {
      color:#fff;
    }

    .return-problem-option span,
    .return-problem-good-preview span {
      color:rgba(246,240,227,.55);
    }

    .return-problem-stepper button {
      background:rgba(255,255,255,.055);
      border-color:rgba(201,155,67,.20);
      color:#e0b85f;
    }

    .return-problem-stepper strong {
      color:#fff;
    }

    .return-problem-save {
      background:linear-gradient(180deg,#b98936,#8d6427);
      color:#fff;
    }

    .return-problem-cancel {
      background:rgba(255,255,255,.045);
      border:1px solid rgba(201,155,67,.22);
      color:#e0b85f;
    }



    .admin-stock-control .admin-stock-input {
      display:block !important;
      width:130px !important;
      min-width:130px !important;
      max-width:130px !important;
      height:50px !important;
      min-height:50px !important;
      margin:0 !important;
      padding:0 12px !important;

      border:0 !important;
      border-radius:0 !important;

      background:#ffffff !important;
      color:#202722 !important;

      text-align:center !important;
      text-align-last:center !important;
      font-size:20px !important;
      font-weight:900 !important;
      line-height:normal !important;
      box-sizing:border-box !important;

      box-shadow:none !important;
      outline:none !important;

      -moz-appearance:textfield;
    }

    .admin-stock-control .admin-stock-input::-webkit-outer-spin-button,
    .admin-stock-control .admin-stock-input::-webkit-inner-spin-button {
      margin:0;
      -webkit-appearance:none;
    }



    /* ==========================================
       VOORRAADEDITOR - COMPACT & ALLEEN OP KLIK
    ========================================== */

    .admin-stock-edit-wrap {
      margin-top:8px;
    }

    .admin-stock-edit-toggle {
      width:auto;
      min-height:30px;
      padding:0 10px;

      border:1px solid #d8d2c8;
      border-radius:999px;

      background:#f7f4ee;
      color:#6f624d;

      font-size:9px;
      font-weight:850;
    }

    .admin-stock-edit-toggle:active {
      background:#eee8dc;
    }

    .admin-stock-editor {
      margin-top:8px;
      padding:9px;

      border:1px solid #ddd6ca;
      border-radius:11px;

      background:#f7f4ee;
    }

    .admin-stock-editor-label {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      margin-bottom:7px;
    }

    .admin-stock-editor-label span {
      color:#5f5a51;
      font-size:9px;
      font-weight:900;
    }

    .admin-stock-editor-label small {
      color:#8b857a !important;
      font-size:8px !important;
    }

    .admin-stock-control {
      display:grid;
      grid-template-columns:38px minmax(78px, 96px) 38px;
      width:max-content;
      max-width:100%;

      overflow:hidden;

      border:1px solid #d7d0c4;
      border-radius:10px;

      background:#fff;
    }

    .admin-stock-control button {
      width:38px;
      height:38px;
      padding:0;

      border:0;
      border-radius:0;

      background:#f3efe7;
      color:#5c554b;

      font-size:18px;
      font-weight:800;
    }

    .admin-stock-control button:first-child {
      border-right:1px solid #ddd6ca;
    }

    .admin-stock-control button:last-child {
      border-left:1px solid #ddd6ca;
    }

    .admin-stock-control .admin-stock-input {
      width:100% !important;
      min-width:78px !important;
      max-width:96px !important;
      height:38px !important;
      min-height:38px !important;
      margin:0 !important;
      padding:0 6px !important;

      border:0 !important;
      border-radius:0 !important;

      background:#fff !important;
      color:#202722 !important;

      text-align:center !important;
      font-size:16px !important;
      font-weight:900 !important;

      box-sizing:border-box !important;
      box-shadow:none !important;
      outline:none !important;

      -moz-appearance:textfield;
    }

    .admin-stock-control .admin-stock-input::-webkit-outer-spin-button,
    .admin-stock-control .admin-stock-input::-webkit-inner-spin-button {
      margin:0;
      -webkit-appearance:none;
    }

    .admin-stock-editor-actions {
      display:flex;
      justify-content:flex-end;
      gap:6px;
      margin-top:8px;
    }

    .admin-stock-editor-actions button {
      min-height:30px;
      padding:0 10px;

      border-radius:999px;

      font-size:9px;
      font-weight:900;
    }

    .admin-stock-cancel {
      border:1px solid #d8d2c8;
      background:#fff;
      color:#6d675d;
    }

    .admin-stock-save {
      border:1px solid #8c692f;
      background:#8c692f;
      color:#fff;
    }



    /* Voorraadinput: volledige getal exact vanuit het midden tonen */
    .admin-stock-control .admin-stock-input {
      width:96px !important;
      min-width:96px !important;
      max-width:96px !important;
      padding-left:4px !important;
      padding-right:4px !important;
      text-align:center !important;
      text-indent:0 !important;
      direction:ltr !important;
      font-variant-numeric:tabular-nums;
    }



    /* Voorraadinput iOS: volledig getal exact gecentreerd */
    .admin-stock-control {
      grid-template-columns:
        38px 116px 38px !important;
    }

    .admin-stock-control .admin-stock-input {
      display:block !important;

      width:116px !important;
      min-width:116px !important;
      max-width:116px !important;

      height:38px !important;
      min-height:38px !important;

      margin:0 !important;
      padding:0 8px !important;

      border:0 !important;
      border-radius:0 !important;

      background:#ffffff !important;
      color:#202722 !important;

      text-align:center !important;
      text-align-last:center !important;
      text-indent:0 !important;
      direction:ltr !important;

      font-size:17px !important;
      font-weight:900 !important;
      line-height:38px !important;
      letter-spacing:0 !important;
      font-variant-numeric:tabular-nums;

      box-sizing:border-box !important;
      box-shadow:none !important;
      outline:none !important;
      overflow:visible !important;

      -webkit-appearance:none !important;
      appearance:none !important;
    }



    /* ============================================================
       EVENT LEVERING - EENVOUDIG AFVINKEN
    ============================================================ */

    .event-delivery-check-item {
      padding:10px !important;
    }

    .event-delivery-check-main {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:10px;
    }

    .event-delivery-check-main > div {
      min-width:0;
    }

    .event-delivery-check-main strong {
      display:block;
    }

    .event-delivery-check-main small {
      display:block;
      margin-top:2px;
    }

    .event-delivery-check-status {
      flex:0 0 auto;
      padding:4px 8px;
      border-radius:999px;
      background:rgba(201,155,67,.10);
      color:#d8b36e;
      font-size:9px;
      font-weight:900;
      white-space:nowrap;
    }

    .event-delivery-check-item.delivered {
      border-left:4px solid #4d9a65 !important;
      background:rgba(58,116,76,.12) !important;
    }

    .event-delivery-check-item.delivered .event-delivery-check-status {
      background:rgba(66,136,88,.18);
      color:#91dbaa;
    }

    .event-delivery-check-toggle {
      width:100%;
      min-height:42px;
      margin-top:9px;
      border:1px solid rgba(201,155,67,.22);
      border-radius:10px;
      background:rgba(255,255,255,.045);
      color:rgba(246,240,227,.72);
      font-size:10px;
      font-weight:900;
    }

    .event-delivery-check-toggle span {
      display:inline-grid;
      place-items:center;
      width:24px;
      height:24px;
      margin-right:7px;
      border:1px solid rgba(201,155,67,.28);
      border-radius:50%;
      color:transparent;
      vertical-align:middle;
    }

    .event-delivery-check-toggle.selected {
      border-color:rgba(87,167,111,.35);
      background:rgba(59,128,81,.18);
      color:#9bdeb0;
    }

    .event-delivery-check-toggle.selected span {
      border-color:#4d9a65;
      background:#2f7449;
      color:#fff;
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

    /* ============================================================
       ACHEL HOME THEME — RETOUR OVERRIDES
       Alleen vormgeving. Geen retourlogica aangepast.
    ============================================================ */

    .return-workspace,
    .return-simple-workspace,
    .return-archive-card {
      background:
        radial-gradient(circle at 100% 0%,rgba(201,155,67,.08),transparent 32%),
        linear-gradient(145deg,#20271f,#151a15);
      border:1px solid rgba(201,155,67,.25);
      color:#f6f0e3;
      box-shadow:0 12px 30px rgba(0,0,0,.22);
    }

    .return-workspace-header,
    .return-simple-header,
    .return-archive-head {
      background:rgba(255,255,255,.025);
      border-bottom:1px solid rgba(201,155,67,.16);
    }

    .return-kicker,
    .return-simple-header span,
    .return-archive-head span {
      color:#c99b43;
    }

    .return-header-top h2,
    .return-simple-header h2,
    .return-archive-head h3 {
      color:#fff;
    }

    .return-summary-bar,
    .return-simple-summary {
      background:rgba(255,255,255,.04);
      border:1px solid rgba(201,155,67,.17);
    }

    .return-simple-summary > div {
      background:rgba(255,255,255,.045);
      border:1px solid rgba(201,155,67,.12);
    }

    .return-simple-list {
      background:transparent;
    }

    .return-summary-stat:not(:last-child) {
      border-right:1px solid rgba(255,255,255,.07);
    }

    .return-summary-stat span,
    .return-simple-summary span {
      color:rgba(246,240,227,.48);
    }

    .return-summary-stat strong,
    .return-simple-summary strong {
      color:#fff;
    }

    .return-table-header {
      background:rgba(201,155,67,.08);
      border-color:rgba(201,155,67,.14);
      color:rgba(246,240,227,.52);
    }

    .return-product-row,
    .return-simple-item,
    .return-archive-row {
      background:rgba(255,255,255,.035);
      border-color:rgba(255,255,255,.07);
      color:#f6f0e3;
    }

    .return-simple-item.good {
      background:rgba(57,126,79,.11);
      border-left-color:#5ca675;
    }

    .return-simple-item.problem {
      background:rgba(153,65,65,.11);
      border-left-color:#c96b5f;
    }

    .return-product-info strong,
    .return-simple-item strong,
    .return-archive-row strong {
      color:#fff;
    }

    .return-product-info span,
    .return-simple-item span,
    .return-archive-row small {
      color:rgba(246,240,227,.52);
    }

    .return-loaned,
    .return-counter-value {
      color:#fff;
    }

    .return-stepper {
      background:rgba(255,255,255,.035);
      border-color:rgba(201,155,67,.17);
    }

    .return-stepper button {
      background:rgba(255,255,255,.045);
      color:#e0b85f;
    }

    .return-stepper b {
      background:rgba(255,255,255,.025);
      color:#fff;
    }

    .return-note {
      background:rgba(255,255,255,.045);
      border-color:rgba(201,155,67,.18);
      color:#fff;
    }

    .return-note-toggle {
      color:#d7b36b;
    }

    .return-workspace-footer,
    .return-simple-footer {
      background:rgba(9,12,10,.34);
      border-top:1px solid rgba(201,155,67,.14);
    }

    .return-cancel,
    .return-simple-cancel,
    .return-reopen-button {
      background:rgba(255,255,255,.045);
      border:1px solid rgba(201,155,67,.22);
      color:#e0b85f;
    }

    .return-save-main,
    .return-simple-save,
    .return-all-good {
      background:linear-gradient(180deg,#b98936,#8d6427);
      color:#fff;
      box-shadow:0 7px 18px rgba(91,61,18,.26);
    }

    .return-help,
    .return-validation,
    .return-archive-note {
      background:rgba(201,155,67,.08);
      border:1px solid rgba(201,155,67,.14);
      color:rgba(246,240,227,.64);
    }

    .return-simple-status.pending {
      background:rgba(201,155,67,.10);
      color:#d8b36e;
    }

    .return-simple-status.good {
      background:rgba(67,139,88,.16);
      color:#91dbaa;
    }

    .return-simple-status.problem {
      background:rgba(151,67,67,.18);
      color:#e49b9b;
    }

    .return-good-toggle,
    .return-problem-button {
      background:rgba(255,255,255,.04);
      border:1px solid rgba(201,155,67,.18);
      color:rgba(246,240,227,.68);
    }

    .return-good-toggle.selected {
      background:rgba(57,126,79,.20);
      border-color:rgba(99,187,126,.28);
      color:#9cdeb0;
    }

    .return-problem-button.selected {
      background:rgba(153,65,65,.20);
      border-color:rgba(203,91,91,.28);
      color:#e9a2a2;
    }

    .return-problem-modal {
      background:
        radial-gradient(circle at 100% 0%,rgba(201,155,67,.10),transparent 33%),
        linear-gradient(145deg,#20271f,#151a15);
      border:1px solid rgba(201,155,67,.27);
      color:#f6f0e3;
      box-shadow:0 18px 50px rgba(0,0,0,.38);
    }

    .return-problem-modal-head {
      border-bottom-color:rgba(201,155,67,.17);
    }

    .return-problem-modal-head span {
      color:#c99b43;
    }

    .return-problem-modal-head h3 {
      color:#fff;
    }

    .return-problem-modal-head small {
      color:rgba(246,240,227,.55);
    }

    .return-problem-modal-head > button {
      background:rgba(255,255,255,.06);
      color:#e0b85f;
    }

    .return-problem-good-preview,
    .return-problem-option {
      background:rgba(255,255,255,.045);
      border-color:rgba(201,155,67,.17);
    }

    .return-problem-good-preview strong,
    .return-problem-option strong {
      color:#fff;
    }

    .return-problem-good-preview span,
    .return-problem-option span {
      color:rgba(246,240,227,.55);
    }

    .return-problem-stepper {
      background:rgba(255,255,255,.035);
      border-color:rgba(201,155,67,.18);
    }

    .return-problem-stepper button {
      background:rgba(255,255,255,.055);
      color:#e0b85f;
    }

    .return-problem-stepper strong {
      color:#fff;
    }

    .return-problem-modal label {
      color:#d8c8a8;
    }

    .return-problem-modal textarea {
      background:rgba(255,255,255,.055);
      border-color:rgba(201,155,67,.18);
      color:#fff;
    }

    .return-problem-cancel {
      background:rgba(255,255,255,.045);
      border-color:rgba(201,155,67,.22);
      color:#e0b85f;
    }

    .return-problem-save {
      background:linear-gradient(180deg,#b98936,#8d6427);
      color:#fff;
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
