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

const ADMIN_ROLES = ["admin", "commercieel_directeur", "boekhoudster"];
let isAdminUser = false;
let adminContacts = [];
let adminOrders = [];
let adminRepFilterValue = "all";

// Beurzen die beheer instelt (tabel "fairs").
// Enkel admin en commercieel directeur mogen ze aanmaken/wijzigen.
const FAIR_MANAGER_ROLES = ["admin", "commercieel_directeur"];
const LAST_FAIR_KEY = "achel_beurzen_laatste_beurs";
let fairs = [];
let fairsAvailable = true;
let isFairManager = false;
let editingFairId = null;
let editingPromos = [];

const PROMO_CATEGORIES = [
  { value:"vat20", label:"Vaten 20L", short:"Vaten" },
  { value:"krat24", label:"Kratten 24 × 33cl", short:"Kratten" },
  { value:"doos75", label:"Dozen 6 × 75cl", short:"Dozen" },
  { value:"clip4", label:"Clips 4 × 33cl", short:"Clips" },
  { value:"gvp", label:"GVP", short:"GVP" }
];

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
  { id:14348, article_number:"000251", barcode:"5425007659849", name:"Achel Mix Q Clip 4 x 33cl (Quadrupel Gold + Quadrupel Dark)", display_name:"Achel Mix Q Clip 4 × 33cl", category:"clip4" },

  { id:73, article_number:"000060", barcode:"", name:"Achel GVP 5 x (4 x 33cl + glas)", display_name:"Achel GVP 5 × (4 × 33cl + glas)", category:"gvp" }
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

    await loadFairs();
    bindFairSelects();
    fillFairSelects();

    isAdminUser = ADMIN_ROLES.includes(currentProfile?.rol);
    isFairManager = FAIR_MANAGER_ROLES.includes(currentProfile?.rol);

    if (isFairManager && fairsAvailable) {
      document
        .getElementById("fairSetupActionCard")
        ?.classList.remove("hidden");

      document
        .getElementById("adminLinks")
        ?.classList.remove("hidden");

      bindFairAdmin();
      renderFairsList();
    }

    if (isAdminUser) {
      document
        .getElementById("adminActionCard")
        ?.classList.remove("hidden");

      document
        .getElementById("adminLinks")
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

  // Grote kop (welkom, tellers, knoppen) enkel op het startscherm,
  // zodat elk ander scherm meteen bovenaan begint.
  document
    .getElementById("homeHeader")
    ?.classList.toggle("hidden", viewId !== "homeView");

  currentView = viewId;

  // Meteen naar boven (niet "smooth"): de kop verdwijnt tegelijk,
  // en op iPhone bleef een vloeiende scroll dan halverwege hangen.
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.scrollTo(0, 0));
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
          "commercieel_directeur"
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

  // Compacte lijst: korte naam + 2 tikknopjes (Fles / Tap).
  container.innerHTML =
    INTEREST_BEERS
      .map((beer, index) => `
        <div class="interest-row">
          <span class="interest-name">
            ${escapeHtml(beer.replace(/^Achel /, ""))}
          </span>

          <label class="interest-chip">
            <input
              type="checkbox"
              data-interest-index="${index}"
              data-format="bottle"
            >
            <span>Fles</span>
          </label>

          <label class="interest-chip">
            <input
              type="checkbox"
              data-interest-index="${index}"
              data-format="tap"
            >
            <span>Tap</span>
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
      ),
    gvp:
      document.getElementById(
        "products-gvp"
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
                <span class="promo-free hidden" data-promo-free="${product.id}"></span>
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
  const items =
    BEURS_PRODUCTS
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
          quantity,
          free_quantity:
            0,
          promo_label:
            null
        };
      })
      .filter(Boolean);

  applyPromotions(items);

  return items;
}

function updateOrderSummary() {
  const items =
    getSelectedOrderItems();

  const counts = {
    vat20:0,
    krat24:0,
    doos75:0,
    clip4:0,
    gvp:0
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

  setText(
    "count-gvp",
    counts.gvp
  );

  updatePromoBadges(items);
  renderFreePicker();

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

  const totalFree =
    items.reduce(
      (sum, item) =>
        sum + (item.free_quantity || 0),
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
    ${totalFree
      ? `<div class="summary-free">+ ${totalFree} gratis via beursactie</div>`
      : ""
    }
    <div style="margin-top:5px;color:var(--muted);font-size:11px;">
      ${items.length} verschillende artikelen
    </div>
  `;
}

function resetOrderQuantities() {
  resetFreeAllocations();

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
    .getElementById("freePicker")
    ?.addEventListener("click", handleFreePickerClick);

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
      () => exportOrdersExcel()
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

  if (!ensureFairChosen("contactFair", "contactMessage")) {
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
    fillFairSelects();
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

  if (!ensureFairChosen("orderFair", "orderMessage")) {
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

  const openFree = pendingFreeChoices();

  if (openFree > 0) {
    showMessage(
      "orderMessage",
      `Kies nog ${openFree} gratis bier${openFree === 1 ? "" : "en"} bij de beursactie.`,
      true
    );
    document.getElementById("freePicker")?.scrollIntoView({ behavior:"smooth", block:"center" });
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

          fair_id:
            selectedFairId("orderFair"),

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
          item.quantity,

        free_quantity:
          item.free_quantity || 0,

        promo_label:
          item.promo_label
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
    fillFairSelects();
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
          quantity,
          free_quantity,
          promo_label
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

  const hint =
    document.getElementById(
      "statsEmptyHint"
    );

  if (hint) {
    hint.classList.toggle(
      "hidden",
      myContacts.length > 0 ||
        myOrders.length > 0
    );
  }
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
                        ${Number(item.quantity || 0)}${Number(item.free_quantity || 0)
                          ? ` <span class="free-tag">+${Number(item.free_quantity)} gratis</span>`
                          : ""}
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
// EXCEL EXPORT BESTELLINGEN (boekhouding)
// Gebruikt de officiële bierlijst (BEURS_PRODUCTS) met de
// Douano-code en de Douano-artikelnaam, zodat de boekhouding
// elke regel rechtstreeks kan overnemen.
// Tab 1 "Bestellingen": elke bestelde regel.
// Tab 2 "Totaal per artikel": de volledige bierlijst met totalen.
// =========================================================

function productForItem(item) {
  return BEURS_PRODUCTS.find(product =>
    Number(product.id) === Number(item.product_id)
  ) || null;
}

function exportOrdersExcel(
  orders = myOrders,
  filename = `achel-beursbestellingen-${todayString()}.xlsx`
) {
  if (!orders.length) {
    alert(
      "Er zijn geen bestellingen om te exporteren."
    );
    return;
  }

  if (!window.XLSX) {
    alert(
      "Excel kon niet geladen worden. Controleer je internetverbinding en probeer opnieuw."
    );
    return;
  }

  const detailRows = [];
  const totals = new Map();

  orders.forEach(order => {
    (order.fair_order_items || [])
      .forEach(item => {
        const product = productForItem(item);
        const ordered = Number(item.quantity || 0);
        const free = Number(item.free_quantity || 0);
        const code = product?.article_number || item.article_number || "";

        detailRows.push({
          "Datum": formatDateForExport(order.created_at),
          "Bestelnr.": String(order.id || "").slice(0, 8).toUpperCase(),
          "Beurs": order.fair_name || "",
          "Vertegenwoordiger": order.representative_name || "",
          "Klant / horecazaak": order.business_name || "",
          "Contactpersoon": order.contact_person || "",
          "Leverancier / bierhandelaar": order.supplier || "",
          "Douano-code": code,
          "Artikel (Douano)": product?.name || item.product_name || "",
          "Verpakking": categoryLabel(product?.category || item.category),
          "Besteld": ordered,
          "Gratis (beursactie)": free,
          "Totaal te leveren": ordered + free,
          "Beursactie": item.promo_label || "",
          "Intern ID": product?.id ?? item.product_id ?? "",
          "Opmerking": order.note || ""
        });

        const key = code || item.product_name || "";
        const total =
          totals.get(key) ||
          { ordered:0, free:0, name:product?.name || item.product_name || "", category:product?.category || item.category, id:product?.id ?? item.product_id ?? "" };

        total.ordered += ordered;
        total.free += free;
        totals.set(key, total);
      });
  });

  // Volledige bierlijst, ook bieren die (nog) niet besteld zijn.
  const summaryRows =
    BEURS_PRODUCTS.map(product => {
      const total = totals.get(product.article_number);
      totals.delete(product.article_number);

      return {
        "Douano-code": product.article_number,
        "Artikel (Douano)": product.name,
        "Verpakking": categoryLabel(product.category),
        "Besteld": total?.ordered || 0,
        "Gratis (beursactie)": total?.free || 0,
        "Totaal te leveren": (total?.ordered || 0) + (total?.free || 0),
        "Intern ID": product.id
      };
    });

  // Eventuele artikels die niet (meer) in de lijst staan.
  totals.forEach((total, code) => {
    summaryRows.push({
      "Douano-code": code,
      "Artikel (Douano)": total.name,
      "Verpakking": categoryLabel(total.category),
      "Besteld": total.ordered,
      "Gratis (beursactie)": total.free,
      "Totaal te leveren": total.ordered + total.free,
      "Intern ID": total.id
    });
  });

  const sum = key =>
    summaryRows.reduce((acc, row) => acc + Number(row[key] || 0), 0);

  summaryRows.push({
    "Douano-code": "",
    "Artikel (Douano)": "TOTAAL",
    "Verpakking": "",
    "Besteld": sum("Besteld"),
    "Gratis (beursactie)": sum("Gratis (beursactie)"),
    "Totaal te leveren": sum("Totaal te leveren"),
    "Intern ID": ""
  });

  const workbook = XLSX.utils.book_new();

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  detailSheet["!cols"] = [
    { wch:17 }, { wch:10 }, { wch:24 }, { wch:20 }, { wch:28 }, { wch:20 },
    { wch:24 }, { wch:12 }, { wch:46 }, { wch:16 }, { wch:9 }, { wch:12 },
    { wch:12 }, { wch:36 }, { wch:9 }, { wch:30 }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [
    { wch:12 }, { wch:52 }, { wch:16 }, { wch:9 }, { wch:12 }, { wch:12 }, { wch:9 }
  ];

  // Douano-codes als tekst houden, zodat de nullen vooraan blijven.
  [detailSheet, summarySheet].forEach(sheet => {
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const header = [];

    for (let c = range.s.c; c <= range.e.c; c++) {
      header[c] = sheet[XLSX.utils.encode_cell({ r:0, c })]?.v;
    }

    const codeCol = header.indexOf("Douano-code");
    if (codeCol < 0) return;

    for (let r = 1; r <= range.e.r; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c:codeCol })];
      if (cell) {
        cell.t = "s";
        cell.v = String(cell.v);
        cell.z = "@";
      }
    }
  });

  XLSX.utils.book_append_sheet(workbook, detailSheet, "Bestellingen");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Totaal per artikel");

  XLSX.writeFile(workbook, filename);
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
            quantity,
            free_quantity,
            promo_label
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
      exportOrdersExcel(
        filteredAdminOrders(),
        `achel-beursbestellingen-alle-${todayString()}.xlsx`
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
// BEURZEN (ingesteld door beheer)
// Beheer maakt een beurs aan met eigen beursacties.
// Vertegenwoordigers kiezen de beurs in een keuzelijst; de
// acties worden dan automatisch toegepast op de bestelling.
// =========================================================

async function loadFairs() {
  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .from("fairs")
        .select("*")
        .order("start_date", { ascending:false, nullsFirst:false })
        .order("created_at", { ascending:false });

    if (error) throw error;

    fairs = (data || []).map(fair => ({
      ...fair,
      promotions: Array.isArray(fair.promotions) ? fair.promotions : []
    }));
    fairsAvailable = true;
  }
  catch (error) {
    // Tabel bestaat nog niet (SQL nog niet uitgevoerd) of geen
    // verbinding: dan werkt de app zoals vroeger met vrije tekst.
    console.warn("BEURZEN LADEN MISLUKT:", error);
    fairs = [];
    fairsAvailable = false;
  }
}

function activeFairs() {
  return fairs.filter(fair => fair.active);
}

function findFair(id) {
  return fairs.find(fair => fair.id === id) || null;
}

function fairOptionLabel(fair) {
  const dates = fairDateText(fair);
  return dates ? `${fair.name} (${dates})` : fair.name;
}

function fairDateText(fair) {
  if (!fair) return "";
  const start = fair.start_date ? formatDate(fair.start_date) : "";
  const end = fair.end_date ? formatDate(fair.end_date) : "";
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || "";
}

function fillFairSelects() {
  const list = activeFairs();
  const remembered = readLastFair();

  document
    .querySelectorAll(".fair-select")
    .forEach(select => {
      if (!list.length) {
        select.innerHTML =
          `<option value="">Nog geen beurs ingesteld — vraag beheer</option>`;
        select.disabled = true;
        syncFairSelect(select);
        return;
      }

      select.disabled = false;
      select.innerHTML =
        `<option value="">Kies een beurs...</option>` +
        list
          .map(fair => `
            <option value="${escapeHtml(fair.id)}">
              ${escapeHtml(fairOptionLabel(fair))}
            </option>
          `)
          .join("");

      // Standaard: laatst gekozen beurs, of de enige actieve beurs.
      if (remembered && list.some(fair => fair.id === remembered)) {
        select.value = remembered;
      }
      else if (list.length === 1) {
        select.value = list[0].id;
      }

      syncFairSelect(select);
    });

  resetFreeAllocations();
  updateOrderPromos();
  updateOrderSummary();
}

function bindFairSelects() {
  document
    .querySelectorAll(".fair-select")
    .forEach(select => {
      select.addEventListener("change", () => {
        syncFairSelect(select);

        if (select.value) {
          saveLastFair(select.value);
        }

        if (select.id === "orderFair") {
          resetFreeAllocations();
          updateOrderPromos();
          updateOrderSummary();
        }
      });
    });
}

// Zet de beursnaam in het verborgen veld zodat het formulier
// de naam meestuurt. Enkel beurzen die beheer instelde zijn
// mogelijk; zelf een beurs intypen kan niet meer.
function syncFairSelect(select) {
  const input =
    document.getElementById(select.dataset.nameInput);

  if (input) {
    input.value = findFair(select.value)?.name || "";
  }
}

function selectedFairId(selectId) {
  return document.getElementById(selectId)?.value || null;
}

function ensureFairChosen(selectId, messageId) {
  const select = document.getElementById(selectId);

  if (findFair(select?.value)) {
    return true;
  }

  showMessage(
    messageId,
    activeFairs().length
      ? "Kies eerst een beurs."
      : "Er is nog geen beurs ingesteld. Vraag beheer om de beurs aan te maken.",
    true
  );

  select?.focus();
  return false;
}

function readLastFair() {
  try {
    return localStorage.getItem(LAST_FAIR_KEY) || "";
  }
  catch {
    return "";
  }
}

function saveLastFair(id) {
  try {
    localStorage.setItem(LAST_FAIR_KEY, id);
  }
  catch {
    // Niet erg: dan wordt de keuze gewoon niet onthouden.
  }
}

// ---------- Beursacties berekenen ----------

// Gratis bieren per gemengde actie: welk bier krijgt de klant gratis.
// { [actie-id]: { manual: true/false, map: { [product-id]: aantal } } }
let freeAllocations = {};
// Resultaat van de laatste berekening, voor het keuzeblok.
let lastPromoState = [];

function currentOrderFair() {
  return findFair(selectedFairId("orderFair"));
}

function freePromos() {
  const fair = currentOrderFair();
  if (!fair) return [];

  return fair.promotions.filter(promo =>
    promo.type === "free" &&
    Number(promo.buy) > 0 &&
    Number(promo.free) > 0 &&
    Array.isArray(promo.categories) &&
    promo.categories.length
  );
}

function promoForCategory(category) {
  return freePromos().find(promo =>
    promo.categories.includes(category)
  ) || null;
}

// Oude acties zonder keuze gelden als "gemengd".
function isMixed(promo) {
  return promo?.mixed !== false;
}

function freeUnitsFor(quantity, promo) {
  if (!promo) return 0;
  return Math.floor(quantity / Number(promo.buy)) * Number(promo.free);
}

function resetFreeAllocations() {
  freeAllocations = {};
}

// Past de beursacties toe op de geselecteerde artikelen.
// - Per artikel: 12 Tripel bij 10+2 → 2 Tripel gratis.
// - Gemengd: 5 Tripel + 5 Dubbel telt samen als 10 → 2 gratis,
//   de vertegenwoordiger kiest welke bieren gratis zijn.
function applyPromotions(items) {
  lastPromoState = [];
  const claimed = new Set();

  freePromos().forEach(promo => {
    const group =
      items.filter(item =>
        !claimed.has(item.product_id) &&
        promo.categories.includes(item.category)
      );

    group.forEach(item => claimed.add(item.product_id));

    if (!group.length) return;

    const label = promoLabel(promo);

    if (!isMixed(promo)) {
      group.forEach(item => {
        item.free_quantity = freeUnitsFor(item.quantity, promo);
        item.promo_label = item.free_quantity ? label : null;
      });
      return;
    }

    const total =
      group.reduce((sum, item) => sum + item.quantity, 0);

    const earned = freeUnitsFor(total, promo);
    const map = allocationFor(promo, group, earned);

    group.forEach(item => {
      item.free_quantity = map[item.product_id] || 0;
      item.promo_label = item.free_quantity ? label : null;
    });

    const assigned =
      group.reduce((sum, item) => sum + item.free_quantity, 0);

    lastPromoState.push({
      promo,
      total,
      earned,
      assigned,
      group
    });
  });
}

function allocationFor(promo, group, earned) {
  const state =
    freeAllocations[promo.id] ||
    (freeAllocations[promo.id] = { manual:false, map:{} });

  const ids = new Set(group.map(item => item.product_id));

  // Bieren die niet meer besteld zijn, vallen weg.
  Object.keys(state.map).forEach(id => {
    if (!ids.has(Number(id))) delete state.map[id];
  });

  if (!state.manual) {
    state.map = autoAllocate(group, earned);
    return state.map;
  }

  // Te veel gekozen (bv. aantal verlaagd): neem weg bij het grootste.
  let assigned =
    Object.values(state.map).reduce((sum, n) => sum + n, 0);

  while (assigned > earned) {
    const biggest =
      Object.entries(state.map).sort((a, b) => b[1] - a[1])[0];
    if (!biggest) break;
    state.map[biggest[0]] -= 1;
    if (!state.map[biggest[0]]) delete state.map[biggest[0]];
    assigned -= 1;
  }

  return state.map;
}

// Verdeelt de gratis bieren eerlijk over wat besteld werd:
// 5 Tripel + 5 Dubbel bij 10+2 → 1 Tripel + 1 Dubbel gratis.
function autoAllocate(group, earned) {
  const map = {};

  for (let i = 0; i < earned; i++) {
    let best = null;
    let bestScore = -1;

    group.forEach(item => {
      const score = item.quantity / ((map[item.product_id] || 0) + 1);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });

    if (!best) break;
    map[best.product_id] = (map[best.product_id] || 0) + 1;
  }

  return map;
}

function pendingFreeChoices() {
  return lastPromoState.reduce(
    (sum, state) => sum + Math.max(0, state.earned - state.assigned),
    0
  );
}

function renderFreePicker() {
  const box = document.getElementById("freePicker");
  if (!box) return;

  const states =
    lastPromoState.filter(state => state.earned > 0);

  if (!states.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  box.classList.remove("hidden");
  box.innerHTML =
    states
      .map(state => {
        const rest = state.earned - state.assigned;

        return `
          <div class="free-block">
            <div class="free-block-head">
              <div>
                <strong>${state.earned} gratis — ${escapeHtml(promoLabel(state.promo))}</strong>
                <small>${state.total} besteld samen. Kies welke bieren gratis zijn.</small>
              </div>
              <button type="button" class="small-button ghost" data-free-auto="${escapeHtml(state.promo.id)}">Auto</button>
            </div>

            ${state.group
              .map(item => `
                <div class="free-row">
                  <span>${escapeHtml(item.display_name)}</span>
                  <div class="quantity-control">
                    <button class="qty-button" type="button" data-free-step="-1" data-free-promo="${escapeHtml(state.promo.id)}" data-free-product="${item.product_id}">−</button>
                    <b class="free-count">${item.free_quantity}</b>
                    <button class="qty-button" type="button" data-free-step="1" data-free-promo="${escapeHtml(state.promo.id)}" data-free-product="${item.product_id}" ${rest <= 0 ? "disabled" : ""}>+</button>
                  </div>
                </div>
              `)
              .join("")}

            <div class="free-status ${rest > 0 ? "open" : "done"}">
              ${rest > 0
                ? `Nog ${rest} gratis te kiezen`
                : "✓ Alle gratis bieren gekozen"}
            </div>
          </div>
        `;
      })
      .join("");
}

function handleFreePickerClick(event) {
  const auto = event.target.closest("[data-free-auto]");

  if (auto) {
    delete freeAllocations[auto.dataset.freeAuto];
    updateOrderSummary();
    return;
  }

  const button = event.target.closest("[data-free-step]");
  if (!button || button.disabled) return;

  const promoId = button.dataset.freePromo;
  const productId = Number(button.dataset.freeProduct);
  const step = Number(button.dataset.freeStep);

  const promoState =
    lastPromoState.find(state => state.promo.id === promoId);
  if (!promoState) return;

  const state =
    freeAllocations[promoId] ||
    (freeAllocations[promoId] = { manual:false, map:{} });

  const current = state.map[productId] || 0;

  if (step > 0 && promoState.assigned >= promoState.earned) return;
  if (step < 0 && current <= 0) return;

  state.manual = true;
  state.map[productId] = current + step;
  if (!state.map[productId]) delete state.map[productId];

  document.getElementById("orderMessage")?.classList.add("hidden");
  updateOrderSummary();
}

function promoLabel(promo) {
  if (!promo) return "";

  if (promo.type === "text") {
    return promo.label || "";
  }

  const cats =
    (promo.categories || [])
      .map(value =>
        PROMO_CATEGORIES.find(cat => cat.value === value)?.label || value
      )
      .join(", ");

  return `${promo.buy}+${promo.free}${cats ? ` op ${cats}` : ""}` +
    (isMixed(promo) ? " (gemengd)" : " (per artikel)");
}

function updateOrderPromos() {
  const box = document.getElementById("orderPromos");
  if (!box) return;

  const fair = currentOrderFair();
  const promos = fair?.promotions || [];

  // Kleine actie-labels bij de productgroepen.
  PROMO_CATEGORIES.forEach(cat => {
    const summary =
      document.getElementById(`count-${cat.value}`)?.parentElement;
    if (!summary) return;

    summary.querySelector(".group-promo")?.remove();

    const promo = promoForCategory(cat.value);
    if (promo) {
      summary
        .querySelector("span")
        ?.insertAdjacentHTML(
          "beforeend",
          ` <em class="group-promo">${escapeHtml(`${promo.buy}+${promo.free}`)}</em>`
        );
    }
  });

  if (!fair || !promos.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  box.classList.remove("hidden");
  box.innerHTML = `
    <strong>Beursacties ${escapeHtml(fair.name)}</strong>
    <ul>
      ${promos
        .map(promo => `<li>${escapeHtml(promoLabel(promo))}</li>`)
        .join("")}
    </ul>
  `;
}

function updatePromoBadges(items) {
  document
    .querySelectorAll("[data-promo-free]")
    .forEach(el => {
      const item =
        items.find(entry =>
          String(entry.product_id) === el.dataset.promoFree
        );

      const free = item?.free_quantity || 0;

      el.classList.toggle("hidden", !free);
      el.textContent = free ? `+${free} gratis` : "";
    });
}

// ---------- Beheerscherm: beurzen instellen ----------

function bindFairAdmin() {
  document
    .getElementById("newFairButton")
    ?.addEventListener("click", () => openFairForm(null));

  document
    .getElementById("cancelFairButton")
    ?.addEventListener("click", closeFairForm);

  document
    .getElementById("deleteFairButton")
    ?.addEventListener("click", deleteFair);

  document
    .getElementById("addFreePromoButton")
    ?.addEventListener("click", () => {
      editingPromos.push({
        id: makePromoId(),
        type: "free",
        buy: 10,
        free: 2,
        mixed: true,
        categories: []
      });
      renderPromoRows();
    });

  document
    .getElementById("addTextPromoButton")
    ?.addEventListener("click", () => {
      editingPromos.push({
        id: makePromoId(),
        type: "text",
        label: ""
      });
      renderPromoRows();
    });

  document
    .getElementById("fairForm")
    ?.addEventListener("submit", saveFair);

  document
    .getElementById("fairsList")
    ?.addEventListener("click", event => {
      const button = event.target.closest("[data-edit-fair]");
      if (button) {
        openFairForm(button.dataset.editFair);
      }
    });

  document
    .getElementById("fairSheet")
    ?.addEventListener("click", event => {
      if (event.target.id === "fairSheet") closeFairForm();
    });

  bindCalendar();

  // Wijzigingen in de actie-rijen bijhouden.
  const rows = document.getElementById("promoRows");

  rows?.addEventListener("input", handlePromoInput);
  rows?.addEventListener("change", handlePromoInput);
  rows?.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove-promo]");
    if (!remove) return;

    editingPromos =
      editingPromos.filter(promo => promo.id !== remove.dataset.removePromo);
    renderPromoRows();
  });
}

function makePromoId() {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function openFairForm(fairId) {
  const form = document.getElementById("fairForm");
  if (!form) return;

  const fair = fairId ? findFair(fairId) : null;
  editingFairId = fair?.id || null;

  form.reset();
  document.getElementById("fairMessage")?.classList.add("hidden");

  setText("fairFormTitle", fair ? "Beurs wijzigen" : "Nieuwe beurs");

  document.getElementById("fairName").value = fair?.name || "";
  document.getElementById("fairLocation").value = fair?.location || "";
  document.getElementById("fairActive").checked = fair ? fair.active : true;
  setFairPeriod(fair?.start_date || "", fair?.end_date || "");

  editingPromos =
    (fair?.promotions || []).map(promo => ({
      ...promo,
      id: promo.id || makePromoId(),
      categories: Array.isArray(promo.categories) ? [...promo.categories] : []
    }));

  renderPromoRows();

  document
    .getElementById("deleteFairButton")
    ?.classList.toggle("hidden", !fair);

  openSheet("fairSheet");
}

function closeFairForm() {
  editingFairId = null;
  editingPromos = [];
  closeSheet("fairSheet");
}

function openSheet(id) {
  document.getElementById(id)?.classList.remove("hidden");
  document.body.classList.add("sheet-open");
}

function closeSheet(id) {
  document.getElementById(id)?.classList.add("hidden");

  if (!document.querySelector(".sheet-overlay:not(.hidden)")) {
    document.body.classList.remove("sheet-open");
  }
}

function setFairPeriod(start, end) {
  document.getElementById("fairStart").value = start || "";
  document.getElementById("fairEnd").value = end || "";

  setText("fairStartDisplay", start ? formatShortDate(start) : "Kies datum");
  setText("fairEndDisplay", end ? formatShortDate(end) : "—");
}

function formatShortDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    weekday:"short",
    day:"numeric",
    month:"short",
    year:"numeric"
  }).format(new Date(y, m - 1, d));
}

// ---------- Kalender: 1 kalender, 2 keer tikken ----------

let calendarMonth = null;  // eerste dag van de getoonde maand
let calendarFrom = "";     // "2026-11-15"
let calendarUntil = "";

function bindCalendar() {
  document
    .getElementById("fairPeriodButton")
    ?.addEventListener("click", openCalendar);

  document
    .getElementById("calendarCloseButton")
    ?.addEventListener("click", () => closeSheet("calendarSheet"));

  document
    .getElementById("calendarSheet")
    ?.addEventListener("click", event => {
      if (event.target.id === "calendarSheet") closeSheet("calendarSheet");
    });

  document
    .getElementById("calendarPrev")
    ?.addEventListener("click", () => changeCalendarMonth(-1));

  document
    .getElementById("calendarNext")
    ?.addEventListener("click", () => changeCalendarMonth(1));

  document
    .getElementById("calendarReset")
    ?.addEventListener("click", () => {
      calendarFrom = "";
      calendarUntil = "";
      renderCalendar();
    });

  document
    .getElementById("calendarConfirm")
    ?.addEventListener("click", () => {
      // Eén dag gekozen? Dan is de beurs één dag.
      setFairPeriod(calendarFrom, calendarUntil || calendarFrom);
      closeSheet("calendarSheet");
    });

  document
    .getElementById("calendarDays")
    ?.addEventListener("click", event => {
      const day = event.target.closest("[data-day]");
      if (day) selectCalendarDay(day.dataset.day);
    });
}

function openCalendar() {
  calendarFrom = document.getElementById("fairStart").value || "";
  calendarUntil = document.getElementById("fairEnd").value || "";

  const base = calendarFrom ? isoToDate(calendarFrom) : new Date();
  calendarMonth = new Date(base.getFullYear(), base.getMonth(), 1);

  renderCalendar();
  openSheet("calendarSheet");
}

function changeCalendarMonth(step) {
  calendarMonth =
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + step, 1);
  renderCalendar();
}

function selectCalendarDay(iso) {
  if (!calendarFrom || calendarUntil) {
    // Eerste tik (of opnieuw beginnen): begindag.
    calendarFrom = iso;
    calendarUntil = "";
  }
  else if (iso < calendarFrom) {
    // Dag vóór de begindag: wordt de nieuwe begindag.
    calendarFrom = iso;
  }
  else {
    // Tweede tik: einddag.
    calendarUntil = iso;
  }

  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById("calendarDays");
  if (!grid || !calendarMonth) return;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  setText(
    "calendarMonth",
    new Intl.DateTimeFormat("nl-BE", { month:"long", year:"numeric" })
      .format(calendarMonth)
  );

  // Maandag als eerste dag van de week.
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = dateToIso(new Date());
  const end = calendarUntil || calendarFrom;

  let html = "";

  for (let i = 0; i < offset; i++) {
    html += `<span></span>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = dateToIso(new Date(year, month, d));
    const classes = ["calendar-day"];

    if (iso === today) classes.push("today");
    if (calendarFrom && iso > calendarFrom && iso < end) classes.push("in-range");
    if (iso === calendarFrom || iso === calendarUntil) classes.push("range-end");

    html += `<button type="button" class="${classes.join(" ")}" data-day="${iso}">${d}</button>`;
  }

  grid.innerHTML = html;

  setText("calendarFrom", calendarFrom ? formatShortDate(calendarFrom) : "—");
  setText("calendarUntil", calendarUntil ? formatShortDate(calendarUntil) : "—");

  setText(
    "calendarInstruction",
    !calendarFrom
      ? "Tik de eerste dag"
      : !calendarUntil
        ? "Tik de laatste dag"
        : "Periode gekozen"
  );

  const confirm = document.getElementById("calendarConfirm");
  if (confirm) confirm.disabled = !calendarFrom;
}

function isoToDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function renderPromoRows() {
  const container = document.getElementById("promoRows");
  if (!container) return;

  if (!editingPromos.length) {
    container.innerHTML =
      `<div class="promo-empty">Nog geen acties.</div>`;
    return;
  }

  container.innerHTML =
    editingPromos
      .map(promo => {
        const id = escapeHtml(promo.id);
        const remove =
          `<button type="button" class="promo-remove" data-remove-promo="${id}" aria-label="Actie verwijderen">×</button>`;

        if (promo.type === "text") {
          return `
            <div class="promo-row text" data-promo-id="${id}">
              <input type="text" data-promo-field="label" value="${escapeHtml(promo.label || "")}" placeholder="Bijv. gratis tapinstallatie vanaf 5 vaten">
              ${remove}
            </div>
          `;
        }

        return `
          <div class="promo-row" data-promo-id="${id}">
            <div class="promo-line">
              <input class="promo-num" type="number" inputmode="numeric" min="1" step="1" data-promo-field="buy" value="${Number(promo.buy) || ""}" aria-label="Aantal besteld">
              <b>+</b>
              <input class="promo-num" type="number" inputmode="numeric" min="1" step="1" data-promo-field="free" value="${Number(promo.free) || ""}" aria-label="Aantal gratis">
              <span class="promo-gratis">gratis</span>

              <label class="promo-chip mixed">
                <input type="checkbox" data-promo-field="mixed" ${isMixed(promo) ? "checked" : ""}>
                <span>Gemengd</span>
              </label>

              ${remove}
            </div>

            <div class="promo-cats">
              ${PROMO_CATEGORIES
                .map(cat => `
                  <label class="promo-chip">
                    <input type="checkbox" data-promo-cat="${cat.value}" ${(promo.categories || []).includes(cat.value) ? "checked" : ""}>
                    <span>${escapeHtml(cat.short)}</span>
                  </label>
                `)
                .join("")}
            </div>

            <small class="promo-hint" data-promo-preview>${escapeHtml(promoPreview(promo))}</small>
          </div>
        `;
      })
      .join("");
}

function promoPreview(promo) {
  if (!promo.categories?.length) {
    return "Tik aan waarop de actie geldt.";
  }
  if (!(Number(promo.buy) > 0) || !(Number(promo.free) > 0)) {
    return "Vul beide aantallen in.";
  }
  return isMixed(promo)
    ? `Bieren samen geteld (bv. 5 Tripel + 5 Dubbel = ${promo.buy}).`
    : `Per bier apart geteld.`;
}

function handlePromoInput(event) {
  const row = event.target.closest("[data-promo-id]");
  if (!row) return;

  const promo =
    editingPromos.find(item => item.id === row.dataset.promoId);
  if (!promo) return;

  const field = event.target.dataset.promoField;
  const cat = event.target.dataset.promoCat;

  if (field === "label") {
    promo.label = event.target.value;
  }
  else if (field === "mixed") {
    promo.mixed = event.target.checked;
  }
  else if (field === "buy" || field === "free") {
    promo[field] = Math.max(0, Math.floor(Number(event.target.value || 0)));
  }
  else if (cat) {
    const set = new Set(promo.categories || []);
    if (event.target.checked) set.add(cat);
    else set.delete(cat);
    promo.categories = PROMO_CATEGORIES
      .map(item => item.value)
      .filter(value => set.has(value));
  }

  const preview = row.querySelector("[data-promo-preview]");
  if (preview) preview.textContent = promoPreview(promo);
}

function collectPromotions() {
  const result = [];

  for (const promo of editingPromos) {
    if (promo.type === "text") {
      const label = cleanText(promo.label);
      if (label) {
        result.push({ id: promo.id, type: "text", label });
      }
      continue;
    }

    const buy = Number(promo.buy);
    const free = Number(promo.free);

    if (!(buy > 0) || !(free > 0)) {
      throw new Error("Vul bij elke gratis-actie beide aantallen in (bv. 10 + 2).");
    }

    if (!promo.categories?.length) {
      throw new Error(`Kies bij de actie ${buy}+${free} op welke producten ze geldt.`);
    }

    const clean = { id: promo.id, type: "free", buy, free, mixed: isMixed(promo), categories: [...promo.categories] };
    clean.label = promoLabel(clean);
    result.push(clean);
  }

  return result;
}

async function saveFair(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const button = document.getElementById("saveFairButton");

  let payload;

  try {
    const start = document.getElementById("fairStart").value || null;
    const end = document.getElementById("fairEnd").value || null;

    if (start && end && end < start) {
      throw new Error("De einddatum ligt vóór de startdatum.");
    }

    payload = {
      name: cleanText(document.getElementById("fairName").value),
      location: cleanText(document.getElementById("fairLocation").value),
      start_date: start,
      end_date: end,
      active: document.getElementById("fairActive").checked,
      promotions: collectPromotions()
    };

    if (!payload.name) {
      throw new Error("Geef de beurs een naam.");
    }
  }
  catch (error) {
    showMessage("fairMessage", error.message, true);
    return;
  }

  try {
    setBusy(button, true, "Beurs opslaan...");

    const query =
      editingFairId
        ? supabaseClient.from("fairs").update(payload).eq("id", editingFairId)
        : supabaseClient.from("fairs").insert({ ...payload, created_by: currentSession.user.id });

    const { error } = await query;
    if (error) throw error;

    await loadFairs();
    fillFairSelects();
    renderFairsList();
    closeFairForm();

    showFairsListMessage("✓ Beurs opgeslagen.");
  }
  catch (error) {
    console.error("BEURS OPSLAAN FOUT:", error);
    showMessage("fairMessage", error?.message || "Beurs kon niet worden opgeslagen.", true);
  }
  finally {
    setBusy(button, false, "Beurs opslaan");
  }
}

async function deleteFair() {
  if (!editingFairId) return;

  const fair = findFair(editingFairId);

  const ok = confirm(
    `Beurs "${fair?.name || ""}" verwijderen?\n\n` +
    "Bestellingen die al geplaatst zijn blijven bewaard (met de beursnaam). " +
    "Wil je de beurs enkel verbergen voor vertegenwoordigers, zet ze dan op niet-actief."
  );

  if (!ok) return;

  try {
    const { error } =
      await supabaseClient.from("fairs").delete().eq("id", editingFairId);

    if (error) throw error;

    await loadFairs();
    fillFairSelects();
    renderFairsList();
    closeFairForm();

    showFairsListMessage("Beurs verwijderd.");
  }
  catch (error) {
    console.error("BEURS VERWIJDEREN FOUT:", error);
    showMessage("fairMessage", error?.message || "Beurs kon niet worden verwijderd.", true);
  }
}

function showFairsListMessage(text) {
  const list = document.getElementById("fairsList");
  if (!list) return;

  list.insertAdjacentHTML(
    "afterbegin",
    `<div class="form-message success">${escapeHtml(text)}</div>`
  );
}

function renderFairsList() {
  const container = document.getElementById("fairsList");
  if (!container) return;

  if (!fairs.length) {
    container.innerHTML =
      emptyState("Nog geen beurzen. Tik op \"+ Nieuwe beurs\".");
    return;
  }

  container.innerHTML =
    fairs
      .map(fair => `
        <button type="button" class="fair-row ${fair.active ? "" : "inactive"}" data-edit-fair="${escapeHtml(fair.id)}">
          <span class="fair-dot" aria-hidden="true"></span>
          <span class="fair-row-main">
            <strong>${escapeHtml(fair.name)}</strong>
            <small>${escapeHtml([fairDateText(fair), fair.location].filter(Boolean).join(" · ") || "Geen datum")}${fair.active ? "" : " · niet actief"}</small>
            ${fair.promotions.length
              ? `<span class="fair-row-promos">${fair.promotions
                  .map(promo => `<em>${escapeHtml(promo.type === "free" ? `${promo.buy}+${promo.free}${isMixed(promo) ? " gemengd" : ""}` : promo.label)}</em>`)
                  .join("")}</span>`
              : ""}
          </span>
          <i aria-hidden="true">›</i>
        </button>
      `)
      .join("");
}

// =========================================================
// HULPFUNCTIES
// =========================================================

function categoryLabel(value) {
  const labels = {
    vat20:"Vat 20L",
    krat24:"Krat 24 x 33cl",
    doos75:"Doos 6 x 75cl",
    clip4:"Clip 4 x 33cl",
    gvp:"GVP"
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
