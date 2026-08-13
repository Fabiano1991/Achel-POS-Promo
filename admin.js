/* ============================================================
   ACHEL POS - ADMIN DASHBOARD V3
   ============================================================ */

let adminOrders = [];
let adminProfiles = [];
let adminItems = [];

let selectedAdminOrder = null;


/* ============================================================
   ADMIN MODULE START
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
      profileError ||
      !profile
    ) {

      console.log(
        "Admin profiel niet gevonden:",
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

    console.log(
      "Admin module fout:",
      error
    );

  }

}



/* ============================================================
   ADMIN SCHERM MAKEN
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
      >
      </div>

    </div>


    <div class="card">

      <h2>
        Filters
      </h2>


      <label>
        Vertegenwoordiger
      </label>

      <select
        id="adminRepFilter"
        onchange="renderAdminOrders()"
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
        onchange="renderAdminOrders()"
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
        placeholder="Referentie, gemeente, vertegenwoordiger..."
        oninput="renderAdminOrders()"
      >

    </div>


    <div class="card">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
        "
      >

        <h2
          style="
            margin:0;
          "
        >
          Alle aanvragen
        </h2>


        <button
          type="button"
          onclick="loadAdminDashboard()"
          style="
            border:none;
            background:var(--gold-soft);
            color:var(--gold);
            padding:9px 12px;
            border-radius:10px;
            font-weight:800;
          "
        >
          Vernieuwen
        </button>

      </div>


      <div
        id="adminOrdersList"
        style="
          margin-top:16px;
        "
      >

        <div class="empty">
          Aanvragen laden...
        </div>

      </div>

    </div>

  `;


  appMain.appendChild(
    section
  );


  createAdminDetailScreen();

}



/* ============================================================
   DETAIL SCHERM MAKEN
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
   DASHBOARD OPENEN
============================================================ */

async function openAdminDashboard() {

  if (
    !document.getElementById(
      "adminScreen"
    )
  ) {

    await initAdminModule();

  }


  hideAllNormalScreens();


  document
    .getElementById(
      "adminDetailScreen"
    )
    ?.classList
    .add("hidden");


  document
    .getElementById(
      "adminScreen"
    )
    ?.classList
    .remove("hidden");


  await loadAdminDashboard();

}



/* ============================================================
   DASHBOARD SLUITEN
============================================================ */

function closeAdminDashboard() {

  document
    .getElementById(
      "adminScreen"
    )
    ?.classList
    .add("hidden");


  document
    .getElementById(
      "adminDetailScreen"
    )
    ?.classList
    .add("hidden");


  goHome();

}



/* ============================================================
   TERUG NAAR DASHBOARD
============================================================ */

function backToAdminDashboard() {

  document
    .getElementById(
      "adminDetailScreen"
    )
    ?.classList
    .add("hidden");


  document
    .getElementById(
      "adminScreen"
    )
    ?.classList
    .remove("hidden");


  renderAdminOrders();

}



/* ============================================================
   NORMALE SCHERMEN VERBERGEN
============================================================ */

function hideAllNormalScreens() {

  [
    "homeScreen",
    "orderScreen",
    "summaryScreen",
    "successScreen",
    "ordersScreen"
  ]

    .forEach(
      id => {

        document
          .getElementById(
            id
          )
          ?.classList
          .add("hidden");

      }
    );

}



/* ============================================================
   DATA LADEN
============================================================ */

async function loadAdminDashboard() {

  const container =
    document.getElementById(
      "adminOrdersList"
    );


  if (!container) {

    return;

  }


  container.innerHTML = `

    <div class="empty">
      Dashboard laden...
    </div>

  `;



  /* =========================
     PROFIELEN
  ========================= */

  const {
    data: profiles,
    error: profileError
  } =
    await supabaseClient

      .from("profiles")

      .select(
        "id, naam, email, rol, actief"
      );


  if (profileError) {

    container.innerHTML = `

      <div class="info error">

        Profielen konden niet worden geladen:

        ${adminEscapeHtml(
          profileError.message
        )}

      </div>

    `;


    return;

  }


  adminProfiles =
    profiles || [];



  /* =========================
     ORDERS
  ========================= */

  const {
    data: orders,
    error: orderError
  } =
    await supabaseClient

      .from("orders")

      .select(
        `
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
        `
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (orderError) {

    container.innerHTML = `

      <div class="info error">

        Aanvragen konden niet worden geladen:

        ${adminEscapeHtml(
          orderError.message
        )}

      </div>

    `;


    return;

  }


  adminOrders =
    orders || [];



  /* =========================
     ORDER ITEMS
  ========================= */

  const {
    data: items,
    error: itemError
  } =
    await supabaseClient

      .from("order_items")

      .select(
        "order_id, product_naam, categorie, aantal"
      );


  if (itemError) {

    container.innerHTML = `

      <div class="info error">

        Artikelen konden niet worden geladen:

        ${adminEscapeHtml(
          itemError.message
        )}

      </div>

    `;


    return;

  }


  adminItems =
    items || [];


  fillRepresentativeFilter();

  renderAdminStatistics();

  renderAdminOrders();

}



/* ============================================================
   FILTER VERTEGENWOORDIGER
============================================================ */

function fillRepresentativeFilter() {

  const select =
    document.getElementById(
      "adminRepFilter"
    );


  if (!select) {

    return;

  }


  const selectedValue =
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
          profile.naam;


        select.appendChild(
          option
        );

      }
    );


  select.value =
    selectedValue;

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
   ORDERS TONEN
============================================================ */

function renderAdminOrders() {

  const container =
    document.getElementById(
      "adminOrdersList"
    );


  if (!container) {

    return;

  }


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



  let orders =
    [...adminOrders];



  if (
    repFilter
  ) {

    orders =
      orders.filter(
        order =>
          order.user_id ===
          repFilter
      );

  }



  if (
    statusFilter
  ) {

    orders =
      orders.filter(
        order =>
          order.status ===
          statusFilter
      );

  }



  if (
    search
  ) {

    orders =
      orders.filter(
        order => {

          const rep =
            getAdminProfile(
              order.user_id
            );


          const combinedText =

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


          return combinedText
            .includes(
              search
            );

        }
      );

  }



  if (
    !orders.length
  ) {

    container.innerHTML = `

      <div class="empty">
        Geen aanvragen gevonden.
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
   COMPACTE ORDER KAART
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
          item.aantal || 0
        ),

      0
    );


  const reference =
    createOrderReference(
      order.id,
      order.created_at
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
        margin-bottom:10px;
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

          ${formatStatus(
            order.status
          )}

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
          order.referentie
          ||
          "Geen referentie"
        )}

      </div>


      <div
        class="order-meta"
      >

        ${adminEscapeHtml(
          representative?.naam
          ||
          "Onbekende gebruiker"
        )}

      </div>


      <div
        class="order-meta"
      >

        ${adminEscapeHtml(
          order.land || ""
        )}

        ${
          order.gemeente

            ? ` · ${adminEscapeHtml(order.gemeente)}`

            : ""
        }

      </div>


      <div
        class="order-meta"
      >

        Afhalen:
        ${adminEscapeHtml(
          order.afhaaldatum
        )}

        ·

        ${totalItems}
        items

      </div>

    </button>

  `;

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


  /*
    NIEUW → IN BEHANDELING
    zodra admin opent.
  */

  if (
    order.status ===
    "nieuw"
  ) {

    const {
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
        );


    if (!error) {

      order.status =
        "in_behandeling";


      /*
        Stap A zet via trigger
        automatisch opened_at.
      */

    }

    else {

      console.log(
        "Status kon niet automatisch worden gewijzigd:",
        error
      );

    }

  }


  selectedAdminOrder =
    order;


  renderAdminDetail(
    order
  );


  document
    .getElementById(
      "adminScreen"
    )
    ?.classList
    .add("hidden");


  document
    .getElementById(
      "adminDetailScreen"
    )
    ?.classList
    .remove("hidden");


  /*
    Dashboard lokaal bijwerken
  */

  renderAdminStatistics();

}



/* ============================================================
   DETAILWEERGAVE
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
              order.referentie
              ||
              "Geen referentie"
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

      </div>

    </div>



    ${
      order.event_naam

        ? `

          <div class="card">

            <h2>
              Evenement
            </h2>


            ${adminDetailRow(
              "Naam",
              order.event_naam
            )}


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

          </div>

        `

        : ""
    }



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


      ${
        adminActionButtons(
          order
        )
      }

    </div>

  `;

}



/* ============================================================
   DETAIL RIJ
============================================================ */

function adminDetailRow(
  label,
  value
) {

  return `

    <div>

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



/* ============================================================
   CATEGORIE KAART
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
   STATUS TIJDLIJN
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
      >
      </div>


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
   ACTIEKNOPPEN
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
    "afgehaald"
  ) {

    return `

      <div
        class="info ok"
      >
        Deze aanvraag is volledig afgehandeld.
      </div>

    `;

  }


  if (
    order.status ===
    "geannuleerd"
  ) {

    return `

      <div
        class="info error"
      >
        Deze aanvraag werd geannuleerd.
      </div>

    `;

  }


  return "";

}



/* ============================================================
   VOLTOOID → KLAAR
============================================================ */

async function markAdminOrderCompleted() {

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

      .from("orders")

      .update({

        status:
          "klaar"

      })

      .eq(
        "id",
        selectedAdminOrder.id
      )

      .select(
        `
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
        `
      )

      .single();


  if (error) {

    alert(

      "De aanvraag kon niet als voltooid worden gemarkeerd: "

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
   KLAAR → AFGEHAALD
============================================================ */

async function markAdminOrderCollected() {

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

      .from("orders")

      .update({

        status:
          "afgehaald"

      })

      .eq(
        "id",
        selectedAdminOrder.id
      )

      .select(
        `
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
        `
      )

      .single();


  if (error) {

    alert(

      "De aanvraag kon niet als afgehaald worden gemarkeerd: "

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
      "Wil je deze aanvraag werkelijk annuleren?"
    );


  if (
    !confirmed
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from("orders")

      .update({

        status:
          "geannuleerd"

      })

      .eq(
        "id",
        selectedAdminOrder.id
      )

      .select(
        `
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
        `
      )

      .single();


  if (error) {

    alert(

      "De aanvraag kon niet worden geannuleerd: "

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
   LOKALE ADMIN ORDER BIJWERKEN
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



/* ============================================================
   PROFIEL OPZOEKEN
============================================================ */

function getAdminProfile(
  userId
) {

  return adminProfiles.find(
    profile =>
      profile.id ===
      userId
  );

}



/* ============================================================
   STATUS CLASS
============================================================ */

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



/* ============================================================
   DATUM / TIJD
============================================================ */

function adminFormatDateTime(
  date
) {

  if (!date) {

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



/* ============================================================
   VEILIGE HTML
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
   MODULE AUTOMATISCH STARTEN
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
