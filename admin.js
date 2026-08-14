/* ============================================================
   ACHEL POS - ADMIN DASHBOARD V4
   Compact dashboard met aparte stromen:
   - POS & bier
   - Evenementen
   - Groothandel
============================================================ */

let adminOrders = [];
let adminProfiles = [];
let adminItems = [];

let adminWholesaleOrders = [];
let adminWholesaleItems = [];

let selectedAdminOrder = null;


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
      profileError
      ||
      !profile
    ) {

      return;

    }


    if (
      profile.rol !== "admin"
      &&
      profile.rol !== "verantwoordelijke"
    ) {

      return;

    }


    createAdminScreen();

  }

  catch (error) {

    console.log(
      "Admin module fout:",
      error
    );

  }

}


/* ============================================================
   DASHBOARD HTML
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
        Centraal overzicht van alle aanvragen.
      </p>


      <div
        id="adminStatistics"
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
          margin-top:15px;
        "
      ></div>

    </div>


    <details
      class="card dashboard-fold"
      id="adminFiltersFold"
    >

      <summary>
        <span>Filters</span>
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
          placeholder="Referentie, evenement, gemeente, vertegenwoordiger..."
          oninput="renderAdminSections()"
        >

      </div>

    </details>


    <details
      class="card dashboard-fold"
      id="adminRegularFold"
    >

      <summary>

        <span>
          POS & bier aanvragen
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


    <details
      class="card dashboard-fold"
      id="adminEventFold"
    >

      <summary>

        <span>
          Evenementaanvragen
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


    <details
      class="card dashboard-fold"
      id="adminWholesaleFold"
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

        <div id="adminWholesaleOrdersList">

          <div class="empty">
            Groothandelbestellingen laden...
          </div>

        </div>

      </div>

    </details>


    <button
      class="secondary"
      type="button"
      onclick="loadAdminDashboard()"
      style="
        margin-bottom:20px;
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


    <div id="adminDetailContent"></div>

  `;


  appMain.appendChild(
    section
  );

}


/* ============================================================
   OPEN / SLUIT
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


function closeAdminDashboard() {

  goHome();

}


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

  const regularContainer =
    document.getElementById(
      "adminRegularOrdersList"
    );


  const eventContainer =
    document.getElementById(
      "adminEventOrdersList"
    );


  const wholesaleContainer =
    document.getElementById(
      "adminWholesaleOrdersList"
    );


  if (
    regularContainer
  ) {

    regularContainer.innerHTML =
      `<div class="empty">Aanvragen laden...</div>`;

  }


  if (
    eventContainer
  ) {

    eventContainer.innerHTML =
      `<div class="empty">Evenementen laden...</div>`;

  }


  if (
    wholesaleContainer
  ) {

    wholesaleContainer.innerHTML =
      `<div class="empty">Groothandelbestellingen laden...</div>`;

  }


  const [
    profilesResult,
    ordersResult,
    itemsResult,
    wholesaleResult,
    wholesaleItemsResult
  ] =
    await Promise.all([

      supabaseClient
        .from("profiles")
        .select(
          "id, naam, email, rol, actief"
        ),

      supabaseClient
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
        .from("order_items")
        .select(
          "order_id, product_naam, categorie, aantal"
        ),

      supabaseClient
        .from("wholesale_orders")
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
        .from("wholesale_order_items")
        .select(
          "wholesale_order_id, product_naam, eenheid, betaald_aantal, actie, gratis_aantal, totaal_aantal"
        )

    ]);


  if (
    profilesResult.error
  ) {

    showAdminLoadError(
      "Profielen",
      profilesResult.error
    );


    return;

  }


  if (
    ordersResult.error
  ) {

    showAdminLoadError(
      "Aanvragen",
      ordersResult.error
    );


    return;

  }


  if (
    itemsResult.error
  ) {

    showAdminLoadError(
      "Aanvraagartikelen",
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


  if (
    wholesaleResult.error
    ||
    wholesaleItemsResult.error
  ) {

    console.log(
      "Groothandel kon niet volledig geladen worden:",
      wholesaleResult.error
      ||
      wholesaleItemsResult.error
    );

  }


  fillRepresentativeFilter();

  renderAdminStatistics();

  renderAdminSections();

}


function showAdminLoadError(
  title,
  error
) {

  const message =
    `${title} konden niet worden geladen: ${error?.message || "Onbekende fout"}`;


  [
    "adminRegularOrdersList",
    "adminEventOrdersList"
  ]
    .forEach(
      id => {

        const element =
          document.getElementById(
            id
          );


        if (element) {

          element.innerHTML =
            `<div class="info error">${adminEscapeHtml(message)}</div>`;

        }

      }
    );

}


/* ============================================================
   FILTERS
============================================================ */

function fillRepresentativeFilter() {

  const select =
    document.getElementById(
      "adminRepFilter"
    );


  if (!select) {

    return;

  }


  const selected =
    select.value;


  select.innerHTML =
    `<option value="">Alle vertegenwoordigers</option>`;


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
    selected;

}


function getFilteredAdminOrders() {

  const repFilter =
    document
      .getElementById(
        "adminRepFilter"
      )
      ?.value
    ||
    "";


  const statusFilter =
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
          repFilter
          &&
          order.user_id !==
          repFilter
        ) {

          return false;

        }


        if (
          statusFilter
          &&
          order.status !==
          statusFilter
        ) {

          return false;

        }


        if (
          search
        ) {

          const rep =
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
              rep?.naam,
              rep?.email
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


  const total =
    adminOrders.length;


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


  const klaar =
    adminOrders.filter(
      order =>
        order.status ===
        "klaar"
    ).length;


  container.innerHTML =

    adminStatCard(
      "Aanvragen",
      total
    )

    +

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
      klaar
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
   SECTIES RENDEREN
============================================================ */

function renderAdminSections() {

  const filtered =
    getFilteredAdminOrders();


  const regularOrders =
    filtered.filter(
      order =>
        !order.event_naam
    );


  const eventOrders =
    filtered.filter(
      order =>
        Boolean(
          order.event_naam
        )
    );


  setAdminCount(
    "adminRegularCount",
    regularOrders.length
  );


  setAdminCount(
    "adminEventCount",
    eventOrders.length
  );


  setAdminCount(
    "adminWholesaleCount",
    adminWholesaleOrders.length
  );


  renderAdminOrderList(
    "adminRegularOrdersList",
    regularOrders,
    "Geen POS- of bieraanvragen gevonden."
  );


  renderAdminOrderList(
    "adminEventOrdersList",
    eventOrders,
    "Geen evenementaanvragen gevonden."
  );


  renderAdminWholesaleOrders();

}


function setAdminCount(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.innerText =
      value;

  }

}


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

    container.innerHTML =
      `<div class="empty">${adminEscapeHtml(emptyText)}</div>`;


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
   POS / EVENT KAART
============================================================ */

function adminOrderCard(
  order
) {

  const representative =
    getAdminProfile(
      order.user_id
    );


  const items =
    adminItems.filter(
      item =>
        item.order_id ===
        order.id
    );


  const totalItems =
    items.reduce(
      (
        total,
        item
      ) =>
        total
        +
        Number(
          item.aantal
          ||
          0
        ),
      0
    );


  const reference =
    createOrderReference(
      order.id,
      order.created_at
    );


  const eventMeta =
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
            order.land
            ||
            ""
          )}

          ${
            order.gemeente

              ? ` · ${adminEscapeHtml(order.gemeente)}`

              : ""
          }

        </div>

      `;


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
          align-items:center;
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
          ${formatStatus(order.status)}
        </div>

      </div>


      <div
        style="
          margin-top:10px;
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


      ${eventMeta}


      <div class="order-meta">

        ${totalItems}
        items

      </div>

    </button>

  `;

}


/* ============================================================
   GROOTHANDEL DASHBOARD
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

    container.innerHTML =
      `

        <div class="empty">
          Nog geen groothandelbestellingen.
        </div>

      `;


    return;

  }


  container.innerHTML =
    adminWholesaleOrders

      .map(
        order =>
          adminWholesaleCard(
            order
          )
      )

      .join("");

}


function adminWholesaleCard(
  order
) {

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


  const orderNumber =
    createAdminWholesaleReference(
      order.id,
      order.created_at
    );


  return `

    <details
      class="wholesale-admin-order"
    >

      <summary>

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            align-items:flex-start;
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
              ${orderNumber}
            </div>


            <div
              style="
                font-size:16px;
                font-weight:850;
                margin-top:5px;
              "
            >
              ${adminEscapeHtml(
                order.referentie
                ||
                "Geen referentie"
              )}
            </div>


            <div class="order-meta">

              ${adminEscapeHtml(
                rep?.naam
                ||
                "Onbekende gebruiker"
              )}

              ·

              ${adminEscapeHtml(
                order.drankenhandel
                ||
                "Geen drankenhandel"
              )}

            </div>

          </div>


          <span class="status">

            ${adminEscapeHtml(
              order.status
              ||
              "Besteld"
            )}

          </span>

        </div>

      </summary>


      <div class="wholesale-admin-body">

        ${adminDetailRow(
          "Vertegenwoordiger",
          rep?.naam
          ||
          "Onbekend"
        )}


        ${adminDetailRow(
          "E-mail",
          rep?.email
          ||
          ""
        )}


        ${adminDetailRow(
          "Referentie / klant",
          order.referentie
          ||
          ""
        )}


        ${adminDetailRow(
          "Drankenhandel",
          order.drankenhandel
          ||
          ""
        )}


        <div
          style="
            margin-top:16px;
            font-size:12px;
            color:var(--gold);
            font-weight:900;
            letter-spacing:.05em;
          "
        >
          BESTELLING
        </div>


        ${
          items.length

            ? items
                .map(
                  item =>
                    adminWholesaleItemRow(
                      item
                    )
                )
                .join("")

            : `

                <div class="empty">
                  Geen bestelregels gevonden.
                </div>

              `
        }


        ${
          order.opmerking

            ? `

                <div
                  class="info"
                  style="
                    margin-top:14px;
                  "
                >
                  ${adminEscapeHtml(
                    order.opmerking
                  )}
                </div>

              `

            : ""
        }

      </div>

    </details>

  `;

}


function adminWholesaleItemRow(
  item
) {

  const hasFree =
    Number(
      item.gratis_aantal
      ||
      0
    )
    >
    0;


  return `

    <div
      style="
        padding:12px 0;
        border-bottom:1px solid var(--border);
      "
    >

      <div
        style="
          font-weight:800;
        "
      >
        ${adminEscapeHtml(
          item.product_naam
        )}
      </div>


      <div
        class="order-meta"
      >

        Betaald:
        ${Number(item.betaald_aantal || 0)}

        ${
          item.eenheid

            ? ` · ${adminEscapeHtml(item.eenheid)}`

            : ""
        }

      </div>


      ${
        item.actie
        &&
        item.actie !== "geen"

          ? `

              <div
                class="order-meta"
              >

                Actie:
                ${adminEscapeHtml(item.actie)}

                · Gratis:
                ${Number(item.gratis_aantal || 0)}

                · Totaal te leveren:
                ${Number(item.totaal_aantal || 0)}

              </div>

            `

          : ""
      }


      ${
        hasFree

          ? `

              <div
                class="info ok"
              >
                Gratis vat(en): commerciële tegemoetkoming.
                Enkel leeggoed factureren.
              </div>

            `

          : ""
      }

    </div>

  `;

}


function createAdminWholesaleReference(
  id,
  createdAt
) {

  const year =
    new Date(
      createdAt
      ||
      Date.now()
    )
      .getFullYear();


  return `GH-${year}-${String(id).slice(0,8).toUpperCase()}`;

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
        "De aanvraag kon niet in behandeling worden gezet: "
        +
        error.message
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
    adminItems.filter(
      item =>
        item.order_id ===
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


  const title =
    order.event_naam
    ||
    order.referentie
    ||
    "Geen referentie";


  const orderReference =
    createOrderReference(
      order.id,
      order.created_at
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
              color:var(--gold);
              font-weight:900;
            "
          >
            ${orderReference}
          </div>


          <h2
            style="
              margin-top:6px;
              margin-bottom:5px;
            "
          >
            ${adminEscapeHtml(
              title
            )}
          </h2>

        </div>


        <div
          class="status ${adminStatusClass(order.status)}"
        >
          ${formatStatus(order.status)}
        </div>

      </div>


      <div
        style="
          margin-top:18px;
          display:grid;
          gap:9px;
        "
      >

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
                  "Stad / gemeente",
                  order.gemeente
                  ||
                  "Niet ingevuld"
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


              <p
                style="
                  margin:0;
                  line-height:1.5;
                "
              >
                ${adminEscapeHtml(
                  order.opmerking
                )}
              </p>

            </div>

          `

        : ""
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


function adminDetailRow(
  label,
  value
) {

  return `

    <div
      style="
        margin-top:10px;
      "
    >

      <div
        style="
          font-size:11px;
          font-weight:900;
          color:var(--muted);
          text-transform:uppercase;
          letter-spacing:.04em;
        "
      >
        ${label}
      </div>


      <div
        style="
          margin-top:2px;
          font-weight:700;
        "
      >
        ${adminEscapeHtml(
          value
        )}
      </div>

    </div>

  `;

}


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
   STATUS
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
        Boolean(order.opened_at)
      )}


      ${adminTimelineRow(
        "Klaar",
        order.completed_at,
        Boolean(order.completed_at)
      )}


      ${adminTimelineRow(
        "Afgehaald",
        order.collected_at,
        Boolean(order.collected_at)
      )}

    </div>

  `;

}


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
        align-items:start;
      "
    >

      <div
        style="
          width:10px;
          height:10px;
          margin-top:4px;
          border-radius:50%;
          background:${
            active
              ? "var(--green)"
              : "var(--border)"
          };
        "
      ></div>


      <div>

        <div
          style="
            font-weight:800;
            color:${
              active
                ? "var(--text)"
                : "var(--muted)"
            };
          "
        >
          ${label}
        </div>


        ${
          date

            ? `

                <div
                  style="
                    margin-top:2px;
                    font-size:12px;
                    color:var(--muted);
                  "
                >
                  ${adminFormatDateTime(date)}
                </div>

              `

            : ""
        }

      </div>

    </div>

  `;

}


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
    "afgehaald"
  ) {

    return `

      <div class="info ok">
        Deze aanvraag is volledig afgehandeld.
      </div>

    `;

  }


  if (
    order.status ===
    "geannuleerd"
  ) {

    return `

      <div class="info error">
        Deze aanvraag werd geannuleerd.
      </div>

    `;

  }


  return "";

}


async function markAdminOrderCompleted() {

  if (
    selectedAdminOrder
  ) {

    await updateSelectedAdminOrderStatus(
      "klaar"
    );

  }

}


async function markAdminOrderCollected() {

  if (
    selectedAdminOrder
  ) {

    await updateSelectedAdminOrderStatus(
      "afgehaald"
    );

  }

}


async function cancelAdminOrder() {

  if (
    !selectedAdminOrder
  ) {

    return;

  }


  if (
    !window.confirm(
      "Wil je deze aanvraag werkelijk annuleren?"
    )
  ) {

    return;

  }


  await updateSelectedAdminOrderStatus(
    "geannuleerd"
  );

}


async function updateSelectedAdminOrderStatus(
  status
) {

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
      "Status kon niet worden gewijzigd: "
      +
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
   HELPERS
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

    adminOrders[
      index
    ] =
      updatedOrder;

  }

}


function getAdminProfile(
  userId
) {

  return adminProfiles.find(
    profile =>
      profile.id ===
      userId
  );

}


function adminStatusClass(
  status
) {

  if (
    status === "klaar"
    ||
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


function adminFormatDateTime(
  date
) {

  if (
    !date
  ) {

    return "";

  }


  try {

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

  catch {

    return date;

  }

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
