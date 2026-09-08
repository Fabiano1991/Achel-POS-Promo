// =========================================================
// ACHEL BEURZEN MODULE
// beurzen.js
// =========================================================

const SUPABASE_URL =
  "https://qosjfznmdnswwfnglxqt.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_pyiiMmH2tpl-lL3e_edcow_4ztJX-Ul";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

let currentSession = null;
let currentProfile = null;
let representatives = [];
let myContacts = [];
let myOrders = [];
let currentView = "homeView";

const ADMIN_ROLES = ["admin", "verantwoordelijke", "commercieel_directeur", "boekhoudster"];
let isAdminUser = false;
let adminContacts = [];
let adminOrders = [];
let adminRepFilterValue = "all";

// =========================================================
// OFFICIËLE ARTIKELLIJST
// ID en artikelnummer blijven altijd gekoppeld aan elk artikel.
// =========================================================

const BEURS_PRODUCTS = [
  { id:12907, article_number:"000239", barcode:"", name:"Achel Bockbier 20 L", display_name:"Achel Bockbier 20L", category:"vat20" },
  { id:44, article_number:"000031", barcode:"", name:"Achel Dubbel 20 L", display_name:"Achel Dubbel 20L", category:"vat20" },
  { id:68, article_number:"000055", barcode:"", name:"Achel Gallant Grand Cru Special 20 L", display_name:"Achel Gallant Grand Cru Special 20L", category:"vat20" },
  { id:8396, article_number:"000170", barcode:"", name:"Achel Quadrupel Dark 20 L", display_name:"Achel Quadrupel Dark 20L", category:"vat20" },
  { id:8383, article_number:"000157", barcode:"", name:"Achel Quadrupel Gold 20 L", display_name:"Achel Quadrupel Gold 20L", category:"vat20" },
  { id:45, article_number:"000032", barcode:"", name:"Achel Rouge Légère 20 L", display_name:"Achel Rouge Légère 20L", category:"vat20" },
  { id:46, article_number:"000033", barcode:"", name:"Achel Singel Blond 20 L", display_name:"Achel Singel Blond 20L", category:"vat20" },
  { id:23, article_number:"000011", barcode:"", name:"Achel Tripel 20 L", display_name:"Achel Tripel 20L", category:"vat20" },
  { id:8657, article_number:"000175", barcode:"", name:"Achel Winter '26 20 L", display_name:"Achel Winter '26 20L", category:"vat20" },
  { id:8646, article_number:"000172", barcode:"", name:"Achel Wit 20 L", display_name:"Achel Wit 20L", category:"vat20" },

  { id:41, article_number:"000028", barcode:"5425007658811", name:"Achel Dubbel 24 x 33cl", display_name:"Achel Dubbel 24 × 33cl", category:"krat24" },
  { id:8393, article_number:"000167", barcode:"", name:"Achel Gallant Grand Cru 24 x 33cl", display_name:"Achel Gallant Grand Cru 24 × 33cl", category:"krat24" },
  { id:8388, article_number:"000162", barcode:"", name:"Achel Quadrupel Dark 24 x 33cl", display_name:"Achel Quadrupel Dark 24 × 33cl", category:"krat24" },
  { id:8382, article_number:"000156", barcode:"", name:"Achel Quadrupel Gold 24 x 33cl", display_name:"Achel Quadrupel Gold 24 × 33cl", category:"krat24" },
  { id:42, article_number:"000029", barcode:"5425007659214", name:"Achel Rouge Légère 24 x 33cl", display_name:"Achel Rouge Légère 24 × 33cl", category:"krat24" },
  { id:2087, article_number:"000094", barcode:"", name:"Achel Singel Blond 24 x 33cl - 12°PL", display_name:"Achel Singel Blond 24 × 33cl", category:"krat24" },
  { id:21, article_number:"000009", barcode:"5425007658835", name:"Achel Tripel 24 x 33cl", display_name:"Achel Tripel 24 × 33cl", category:"krat24" },
  { id:8656, article_number:"000174", barcode:"", name:"Achel Winter '26 24 x 33cl", display_name:"Achel Winter '26 24 × 33cl", category:"krat24" },
  { id:5078, article_number:"000112", barcode:"5425007659535", name:"Achel Wit 24 x 33cl", display_name:"Achel Wit 24 × 33cl", category:"krat24" },

  { id:67, article_number:"000054", barcode:"", name:"Achel Gallant Grand Cru Special 6 x 75cl carton", display_name:"Achel Gallant Grand Cru Special 6 × 75cl", category:"doos75" },
  { id:8395, article_number:"000169", barcode:"", name:"Achel Quadrupel Dark 6 x 75cl carton", display_name:"Achel Quadrupel Dark 6 × 75cl", category:"doos75" },
  { id:8394, article_number:"000168", barcode:"", name:"Achel Quadrupel Gold 6 x 75cl carton", display_name:"Achel Quadrupel Gold 6 × 75cl", category:"doos75" },
  { id:65, article_number:"000052", barcode:"", name:"Achel Superior Winter 6 x 75cl carton", display_name:"Achel Superior Winter 6 × 75cl", category:"doos75" },

  { id:14340, article_number:"000243", barcode:"5425007659368", name:"Achel Tripel Clip 4 x 33cl", display_name:"Achel Tripel Clip 4 × 33cl", category:"clip4" },
  { id:14339, article_number:"000242", barcode:"5425007659375", name:"Achel Dubbel Clip 4 x 33cl", display_name:"Achel Dubbel Clip 4 × 33cl", category:"clip4" },
  { id:14342, article_number:"000245", barcode:"5425007659382", name:"Achel Singel Blond Clip 4 x 33cl", display_name:"Achel Singel Blond Clip 4 × 33cl", category:"clip4" },
  { id:14341, article_number:"000244", barcode:"5425007659399", name:"Achel Rouge Légère Clip 4 x 33cl", display_name:"Achel Rouge Légère Clip 4 × 33cl", category:"clip4" },
  { id:14343, article_number:"000246", barcode:"5425007659764", name:"Achel Quadrupel Dark Clip 4 x 33cl", display_name:"Achel Quadrupel Dark Clip 4 × 33cl", category:"clip4" },
  { id:14344, article_number:"000247", barcode:"5425007659771", name:"Achel Quadrupel Gold Clip 4 x 33cl", display_name:"Achel Quadrupel Gold Clip 4 × 33cl", category:"clip4" },
  { id:14346, article_number:"000249", barcode:"5425007659788", name:"Achel Witbier Clip 4 x 33cl", display_name:"Achel Witbier Clip 4 × 33cl", category:"clip4" },
  { id:14345, article_number:"000248", barcode:"5425007659795", name:"Achel Gallant Grand Cru Special Clip 4 x 33cl", display_name:"Achel Gallant Grand Cru Special Clip 4 × 33cl", category:"clip4" },
  { id:14349, article_number:"000252", barcode:"5425007659801", name:"Achel Quartet Clip 4 x 33cl (Tripel, Dubbel, Singel, Rouge)", display_name:"Achel Quartet Clip 4 × 33cl", category:"clip4" },
  { id:14353, article_number:"000254", barcode:"5425007659818", name:"Achel Mix DT Clip 4 x 33cl (2x Tripel, 2x Dubbel)", display_name:"Achel Mix DT Clip 4 × 33cl", category:"clip4" },
  { id:14352, article_number:"000253", barcode:"5425007659825", name:"Achel OerQuartet Clip 4 x 33cl (Tripel, Dubbel, Qua Dark, Qua Gold)", display_name:"Achel OerQuartet Clip 4 × 33cl", category:"clip4" },
  { id:14347, article_number:"000250", barcode:"5425007659832", name:"Achel Winter Clip 4 x 33cl", display_name:"Achel Winter Clip 4 × 33cl", category:"clip4" },
  { id:14348, article_number:"000251", barcode:"5425007659849", name:"Achel Mix Q Clip 4 x 33cl (Quadrupel Gold + Quadrupel Dark)", display_name:"Achel Mix Q Clip 4 × 33cl", category:"clip4" }
];

const INTEREST_BEERS = [
  "Achel Bockbier",
  "Achel Dubbel",
  "Achel Gallant Grand Cru",
  "Achel Gallant Grand Cru Special",
  "Achel Quadrupel Dark",
  "Achel Quadrupel Gold",
  "Achel Rouge Légère",
  "Achel Singel Blond",
  "Achel Tripel",
  "Achel Winter '26",
  "Achel Wit",
  "Achel Superior Winter"
];

// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initBeurzen
);

async function initBeurzen() {
  bindNavigation();
  bindForms();
  renderInterestList();
  renderProducts();

  try {
    const {
      data: { session },
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    if (!session?.user) {
      window.location.href =
        "../index.html";
      return;
    }

    currentSession = session;

    await Promise.all([
      loadCurrentProfile(),
      loadRepresentatives()
    ]);

    setWelcome();
    fillRepresentativeSelects();

    isAdminUser = ADMIN_ROLES.includes(currentProfile?.rol);

    if (isAdminUser) {
      document
        .getElementById("adminActionCard")
        ?.classList.remove("hidden");

      fillAdminRepFilter();
      bindAdminControls();
    }

    await refreshAllData();
  }
  catch (error) {
    console.error(
      "BEURZEN INIT FOUT:",
      error
    );

    showGlobalError(
      "De beursmodule kon niet volledig worden geladen."
    );
  }
}

// =========================================================
// NAVIGATIE
// =========================================================

function bindNavigation() {
  document
    .querySelectorAll(
      "[data-view-target]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () =>
          openView(
            button.dataset.viewTarget
          )
      );
    });

  document
    .getElementById("headerBackButton")
    ?.addEventListener(
      "click",
      handleHeaderBack
    );
}

function openView(viewId) {
  document
    .querySelectorAll(
      ".view-section"
    )
    .forEach(section =>
      section.classList.add("hidden")
    );

  const target =
    document.getElementById(viewId);

  if (target) {
    target.classList.remove("hidden");
  }

  currentView = viewId;

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

function handleHeaderBack() {
  if (currentView === "homeView") {
    window.location.href = "../index.html";
    return;
  }

  openView("homeView");
}

// =========================================================
// PROFIEL / VERTEGENWOORDIGERS
// =========================================================

async function loadCurrentProfile() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("id, naam, email, rol, actief")
      .eq(
        "id",
        currentSession.user.id
      )
      .single();

  if (error) throw error;

  currentProfile = data;
}

async function loadRepresentatives() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("id, naam, email, rol, actief")
      .eq("actief", true)
      .order("naam", {
        ascending:true
      });

  if (error) throw error;

  representatives =
    (data || [])
      .filter(profile =>
        [
          "vertegenwoordiger",
          "admin",
          "verantwoordelijke"
        ].includes(profile.rol)
      );
}

function fillRepresentativeSelects() {
  [
    "contactRepresentative",
    "orderRepresentative"
  ]
    .forEach(id => {
      const select =
        document.getElementById(id);

      if (!select) return;

      select.innerHTML =
        representatives
          .map(profile => `
            <option value="${escapeHtml(profile.id)}">
              ${escapeHtml(
                profile.naam ||
                profile.email ||
                "Onbekend"
              )}
            </option>
          `)
          .join("");

      const own =
        representatives.find(
          item =>
            item.id ===
            currentSession.user.id
        );

      if (own) {
        select.value = own.id;
      }
    });
}

function setWelcome() {
  const el =
    document.getElementById(
      "welcomeText"
    );

  if (!el) return;

  const name =
    currentProfile?.naam ||
    currentSession?.user?.email ||
    "";

  el.textContent =
    name
      ? `Welkom ${name}. Registreer hier contacten en bestellingen van een beurs.`
      : "Registreer hier contacten en bestellingen van een beurs.";
}

// =========================================================
// INTERESSELIJST
// =========================================================

function renderInterestList() {
  const container =
    document.getElementById(
      "interestList"
    );

  if (!container) return;

  container.innerHTML =
    INTEREST_BEERS
      .map((beer, index) => `
        <div class="interest-row">
          <strong>
            ${escapeHtml(beer)}
          </strong>

          <label class="interest-choice">
            <input
              type="checkbox"
              data-interest-index="${index}"
              data-format="bottle"
            >
            Fles
          </label>

          <label class="interest-choice">
            <input
              type="checkbox"
              data-interest-index="${index}"
              data-format="tap"
            >
            Tap
          </label>
        </div>
      `)
      .join("");
}

function collectInterests() {
  return INTEREST_BEERS
    .map((beer, index) => {
      const bottle =
        document.querySelector(
          `[data-interest-index="${index}"][data-format="bottle"]`
        )?.checked === true;

      const tap =
        document.querySelector(
          `[data-interest-index="${index}"][data-format="tap"]`
        )?.checked === true;

      if (!bottle && !tap) {
        return null;
      }

      return {
        beer,
        bottle,
        tap
      };
    })
    .filter(Boolean);
}

// =========================================================
// PRODUCTEN / AANTALLEN
// =========================================================

function renderProducts() {
  const groups = {
    vat20:
      document.getElementById(
        "products-vat20"
      ),
    krat24:
      document.getElementById(
        "products-krat24"
      ),
    doos75:
      document.getElementById(
        "products-doos75"
      ),
    clip4:
      document.getElementById(
        "products-clip4"
      )
  };

  Object.entries(groups)
    .forEach(([category, container]) => {
      if (!container) return;

      container.innerHTML =
        BEURS_PRODUCTS
          .filter(
            product =>
              product.category === category
          )
          .map(product => `
            <div
              class="product-row"
              data-product-id="${product.id}"
            >
              <div class="product-name">
                ${escapeHtml(product.display_name)}
              </div>

              <div class="quantity-control">
                <button
                  class="qty-button"
                  type="button"
                  data-qty-action="minus"
                  data-product-id="${product.id}"
                >
                  −
                </button>

                <input
                  class="qty-input"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  step="1"
                  value="0"
                  data-qty-input="${product.id}"
                  aria-label="Aantal ${escapeHtml(product.display_name)}"
                >

                <button
                  class="qty-button"
                  type="button"
                  data-qty-action="plus"
                  data-product-id="${product.id}"
                >
                  +
                </button>
              </div>
            </div>
          `)
          .join("");
    });

  document
    .querySelectorAll(
      "[data-qty-action]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const id =
            Number(
              button.dataset.productId
            );

          const input =
            document.querySelector(
              `[data-qty-input="${id}"]`
            );

          if (!input) return;

          let value =
            Math.max(
              0,
              Number(input.value || 0)
            );

          if (
            button.dataset.qtyAction ===
            "plus"
          ) {
            value += 1;
          }
          else {
            value =
              Math.max(0, value - 1);
          }

          input.value = value;

          updateOrderSummary();
        }
      );
    });

  document
    .querySelectorAll(
      "[data-qty-input]"
    )
    .forEach(input => {
      input.addEventListener(
        "input",
        () => {
          input.value =
            Math.max(
              0,
              Math.floor(
                Number(input.value || 0)
              )
            );

          updateOrderSummary();
        }
      );
    });

  updateOrderSummary();
}

function getSelectedOrderItems() {
  return BEURS_PRODUCTS
    .map(product => {
      const input =
        document.querySelector(
          `[data-qty-input="${product.id}"]`
        );

      const quantity =
        Math.max(
          0,
          Math.floor(
            Number(
              input?.value || 0
            )
          )
        );

      if (!quantity) {
        return null;
      }

      return {
        product_id:
          product.id,
        article_number:
          product.article_number,
        barcode:
          product.barcode || null,
        product_name:
          product.name,
        display_name:
          product.display_name,
        category:
          product.category,
        quantity
      };
    })
    .filter(Boolean);
}

function updateOrderSummary() {
  const items =
    getSelectedOrderItems();

  const counts = {
    vat20:0,
    krat24:0,
    doos75:0,
    clip4:0
  };

  items.forEach(item => {
    counts[item.category] +=
      item.quantity;
  });

  setText(
    "count-vat20",
    counts.vat20
  );

  setText(
    "count-krat24",
    counts.krat24
  );

  setText(
    "count-doos75",
    counts.doos75
  );

  setText(
    "count-clip4",
    counts.clip4
  );

  const summary =
    document.getElementById(
      "orderSummary"
    );

  if (!summary) return;

  const total =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  if (!total) {
    summary.classList.add(
      "hidden"
    );
    summary.innerHTML = "";
    return;
  }

  summary.classList.remove(
    "hidden"
  );

  summary.innerHTML = `
    <strong>
      ${total} eenheden geselecteerd
    </strong>
    <div style="margin-top:5px;color:var(--muted);font-size:11px;">
      ${items.length} verschillende artikelen
    </div>
  `;
}

function resetOrderQuantities() {
  document
    .querySelectorAll(
      "[data-qty-input]"
    )
    .forEach(input => {
      input.value = 0;
    });

  updateOrderSummary();
}

// =========================================================
// FORMULIEREN
// =========================================================

function bindForms() {
  document
    .getElementById(
      "contactForm"
    )
    ?.addEventListener(
      "submit",
      saveContact
    );

  document
    .getElementById(
      "orderForm"
    )
    ?.addEventListener(
      "submit",
      saveOrder
    );

  document
    .getElementById(
      "exportContactsButton"
    )
    ?.addEventListener(
      "click",
      () => exportContactsCsv()
    );

  document
    .getElementById(
      "exportOrdersButton"
    )
    ?.addEventListener(
      "click",
      () => exportOrdersCsv()
    );
}

// =========================================================
// CONTACT OPSLAAN
// =========================================================

async function saveContact(event) {
  event.preventDefault();

  const form = event.currentTarget;

  if (!form.reportValidity()) {
    return;
  }

  const button =
    document.getElementById(
      "saveContactButton"
    );

  const formData =
    new FormData(form);

  const representativeId =
    String(
      formData.get(
        "representative_id"
      ) || ""
    );

  const representative =
    representatives.find(
      item =>
        item.id === representativeId
    );

  const payload = {
    created_by:
      currentSession.user.id,

    representative_id:
      representativeId,

    representative_name:
      representative?.naam ||
      representative?.email ||
      null,

    fair_name:
      cleanText(
        formData.get("fair_name")
      ),

    business_name:
      cleanText(
        formData.get(
          "business_name"
        )
      ),

    customer_type:
      cleanText(
        formData.get(
          "customer_type"
        )
      ),

    contact_person:
      cleanText(
        formData.get(
          "contact_person"
        )
      ),

    address:
      cleanText(
        formData.get("address")
      ),

    city:
      cleanText(
        formData.get("city")
      ),

    email:
      cleanText(
        formData.get("email")
      ),

    phone:
      cleanText(
        formData.get("phone")
      ),

    supplier:
      cleanText(
        formData.get("supplier")
      ),

    interests:
      collectInterests(),

    reason:
      cleanText(
        formData.get("reason")
      ),

    followup_status:
      cleanText(
        formData.get(
          "followup_status"
        )
      ) || "to_contact"
  };

  try {
    setBusy(
      button,
      true,
      "Contact opslaan..."
    );

    const {
      error
    } =
      await supabaseClient
        .from("fair_contacts")
        .insert(payload);

    if (error) throw error;

    showMessage(
      "contactMessage",
      "✓ Beurscontact opgeslagen.",
      false
    );

    form.reset();
    fillRepresentativeSelects();
    renderInterestList();

    await refreshAllData();
  }
  catch (error) {
    console.error(
      "BEURSCONTACT OPSLAAN FOUT:",
      error
    );

    showMessage(
      "contactMessage",
      error?.message ||
      "Contact kon niet worden opgeslagen.",
      true
    );
  }
  finally {
    setBusy(
      button,
      false,
      "Contact opslaan"
    );
  }
}

// =========================================================
// BESTELLING OPSLAAN
// =========================================================

async function saveOrder(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  if (!form.reportValidity()) {
    return;
  }

  const items =
    getSelectedOrderItems();

  if (!items.length) {
    showMessage(
      "orderMessage",
      "Selecteer minstens één artikel.",
      true
    );
    return;
  }

  const button =
    document.getElementById(
      "saveOrderButton"
    );

  const formData =
    new FormData(form);

  const representativeId =
    String(
      formData.get(
        "representative_id"
      ) || ""
    );

  const representative =
    representatives.find(
      item =>
        item.id === representativeId
    );

  try {
    setBusy(
      button,
      true,
      "Bestelling opslaan..."
    );

    const {
      data: order,
      error: orderError
    } =
      await supabaseClient
        .from("fair_orders")
        .insert({
          created_by:
            currentSession.user.id,

          representative_id:
            representativeId,

          representative_name:
            representative?.naam ||
            representative?.email ||
            null,

          fair_name:
            cleanText(
              formData.get("fair_name")
            ),

          business_name:
            cleanText(
              formData.get(
                "business_name"
              )
            ),

          contact_person:
            cleanText(
              formData.get(
                "contact_person"
              )
            ),

          supplier:
            cleanText(
              formData.get("supplier")
            ),

          note:
            cleanText(
              formData.get("note")
            ),

          status:
            "new"
        })
        .select("id")
        .single();

    if (orderError) {
      throw orderError;
    }

    const orderItems =
      items.map(item => ({
        order_id:
          order.id,

        product_id:
          item.product_id,

        article_number:
          item.article_number,

        barcode:
          item.barcode,

        product_name:
          item.product_name,

        display_name:
          item.display_name,

        category:
          item.category,

        quantity:
          item.quantity
      }));

    const {
      error: itemError
    } =
      await supabaseClient
        .from("fair_order_items")
        .insert(orderItems);

    if (itemError) {
      throw itemError;
    }

    showMessage(
      "orderMessage",
      "✓ Beursbestelling opgeslagen.",
      false
    );

    form.reset();
    fillRepresentativeSelects();
    resetOrderQuantities();

    await refreshAllData();
  }
  catch (error) {
    console.error(
      "BEURSBESTELLING OPSLAAN FOUT:",
      error
    );

    showMessage(
      "orderMessage",
      error?.message ||
      "Bestelling kon niet worden opgeslagen.",
      true
    );
  }
  finally {
    setBusy(
      button,
      false,
      "Bestelling opslaan"
    );
  }
}

// =========================================================
// DATA LADEN
// =========================================================

async function refreshAllData() {
  await Promise.all([
    loadMyContacts(),
    loadMyOrders()
  ]);

  updateCounters();
  renderContacts();
  renderOrders();
  renderFollowups();

  if (isAdminUser) {
    await loadAdminData();
    renderAdminPanels();
  }
}

async function loadMyContacts() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("fair_contacts")
      .select("*")
      .eq(
        "representative_id",
        currentSession.user.id
      )
      .order(
        "created_at",
        { ascending:false }
      );

  if (error) throw error;

  myContacts = data || [];
}

async function loadMyOrders() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("fair_orders")
      .select(`
        *,
        fair_order_items (
          id,
          product_id,
          article_number,
          barcode,
          product_name,
          display_name,
          category,
          quantity
        )
      `)
      .eq(
        "representative_id",
        currentSession.user.id
      )
      .order(
        "created_at",
        { ascending:false }
      );

  if (error) throw error;

  myOrders = data || [];
}

function updateCounters() {
  setText(
    "contactsCount",
    myContacts.length
  );

  setText(
    "ordersCount",
    myOrders.length
  );

  setText(
    "followupsCount",
    myContacts.filter(
      contact =>
        ![
          "customer",
          "no_interest"
        ].includes(
          contact.followup_status
        )
    ).length
  );
}

// =========================================================
// RENDER CONTACTEN
// =========================================================

function renderContacts() {
  renderContactRecords("contactsList", myContacts);
}

function renderContactRecords(containerId, contacts) {
  const container =
    document.getElementById(
      containerId
    );

  if (!container) return;

  if (!contacts.length) {
    container.innerHTML =
      emptyState(
        "Nog geen beurscontacten."
      );
    return;
  }

  container.innerHTML =
    contacts
      .map(contact => `
        <details class="record-card">
          <summary>
            <div>
              <strong>
                ${escapeHtml(contact.business_name || "Onbekende zaak")}
              </strong>
              <small>
                ${escapeHtml(contact.fair_name || "Geen beurs")}
                ·
                ${escapeHtml(contact.representative_name || "")}
                ·
                ${formatDate(contact.created_at)}
              </small>
            </div>

            <span class="record-badge">
              ${escapeHtml(customerTypeLabel(contact.customer_type))}
            </span>
          </summary>

          <div class="record-body">
            ${infoLine("Contactpersoon", contact.contact_person)}
            ${infoLine("Gemeente", contact.city)}
            ${infoLine("E-mail", contact.email)}
            ${infoLine("Telefoon", contact.phone)}
            ${infoLine("Bierhandelaar", contact.supplier)}
            ${infoLine("Opvolging", followupLabel(contact.followup_status))}
            ${infoLine("Reden", contact.reason)}
            ${renderInterestSummary(contact.interests)}
          </div>
        </details>
      `)
      .join("");
}

// =========================================================
// RENDER BESTELLINGEN
// =========================================================

function renderOrders() {
  renderOrderRecords("ordersList", myOrders);
}

function renderOrderRecords(containerId, orders) {
  const container =
    document.getElementById(
      containerId
    );

  if (!container) return;

  if (!orders.length) {
    container.innerHTML =
      emptyState(
        "Nog geen beursbestellingen."
      );
    return;
  }

  container.innerHTML =
    orders
      .map(order => {
        const items =
          order.fair_order_items || [];

        const total =
          items.reduce(
            (sum, item) =>
              sum +
              Number(item.quantity || 0),
            0
          );

        return `
          <details class="record-card">
            <summary>
              <div>
                <strong>
                  ${escapeHtml(order.business_name || "Onbekende klant")}
                </strong>
                <small>
                  ${escapeHtml(order.fair_name || "Geen beurs")}
                  ·
                  ${escapeHtml(order.representative_name || "")}
                  ·
                  ${formatDate(order.created_at)}
                </small>
              </div>

              <span class="record-badge">
                ${total} st.
              </span>
            </summary>

            <div class="record-body">
              ${infoLine("Contactpersoon", order.contact_person)}
              ${infoLine("Bierhandelaar", order.supplier)}
              ${infoLine("Opmerking", order.note)}

              <div class="record-items">
                ${items
                  .map(item => `
                    <div class="record-item">
                      <span>
                        ${escapeHtml(item.display_name || item.product_name)}
                      </span>
                      <strong>
                        ${Number(item.quantity || 0)}
                      </strong>
                    </div>
                  `)
                  .join("")
                }
              </div>
            </div>
          </details>
        `;
      })
      .join("");
}

// =========================================================
// RENDER OPVOLGING
// =========================================================

function renderFollowups() {
  const container =
    document.getElementById(
      "followupsList"
    );

  if (!container) return;

  const open =
    myContacts.filter(
      contact =>
        ![
          "customer",
          "no_interest"
        ].includes(
          contact.followup_status
        )
    );

  if (!open.length) {
    container.innerHTML =
      emptyState(
        "Geen open commerciële opvolging."
      );
    return;
  }

  container.innerHTML =
    open
      .map(contact => `
        <details class="record-card">
          <summary>
            <div>
              <strong>
                ${escapeHtml(contact.business_name || "Onbekende zaak")}
              </strong>
              <small>
                ${escapeHtml(contact.contact_person || "Geen contactpersoon")}
              </small>
            </div>

            <span class="record-badge">
              ${escapeHtml(followupLabel(contact.followup_status))}
            </span>
          </summary>

          <div class="record-body">
            ${infoLine("Beurs", contact.fair_name)}
            ${infoLine("Telefoon", contact.phone)}
            ${infoLine("E-mail", contact.email)}
            ${infoLine("Reden", contact.reason)}
          </div>
        </details>
      `)
      .join("");
}

// =========================================================
// CSV EXPORT CONTACTEN
// =========================================================

function exportContactsCsv(
  contacts = myContacts,
  filename = `achel-beurscontacten-${todayString()}.csv`
) {
  if (!contacts.length) {
    alert(
      "Er zijn geen contacten om te exporteren."
    );
    return;
  }

  const rows = [
    [
      "Datum",
      "Beurs",
      "Vertegenwoordiger",
      "Horecazaak",
      "Type klant",
      "Contactpersoon",
      "Adres",
      "Gemeente",
      "Email",
      "Telefoon",
      "Leverancier/Bierhandelaar",
      "Interesse",
      "Reden",
      "Opvolgstatus"
    ]
  ];

  contacts.forEach(contact => {
    rows.push([
      formatDateForExport(
        contact.created_at
      ),
      contact.fair_name || "",
      contact.representative_name || "",
      contact.business_name || "",
      customerTypeLabel(
        contact.customer_type
      ),
      contact.contact_person || "",
      contact.address || "",
      contact.city || "",
      contact.email || "",
      contact.phone || "",
      contact.supplier || "",
      interestsToText(
        contact.interests
      ),
      contact.reason || "",
      followupLabel(
        contact.followup_status
      )
    ]);
  });

  downloadCsv(
    rows,
    filename
  );
}

// =========================================================
// CSV EXPORT BESTELLINGEN
// Elke orderregel krijgt ID + artikelnummer.
// =========================================================

function exportOrdersCsv(
  orders = myOrders,
  filename = `achel-beursbestellingen-${todayString()}.csv`
) {
  if (!orders.length) {
    alert(
      "Er zijn geen bestellingen om te exporteren."
    );
    return;
  }

  const rows = [
    [
      "Datum",
      "Beurs",
      "Vertegenwoordiger",
      "Horecazaak/Klant",
      "Contactpersoon",
      "Leverancier/Bierhandelaar",
      "ID",
      "Artikelnummer",
      "Barcode",
      "Artikel",
      "Categorie",
      "Aantal",
      "Opmerking"
    ]
  ];

  orders.forEach(order => {
    (order.fair_order_items || [])
      .forEach(item => {
        rows.push([
          formatDateForExport(
            order.created_at
          ),
          order.fair_name || "",
          order.representative_name || "",
          order.business_name || "",
          order.contact_person || "",
          order.supplier || "",
          item.product_id ?? "",
          item.article_number || "",
          item.barcode || "",
          item.product_name || "",
          categoryLabel(
            item.category
          ),
          item.quantity || 0,
          order.note || ""
        ]);
      });
  });

  downloadCsv(
    rows,
    filename
  );
}

// =========================================================
// BEHEER (commercieel directeur / boekhoudster)
// Zelfde data-tabellen als hierboven, maar zonder filter op
// representative_id: dit toont alle vertegenwoordigers.
// De echte toegangsbeperking gebeurt via Supabase RLS.
// =========================================================

async function loadAdminData() {
  const [contactsResult, ordersResult] =
    await Promise.all([
      supabaseClient
        .from("fair_contacts")
        .select("*")
        .order("created_at", { ascending:false }),

      supabaseClient
        .from("fair_orders")
        .select(`
          *,
          fair_order_items (
            id,
            product_id,
            article_number,
            barcode,
            product_name,
            display_name,
            category,
            quantity
          )
        `)
        .order("created_at", { ascending:false })
    ]);

  if (contactsResult.error) throw contactsResult.error;
  if (ordersResult.error) throw ordersResult.error;

  adminContacts = contactsResult.data || [];
  adminOrders = ordersResult.data || [];
}

function fillAdminRepFilter() {
  const select =
    document.getElementById("adminRepFilter");

  if (!select) return;

  select.innerHTML =
    `<option value="all">Alle vertegenwoordigers</option>` +
    representatives
      .map(profile => `
        <option value="${escapeHtml(profile.id)}">
          ${escapeHtml(profile.naam || profile.email || "Onbekend")}
        </option>
      `)
      .join("");
}

function bindAdminControls() {
  document
    .getElementById("adminRepFilter")
    ?.addEventListener("change", event => {
      adminRepFilterValue = event.target.value || "all";
      renderAdminPanels();
    });

  document
    .querySelectorAll("[data-admin-tab]")
    .forEach(tabButton => {
      tabButton.addEventListener("click", () => {
        document
          .querySelectorAll(".admin-tab")
          .forEach(button =>
            button.classList.remove("active")
          );

        document
          .querySelectorAll(".admin-panel")
          .forEach(panel =>
            panel.classList.add("hidden")
          );

        tabButton.classList.add("active");

        document
          .getElementById(tabButton.dataset.adminTab)
          ?.classList.remove("hidden");
      });
    });

  document
    .getElementById("exportAdminContactsButton")
    ?.addEventListener("click", () =>
      exportContactsCsv(
        filteredAdminContacts(),
        `achel-beurscontacten-alle-${todayString()}.csv`
      )
    );

  document
    .getElementById("exportAdminOrdersButton")
    ?.addEventListener("click", () =>
      exportOrdersCsv(
        filteredAdminOrders(),
        `achel-beursbestellingen-alle-${todayString()}.csv`
      )
    );
}

function filteredAdminContacts() {
  if (adminRepFilterValue === "all") {
    return adminContacts;
  }

  return adminContacts.filter(
    contact => contact.representative_id === adminRepFilterValue
  );
}

function filteredAdminOrders() {
  if (adminRepFilterValue === "all") {
    return adminOrders;
  }

  return adminOrders.filter(
    order => order.representative_id === adminRepFilterValue
  );
}

function renderAdminPanels() {
  const contacts = filteredAdminContacts();
  const orders = filteredAdminOrders();

  renderContactRecords("adminContactsList", contacts);
  renderOrderRecords("adminOrdersList", orders);

  setText(
    "adminContactsCount",
    `${contacts.length} contact${contacts.length === 1 ? "" : "en"}`
  );

  setText(
    "adminOrdersCount",
    `${orders.length} bestelling${orders.length === 1 ? "" : "en"}`
  );
}

// =========================================================
// HULPFUNCTIES
// =========================================================

function categoryLabel(value) {
  const labels = {
    vat20:"Vat 20L",
    krat24:"Krat 24 x 33cl",
    doos75:"Doos 6 x 75cl",
    clip4:"Clip 4 x 33cl"
  };

  return labels[value] || value || "";
}

function customerTypeLabel(value) {
  if (value === "existing") {
    return "Bestaande klant";
  }

  if (value === "new") {
    return "Nieuwe klant";
  }

  return "Onbekend";
}

function followupLabel(value) {
  const labels = {
    to_contact:"Te contacteren",
    contacted:"Contact gehad",
    tasting:"Proefafspraak",
    customer:"Klant geworden",
    no_interest:"Geen interesse"
  };

  return labels[value] || value || "";
}

function renderInterestSummary(interests) {
  const list =
    Array.isArray(interests)
      ? interests
      : [];

  if (!list.length) {
    return "";
  }

  return `
    <div style="margin-top:8px;">
      <strong>Interesse</strong>
      <div class="record-items">
        ${list
          .map(item => {
            const formats = [];

            if (item.bottle) {
              formats.push("fles");
            }

            if (item.tap) {
              formats.push("tap");
            }

            return `
              <div class="record-item">
                <span>
                  ${escapeHtml(item.beer || "")}
                </span>
                <small>
                  ${escapeHtml(formats.join(" + "))}
                </small>
              </div>
            `;
          })
          .join("")
        }
      </div>
    </div>
  `;
}

function interestsToText(interests) {
  const list =
    Array.isArray(interests)
      ? interests
      : [];

  return list
    .map(item => {
      const formats = [];

      if (item.bottle) {
        formats.push("fles");
      }

      if (item.tap) {
        formats.push("tap");
      }

      return `${item.beer} (${formats.join(" + ")})`;
    })
    .join("; ");
}

function infoLine(label, value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "";
  }

  return `
    <p>
      <strong>${escapeHtml(label)}:</strong>
      ${escapeHtml(value)}
    </p>
  `;
}

function emptyState(text) {
  return `
    <div class="empty-state">
      ${escapeHtml(text)}
    </div>
  `;
}

function showMessage(
  id,
  message,
  isError
) {
  const el =
    document.getElementById(id);

  if (!el) return;

  el.textContent = message;

  el.classList.remove(
    "hidden",
    "success",
    "error"
  );

  el.classList.add(
    isError
      ? "error"
      : "success"
  );
}

function showGlobalError(message) {
  console.error(message);
}

function setBusy(
  button,
  busy,
  label
) {
  if (!button) return;

  button.disabled = busy;
  button.textContent = label;
}

function setText(id, value) {
  const el =
    document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
}

function cleanText(value) {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(
    "nl-BE",
    {
      day:"2-digit",
      month:"2-digit",
      year:"numeric"
    }
  ).format(new Date(value));
}

function formatDateForExport(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(
    "nl-BE",
    {
      day:"2-digit",
      month:"2-digit",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit"
    }
  ).format(new Date(value));
}

function todayString() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function downloadCsv(rows, filename) {
  const separator = ";";

  const csv =
    rows
      .map(row =>
        row
          .map(value =>
            `"${String(value ?? "")
              .replaceAll('"', '""')}"`
          )
          .join(separator)
      )
      .join("\r\n");

  // UTF-8 BOM zodat Excel accenten correct toont.
  const blob =
    new Blob(
      ["\uFEFF", csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
