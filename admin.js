/* =========================================================
   ACHEL POS - ADMIN DASHBOARD V2
   ========================================================= */

let adminOrders = [];
let adminProfiles = [];
let adminItems = [];


/* =========================================================
   ADMIN MODULE START
   ========================================================= */

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


    console.log(
      "Achel POS rol:",
      profile.rol
    );


    if (
      profile.rol !== "admin" &&
      profile.rol !== "verantwoordelijke"
    ) {

      return;

    }


    createAdminButton();

    createAdminScreen();

  }

  catch (error) {

    console.log(
      "Admin module fout:",
      error
    );

  }

}


/* =========================================================
   BEHEERKNOP
   ========================================================= */

function createAdminButton() {

  if (
    document.getElementById(
      "adminHomeButton"
    )
  ) {

    return;

  }


  const homeScreen =
    document.getElementById(
      "homeScreen"
    );


  if (!homeScreen) {

    return;

  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "adminHomeButton";


  button.className =
    "home-button";


  button.type =
    "button";


  button.onclick =
    openAdminDashboard;


  button.innerHTML = `

    <strong>
      ⚙️ Beheer
    </strong>

    <span>
      Dashboard, aanvragen en statusbeheer
    </span>

  `;


  homeScreen.appendChild(
    button
  );

}


/* =========================================================
   ADMIN SCHERM
   ========================================================= */

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

      <p>
        Centraal overzicht van alle Achel POS-aanvragen.
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
        style="
          width:100%;
          padding:13px;
          border:1px solid #ddd8ce;
          border-radius:12px;
          font-size:16px;
          background:white;
        "
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
        style="
          width:100%;
          padding:13px;
          border:1px solid #ddd8ce;
          border-radius:12px;
          font-size:16px;
          background:white;
        "
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
        placeholder="Klant, gemeente, vertegenwoordiger..."
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

        <h2 style="margin:0;">
          Alle aanvragen
        </h2>


        <button
          type="button"
          onclick="loadAdminDashboard()"
          style="
            border:none;
            background:#f3eadb;
            color:#8b662e;
            padding:9px 12px;
            border-radius:10px;
            font-weight:700;
          "
        >
          Vernieuwen
        </button>

      </div>


      <div
        id="adminOrdersList"
        style="margin-top:16px;"
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

}


/* =========================================================
   DASHBOARD OPENEN
   ========================================================= */

async function openAdminDashboard() {

  const normalScreens = [
    "homeScreen",
    "orderScreen",
    "summaryScreen",
    "successScreen",
    "ordersScreen"
  ];


  normalScreens.forEach(
    id => {

      document
        .getElementById(id)
        ?.classList
        .add("hidden");

    }
  );


  document
    .getElementById(
      "adminScreen"
    )
    ?.classList
    .remove("hidden");


  document
    .getElementById(
      "navHome"
    )
    ?.classList
    .remove("active");


  document
    .getElementById(
      "navOrders"
    )
    ?.classList
    .remove("active");


  await loadAdminDashboard();

}


/* =========================================================
   DASHBOARD SLUITEN
   ========================================================= */

function closeAdminDashboard() {

  document
    .getElementById(
      "adminScreen"
    )
    ?.classList
    .add("hidden");


  goHome();

}


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

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


  /*
    PROFIELEN
  */

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


  /*
    ORDERS
  */

  const {
    data: orders,
    error: orderError
  } =
    await supabaseClient

      .from("orders")

      .select(
        "id, user_id, klant, gemeente, afhaaldatum, opmerking, status, created_at"
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


  /*
    ORDER ITEMS
  */

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


/* =========================================================
   VERTEGENWOORDIGER FILTER
   ========================================================= */

function fillRepresentativeFilter() {

  const select =
    document.getElementById(
      "adminRepFilter"
    );


  if (!select) {

    return;

  }


  const currentValue =
    select.value;


  select.innerHTML = `

    <option value="">
      Alle vertegenwoordigers
    </option>

  `;


  adminProfiles

    .filter(
      profile =>
        profile.rol === "vertegenwoordiger"
    )

    .sort(
      (a, b) =>
        (a.naam || "")
          .localeCompare(
            b.naam || ""
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
    currentValue;

}


/* =========================================================
   DASHBOARD STATISTIEKEN
   ========================================================= */

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


  const newOrders =
    adminOrders.filter(
      order =>
        order.status === "nieuw"
    ).length;


  const processing =
    adminOrders.filter(
      order =>
        order.status === "in_behandeling"
    ).length;


  const ready =
    adminOrders.filter(
      order =>
        order.status === "klaar"
    ).length;


  container.innerHTML =

    adminStatCard(
      "Aanvragen",
      total
    )

    +

    adminStatCard(
      "Nieuw",
      newOrders
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
    );

}


function adminStatCard(
  label,
  value
) {

  return `

    <div
      style="
        background:#f8f7f4;
        border:1px solid #ddd8ce;
        border-radius:14px;
        padding:15px;
      "
    >

      <div
        style="
          font-size:27px;
          font-weight:800;
          color:#8b662e;
        "
      >
        ${value}
      </div>


      <div
        style="
          font-size:13px;
          color:#777;
          margin-top:4px;
        "
      >
        ${label}
      </div>

    </div>

  `;

}


/* =========================================================
   ORDERS TONEN
   ========================================================= */

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
      ?.value || "";


  const statusFilter =
    document
      .getElementById(
        "adminStatusFilter"
      )
      ?.value || "";


  const search =
    (
      document
        .getElementById(
          "adminSearch"
        )
        ?.value || ""
    )
      .trim()
      .toLowerCase();


  let orders =
    [...adminOrders];


  if (repFilter) {

    orders =
      orders.filter(
        order =>
          order.user_id === repFilter
      );

  }


  if (statusFilter) {

    orders =
      orders.filter(
        order =>
          order.status === statusFilter
      );

  }


  if (search) {

    orders =
      orders.filter(
        order => {

          const rep =
            getAdminProfile(
              order.user_id
            );


          const text =
            [
              order.klant,
              order.gemeente,
              order.opmerking,
              rep?.naam,
              rep?.email
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          return text.includes(
            search
          );

        }
      );

  }


  if (
    orders.length === 0
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


/* =========================================================
   ORDER KAART
   ========================================================= */

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
        item.order_id === order.id
    );


  const products =

    items.length

      ? items
          .map(
            item =>
              `${item.aantal} × ${adminEscapeHtml(item.product_naam)}`
          )
          .join("<br>")

      : "Geen artikelen";


  return `

    <div class="order-card">

      <div class="order-top">

        <div class="order-id">

          ${createOrderReference(
            order.id,
            order.created_at
          )}

        </div>


        <div class="status">

          ${formatStatus(
            order.status
          )}

        </div>

      </div>


      <div
        style="
          margin-top:12px;
          font-size:17px;
          font-weight:800;
        "
      >

        ${adminEscapeHtml(
          order.klant
        )}

      </div>


      ${
        order.gemeente

          ? `
            <div class="order-meta">
              📍 ${adminEscapeHtml(order.gemeente)}
            </div>
          `

          : ""
      }


      <div class="order-meta">

        👤

        ${adminEscapeHtml(
          representative?.naam
          ||
          "Onbekende gebruiker"
        )}

      </div>


      <div class="order-meta">

        📅 Afhalen:
        ${adminEscapeHtml(
          order.afhaaldatum
        )}

      </div>


      <div
        class="order-items"
        style="
          background:#f8f7f4;
          padding:12px;
          border-radius:12px;
        "
      >

        ${products}

      </div>


      ${
        order.opmerking

          ? `
            <div class="order-meta">

              Opmerking:
              ${adminEscapeHtml(
                order.opmerking
              )}

            </div>
          `

          : ""
      }


      <label>
        Status
      </label>


      <select
        onchange="
          updateAdminOrderStatus(
            '${order.id}',
            this.value,
            this
          )
        "
        style="
          width:100%;
          padding:12px;
          border:1px solid #ddd8ce;
          border-radius:12px;
          font-size:16px;
          background:white;
        "
      >

        ${adminStatusOption(
          "nieuw",
          "Nieuw",
          order.status
        )}

        ${adminStatusOption(
          "in_behandeling",
          "In behandeling",
          order.status
        )}

        ${adminStatusOption(
          "klaar",
          "Klaar",
          order.status
        )}

        ${adminStatusOption(
          "afgehaald",
          "Afgehaald",
          order.status
        )}

        ${adminStatusOption(
          "geannuleerd",
          "Geannuleerd",
          order.status
        )}

      </select>

    </div>

  `;

}


/* =========================================================
   STATUS
   ========================================================= */

function adminStatusOption(
  value,
  label,
  current
) {

  return `

    <option
      value="${value}"
      ${
        current === value
          ? "selected"
          : ""
      }
    >
      ${label}
    </option>

  `;

}


async function updateAdminOrderStatus(
  orderId,
  status,
  selectElement
) {

  selectElement.disabled =
    true;


  const {
    error
  } =
    await supabaseClient

      .from("orders")

      .update({
        status: status
      })

      .eq(
        "id",
        orderId
      );


  selectElement.disabled =
    false;


  if (error) {

    alert(
      "Status kon niet worden gewijzigd: " +
      error.message
    );

    await loadAdminDashboard();

    return;

  }


  const order =
    adminOrders.find(
      item =>
        item.id === orderId
    );


  if (order) {

    order.status =
      status;

  }


  renderAdminStatistics();

  renderAdminOrders();

}


/* =========================================================
   PROFIEL
   ========================================================= */

function getAdminProfile(
  userId
) {

  return adminProfiles.find(
    profile =>
      profile.id === userId
  );

}


/* =========================================================
   VEILIGE HTML
   ========================================================= */

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


/* =========================================================
   MODULE AUTOMATISCH STARTEN
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      initAdminModule,
      500
    );

  }
);


supabaseClient
  .auth
  .onAuthStateChange(
    () => {

      setTimeout(
        initAdminModule,
        500
      );

    }
  );


setTimeout(
  initAdminModule,
  1500
);
