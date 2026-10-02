/* ============================================================
   BOEKHOUDING: TE VERWERKEN / VERWERKT
   (Beheer > Rapporten)

   Alle aanvragen die de boekhouding moet verwerken staan in één
   lijst: POS/promo, gratis bier, groothandel en het bier dat bij
   events werd aangevraagd. Eventmateriaal (uitleen) telt niet mee.

   Wat verwerkt is, verschuift naar "Verwerkt", per maand van
   aanvraag. De Excel zet alles gegroepeerd onder elkaar met een
   zwarte lijn tussen elke groep en behoudt de Douano-codes.
============================================================ */

const BK_TYPES = {
  pos: { label: "POS/Promo", section: "POS / Promo-aanvragen" },
  freebeer: { label: "Gratis bier", section: "Gratis bier (factuur enkel leeggoed)" },
  wholesale: { label: "Groothandel", section: "Groothandelbestellingen" },
  eventbier: { label: "Event-bier", section: "Bier voor events" }
};

const BK_TYPE_ORDER = ["pos", "freebeer", "wholesale", "eventbier"];

const BK_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"
];

let bkView = "todo";
let bkTypeFilter = "";
let bkSelected = new Set();
let bkOpenMonth = "";
let bkBusy = false;


/* ===============================
   STIJL
================================ */

(function injectBoekhoudingStyles() {

  if (document.getElementById("boekhoudingStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boekhoudingStyles";
  style.textContent = `
    .bk-seg {
      display:flex;
      gap:4px;
      margin:12px 0;
      padding:4px;
      border-radius:13px;
      background:rgba(0,0,0,.28);
    }
    .bk-seg button {
      flex:1;
      width:auto;
      min-height:40px;
      margin:0;
      padding:0 6px;
      border:0;
      border-radius:10px;
      background:transparent;
      box-shadow:none;
      color:var(--achel-muted, rgba(246,240,227,.62));
      font-size:13px;
      font-weight:850;
      white-space:nowrap;
    }
    .bk-seg button.active {
      background:var(--achel-gold, #c99b43);
      color:#141a14;
    }
    .bk-seg i {
      margin-left:4px;
      padding:1px 7px;
      border-radius:999px;
      background:rgba(0,0,0,.2);
      font-style:normal;
      font-size:11px;
    }
    .bk-chips {
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      margin:4px 0 10px;
    }
    .bk-chips button {
      width:auto;
      min-height:32px;
      margin:0;
      padding:0 11px;
      border:1px solid rgba(201,155,67,.3);
      border-radius:999px;
      background:transparent;
      box-shadow:none;
      color:var(--achel-muted, rgba(246,240,227,.7));
      font-size:12px;
      font-weight:800;
    }
    .bk-chips button.active {
      border-color:var(--achel-gold, #c99b43);
      background:rgba(201,155,67,.18);
      color:var(--achel-gold-bright, #e0b85f);
    }
    .bk-list {
      overflow:hidden;
      margin-bottom:12px;
      border:1px solid rgba(201,155,67,.17);
      border-radius:14px;
    }
    .bk-list > .empty {
      margin:0;
      border:0;
    }
    .bk-selectall {
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:8px 12px;
      border-bottom:1px solid rgba(201,155,67,.12);
      color:var(--achel-muted, rgba(246,240,227,.62));
      font-size:12px;
    }
    .bk-selectall button {
      width:auto;
      min-height:28px;
      margin:0;
      padding:0 10px;
      border:0;
      background:transparent;
      box-shadow:none;
      color:var(--achel-gold-bright, #e0b85f);
      font-size:12px;
      font-weight:850;
    }
    .bk-row {
      display:flex;
      align-items:center;
      gap:12px;
      width:100%;
      min-height:58px;
      margin:0;
      padding:10px 12px;
      border:0;
      border-bottom:1px solid rgba(201,155,67,.12);
      border-radius:0;
      background:transparent;
      box-shadow:none;
      color:var(--achel-text, #f6f0e3);
      text-align:left;
      font-weight:400;
    }
    .bk-row:last-child {
      border-bottom:0;
    }
    .bk-row.selected {
      background:rgba(201,155,67,.09);
    }
    .bk-check {
      flex:none;
      display:flex;
      align-items:center;
      justify-content:center;
      width:24px;
      height:24px;
      border:2px solid rgba(201,155,67,.6);
      border-radius:50%;
      color:#141a14;
      font-size:13px;
      font-weight:900;
    }
    .bk-row.selected .bk-check {
      border-color:var(--achel-gold, #c99b43);
      background:var(--achel-gold, #c99b43);
    }
    .bk-row-main {
      flex:1;
      min-width:0;
    }
    .bk-row-main b {
      display:block;
      overflow:hidden;
      color:#fff;
      font-size:14px;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .bk-row-main small {
      display:block;
      margin-top:2px;
      color:var(--achel-muted, rgba(246,240,227,.62));
      font-size:11px;
    }
    .bk-row-main em {
      color:var(--achel-gold, #c99b43);
      font-style:normal;
      font-weight:800;
    }
    .bk-undo {
      flex:none;
      width:auto !important;
      min-height:32px;
      margin:0;
      padding:0 10px;
      border:1px solid rgba(255,255,255,.18);
      border-radius:999px;
      background:transparent;
      box-shadow:none;
      color:var(--achel-muted, rgba(246,240,227,.62));
      font-size:11px;
      font-weight:700;
    }
    .bk-month {
      display:flex;
      align-items:center;
      justify-content:space-between;
      width:100%;
      margin:0;
      padding:14px;
      border:0;
      border-bottom:1px solid rgba(201,155,67,.12);
      border-radius:0;
      background:transparent;
      box-shadow:none;
      color:#fff;
      text-align:left;
    }
    .bk-month:last-child {
      border-bottom:0;
    }
    .bk-month b {
      display:block;
      font-size:15px;
    }
    .bk-month small {
      color:var(--achel-muted, rgba(246,240,227,.62));
      font-size:12px;
      font-weight:500;
    }
    .bk-month span {
      color:var(--achel-gold-bright, #e0b85f);
      font-size:22px;
    }
    .bk-back {
      width:auto;
      min-height:34px;
      margin:0 0 10px;
      padding:0 12px;
      border:1px solid rgba(201,155,67,.3);
      border-radius:999px;
      background:transparent;
      box-shadow:none;
      color:var(--achel-gold-bright, #e0b85f);
      font-size:12px;
      font-weight:850;
    }
    .bk-month-title {
      margin:0 0 10px;
      color:#fff;
      font-size:18px;
      font-weight:850;
    }
    .bk-bar {
      position:sticky;
      z-index:20;
      bottom:calc(env(safe-area-inset-bottom, 0px) + 12px);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-top:12px;
      padding:10px 10px 10px 14px;
      border:1px solid var(--achel-gold, #c99b43);
      border-radius:16px;
      background:#141a14;
      box-shadow:0 10px 28px rgba(0,0,0,.35);
    }
    .bk-bar.hidden {
      display:none;
    }
    .bk-bar span {
      color:rgba(246,240,227,.78);
      font-size:12px;
    }
    .bk-bar button {
      width:auto;
      min-height:42px;
      margin:0;
      padding:0 14px;
      border:0;
      border-radius:11px;
      background:var(--achel-gold, #c99b43);
      color:#141a14;
      font-size:13px;
      font-weight:900;
    }
  `;

  document.head.appendChild(style);

})();


/* ===============================
   HULPFUNCTIES
================================ */

function bkEscape(value) {

  if (typeof adminEscapeHtml === "function") {
    return adminEscapeHtml(value);
  }

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


function bkParseDate(value) {

  if (!value) {
    return null;
  }

  const text = String(value);

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? new Date(`${text}T00:00:00`)
      : new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;

}


function bkShortDate(value) {

  const date = bkParseDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit"
  });

}


function bkFullDate(value) {

  const date = bkParseDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

}


function bkMonthKey(value) {

  const date = bkParseDate(value);

  if (!date) {
    return "onbekend";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

}


function bkMonthLabel(key) {

  if (!key || key === "onbekend") {
    return "Zonder datum";
  }

  const [year, month] = key.split("-");
  const name = BK_MONTHS[Number(month) - 1] || "";

  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;

}


function bkProfileName(userId) {

  if (typeof getAdminProfile !== "function") {
    return "";
  }

  return getAdminProfile(userId)?.naam || "";

}


function bkFirstName(userId) {

  return bkProfileName(userId).split(" ")[0] || "Onbekend";

}


function bkOrderNumber(order) {

  if (typeof createOrderReference === "function") {
    return createOrderReference(order.id, order.created_at);
  }

  return "";

}


function bkCodeForProduct(name) {

  if (!name) {
    return "";
  }

  let code = "";

  if (typeof getAdminProductMasterForSku === "function") {
    code = getAdminProductMasterForSku(name)?.douano_code || "";
  }

  if (!code && typeof getDouaneCodeForProductNaam === "function") {
    code = getDouaneCodeForProductNaam(name) || "";
  }

  return code || "NIET GEKOPPELD";

}


function bkCurrentUserId() {

  try {
    if (typeof currentUser !== "undefined" && currentUser?.id) {
      return currentUser.id;
    }
  }
  catch (error) {
    // geen ingelogde gebruiker gekend
  }

  return null;

}


/* ===============================
   ALLE AANVRAGEN VERZAMELEN
================================ */

function bkCollectItems() {

  const items = [];

  const orders =
    typeof adminOrders !== "undefined" ? adminOrders : [];

  const wholesale =
    typeof adminWholesaleOrders !== "undefined" ? adminWholesaleOrders : [];

  const freeBeer =
    typeof adminFreeBeerRegistrations !== "undefined" ? adminFreeBeerRegistrations : [];


  // POS / promo: afgehaalde aanvragen
  orders
    .filter(order => !order.event_naam && order.status === "afgehaald")
    .forEach(order => {

      const lines = getAdminOrderItems(order.id);
      const total = lines.reduce((sum, line) => sum + Number(line.aantal || 0), 0);

      // "Facturatie | Klant: X | Drankenhandel: Y" leesbaar tonen
      const reference = String(order.referentie || "POS & Promo");
      const billing = reference.match(/^Facturatie\s*\|\s*Klant:\s*(.*?)\s*\|\s*Drankenhandel:\s*(.*)$/i);

      items.push({
        key: `pos:${order.id}`,
        type: "pos",
        soort: "orders",
        ids: [order.id],
        date: order.created_at,
        userId: order.user_id,
        title: billing ? `Facturatie · ${billing[1] || "?"}` : reference,
        detail: [
          billing && billing[2] ? billing[2] : "",
          `${total} ${total === 1 ? "stuk" : "stuks"}`
        ].filter(Boolean).join(" · "),
        verwerktAt: order.verwerkt_at || null,
        verwerktDoor: order.verwerkt_door || null,
        order,
        lines
      });

    });


  // Event-bier: enkel het bier van afgehaalde events (materiaal = uitleen)
  orders
    .filter(order => order.event_naam && order.status === "afgehaald")
    .forEach(order => {

      const lines =
        getAdminOrderItems(order.id)
          .filter(line => String(line.categorie || "").toLowerCase() === "bier");

      if (!lines.length) {
        return;
      }

      const total = lines.reduce((sum, line) => sum + Number(line.aantal || 0), 0);

      items.push({
        key: `eventbier:${order.id}`,
        type: "eventbier",
        soort: "orders",
        ids: [order.id],
        date: order.created_at,
        userId: order.user_id,
        title: order.event_naam,
        detail: `${total} bier`,
        verwerktAt: order.verwerkt_at || null,
        verwerktDoor: order.verwerkt_door || null,
        order,
        lines
      });

    });


  // Groothandel: alle bestellingen behalve geannuleerde
  wholesale
    .filter(order => order.status !== "geannuleerd")
    .forEach(order => {

      const lines =
        (typeof adminWholesaleItems !== "undefined" ? adminWholesaleItems : [])
          .filter(line => line.wholesale_order_id === order.id);

      items.push({
        key: `wholesale:${order.id}`,
        type: "wholesale",
        soort: "wholesale",
        ids: [order.id],
        date: order.created_at,
        userId: order.user_id,
        title: order.drankenhandel || order.referentie || "Groothandel",
        detail: order.referentie && order.drankenhandel ? order.referentie : "",
        verwerktAt: order.verwerkt_at || null,
        verwerktDoor: order.verwerkt_door || null,
        order,
        lines
      });

    });


  // Gratis bier: per registratie (zelfde dag, klant en drankenhandel)
  if (typeof groupAdminFreeBeerRows === "function") {

    groupAdminFreeBeerRows(freeBeer)
      .forEach(group => {

        const allDone = group.items.every(row => row.verwerkt_at);
        const last =
          group.items
            .map(row => row.verwerkt_at)
            .filter(Boolean)
            .sort()
            .pop() || null;

        items.push({
          key: `freebeer:${group.key}`,
          type: "freebeer",
          soort: "freebeer",
          ids: group.items.map(row => row.id),
          date: group.datum || group.created_at,
          userId: group.user_id,
          title: group.horecaklant || "Gratis bier",
          detail: group.drankenhandel || "",
          verwerktAt: allDone ? last : null,
          verwerktDoor: allDone ? group.items[0].verwerkt_door || null : null,
          group,
          lines: group.items
        });

      });

  }


  return items.sort((first, second) => {

    const a = bkParseDate(first.date)?.getTime() || 0;
    const b = bkParseDate(second.date)?.getTime() || 0;

    return b - a;

  });

}


function bkFilteredTodo() {

  const filters =
    typeof getCentralReportFilters === "function"
      ? getCentralReportFilters()
      : {};

  return bkCollectItems()
    .filter(item => !item.verwerktAt)
    .filter(item => !bkTypeFilter || item.type === bkTypeFilter)
    .filter(item => !filters.representative || item.userId === filters.representative)
    .filter(item => {

      const date = bkParseDate(item.date);

      if (!date) {
        return true;
      }

      if (filters.year && date.getFullYear() !== filters.year) {
        return false;
      }

      if (filters.month && date.getMonth() + 1 !== Number(filters.month)) {
        return false;
      }

      return true;

    });

}


/* ===============================
   TABBLADEN
================================ */

async function openBoekhoudingTab() {

  renderBoekhouding();

  try {

    const loaders = [];

    if (typeof adminFreeBeerLoaded !== "undefined" && !adminFreeBeerLoaded) {
      loaders.push(loadAdminFreeBeerData());
    }

    if (typeof loadAdminProductMaster === "function") {
      loaders.push(loadAdminProductMaster().catch(() => null));
    }

    await Promise.all(loaders);

    if (typeof fillReportYears === "function") {
      fillReportYears();
    }

  }
  catch (error) {

    console.warn("BOEKHOUDING LADEN:", error);

  }

  renderBoekhouding();

}


function setBoekhoudingView(view) {

  bkView = ["todo", "done", "archive"].includes(view) ? view : "todo";

  ["todo", "done", "archive"].forEach(name => {

    document.getElementById(`bkPane-${name}`)
      ?.classList.toggle("hidden", name !== bkView);

    document.getElementById(`bkTab-${name}`)
      ?.classList.toggle("active", name === bkView);

  });

  document.getElementById("bkFilters")
    ?.classList.toggle("hidden", bkView === "done");

  if (bkView !== "done") {
    bkOpenMonth = "";
  }

  renderBoekhouding();

}


function setBoekhoudingType(type) {

  bkTypeFilter = type || "";
  bkSelected.clear();
  renderBoekhouding();

}


/* ===============================
   RENDER
================================ */

function renderBoekhouding() {

  if (!document.getElementById("bkPane-todo")) {
    return;
  }

  const todo = bkFilteredTodo();

  const countEl = document.getElementById("bkTodoCount");

  if (countEl) {
    countEl.textContent = bkCollectItems().filter(item => !item.verwerktAt).length;
  }

  // Selectie opschonen: enkel zichtbare items blijven aangevinkt
  const visibleKeys = new Set(todo.map(item => item.key));
  bkSelected.forEach(key => {
    if (!visibleKeys.has(key)) {
      bkSelected.delete(key);
    }
  });

  renderBoekhoudingChips();
  renderBoekhoudingTodo(todo);
  renderBoekhoudingDone();
  updateBoekhoudingBar();

}


function renderBoekhoudingChips() {

  const container = document.getElementById("bkChips");

  if (!container) {
    return;
  }

  const chips = [["", "Alles"], ...BK_TYPE_ORDER.map(type => [type, BK_TYPES[type].label])];

  container.innerHTML =
    chips
      .map(([type, label]) => `
        <button
          type="button"
          class="${bkTypeFilter === type ? "active" : ""}"
          onclick="setBoekhoudingType('${type}')"
        >${bkEscape(label)}</button>
      `)
      .join("");

}


function renderBoekhoudingTodo(todo) {

  const container = document.getElementById("bkTodoList");

  if (!container) {
    return;
  }

  if (!todo.length) {

    container.innerHTML = `
      <div class="empty">
        Niets meer te verwerken voor deze selectie.
      </div>
    `;

    return;

  }

  const allSelected = todo.every(item => bkSelected.has(item.key));

  container.innerHTML = `
    <div class="bk-selectall">
      <span>${todo.length} ${todo.length === 1 ? "aanvraag" : "aanvragen"}</span>
      <button type="button" onclick="toggleBoekhoudingAll()">
        ${allSelected ? "Niets selecteren" : "Alles selecteren"}
      </button>
    </div>
    ${todo.map(item => `
      <button
        type="button"
        class="bk-row ${bkSelected.has(item.key) ? "selected" : ""}"
        data-key="${bkEscape(item.key)}"
        onclick="toggleBoekhoudingItem(this.dataset.key)"
      >
        <span class="bk-check">${bkSelected.has(item.key) ? "✓" : ""}</span>
        <span class="bk-row-main">
          <b>${bkEscape(item.title)}</b>
          <small>
            <em>${bkEscape(BK_TYPES[item.type].label)}</em>
            · ${bkEscape(bkFirstName(item.userId))}
            · ${bkEscape(bkShortDate(item.date))}
            ${item.detail ? `· ${bkEscape(item.detail)}` : ""}
          </small>
        </span>
      </button>
    `).join("")}
  `;

}


function renderBoekhoudingDone() {

  const container = document.getElementById("bkDoneContent");

  if (!container) {
    return;
  }

  const done = bkCollectItems().filter(item => item.verwerktAt);

  if (!done.length) {

    container.innerHTML = `
      <div class="bk-list">
        <div class="empty">
          Nog niets boekhoudkundig verwerkt.
        </div>
      </div>
    `;

    return;

  }

  const months = new Map();

  done.forEach(item => {

    const key = bkMonthKey(item.date);

    if (!months.has(key)) {
      months.set(key, []);
    }

    months.get(key).push(item);

  });

  const monthKeys = [...months.keys()].sort().reverse();

  if (bkOpenMonth && months.has(bkOpenMonth)) {

    const monthItems = months.get(bkOpenMonth);

    container.innerHTML = `
      <button type="button" class="bk-back" onclick="openBoekhoudingMonth('')">
        ← Alle maanden
      </button>

      <div class="bk-month-title">
        ${bkEscape(bkMonthLabel(bkOpenMonth))}
      </div>

      <div class="bk-list">
        ${BK_TYPE_ORDER
          .flatMap(type => monthItems.filter(item => item.type === type))
          .map(item => `
            <div class="bk-row">
              <span class="bk-row-main">
                <b>${bkEscape(item.title)}</b>
                <small>
                  <em>${bkEscape(BK_TYPES[item.type].label)}</em>
                  · ${bkEscape(bkShortDate(item.date))}
                  · verwerkt op ${bkEscape(bkShortDate(item.verwerktAt))}
                  ${item.verwerktDoor ? `door ${bkEscape(bkFirstName(item.verwerktDoor))}` : ""}
                </small>
              </span>
              <button
                type="button"
                class="bk-undo"
                data-key="${bkEscape(item.key)}"
                onclick="undoBoekhoudingItem(this.dataset.key)"
              >
                Terugzetten
              </button>
            </div>
          `)
          .join("")}
      </div>

      <button
        class="admin-export"
        type="button"
        onclick="exportBoekhoudingMonthExcel('${bkOpenMonth}')"
      >
        Excel ${bkEscape(bkMonthLabel(bkOpenMonth).toLowerCase())} downloaden
      </button>
    `;

    return;

  }

  bkOpenMonth = "";

  container.innerHTML = `
    <div class="bk-list">
      ${monthKeys.map(key => {

        const count = months.get(key).length;

        return `
          <button
            type="button"
            class="bk-month"
            onclick="openBoekhoudingMonth('${key}')"
          >
            <div>
              <b>${bkEscape(bkMonthLabel(key))}</b>
              <small>${count} ${count === 1 ? "aanvraag" : "aanvragen"}</small>
            </div>
            <span>›</span>
          </button>
        `;

      }).join("")}
    </div>
  `;

}


function openBoekhoudingMonth(key) {

  bkOpenMonth = key || "";
  renderBoekhoudingDone();

  window.scrollTo({ top: 0, behavior: "smooth" });

}


function updateBoekhoudingBar() {

  const bar = document.getElementById("bkActionBar");
  const text = document.getElementById("bkSelectedText");

  if (!bar) {
    return;
  }

  const count = bkSelected.size;

  bar.classList.toggle("hidden", bkView !== "todo" || count === 0);

  if (text) {
    text.textContent = `${count} geselecteerd`;
  }

}


/* ===============================
   SELECTEREN
================================ */

function toggleBoekhoudingItem(key) {

  if (bkSelected.has(key)) {
    bkSelected.delete(key);
  }
  else {
    bkSelected.add(key);
  }

  renderBoekhoudingTodo(bkFilteredTodo());
  updateBoekhoudingBar();

}


function toggleBoekhoudingAll() {

  const todo = bkFilteredTodo();
  const allSelected = todo.every(item => bkSelected.has(item.key));

  if (allSelected) {
    bkSelected.clear();
  }
  else {
    todo.forEach(item => bkSelected.add(item.key));
  }

  renderBoekhoudingTodo(todo);
  updateBoekhoudingBar();

}


/* ===============================
   OPSLAAN (VERWERKT / TERUGZETTEN)
================================ */

async function bkSaveVerwerkt(items, verwerkt) {

  const bySoort = {};

  items.forEach(item => {

    bySoort[item.soort] = bySoort[item.soort] || [];
    bySoort[item.soort].push(...item.ids);

  });

  for (const [soort, ids] of Object.entries(bySoort)) {

    const { error } =
      await supabaseClient.rpc("zet_boekhouding_verwerkt", {
        p_soort: soort,
        p_ids: ids,
        p_verwerkt: verwerkt
      });

    if (error) {
      throw error;
    }

  }

  // Lokaal bijwerken zodat het scherm meteen klopt
  const at = verwerkt ? new Date().toISOString() : null;
  const door = verwerkt ? bkCurrentUserId() : null;

  const apply = (list, ids) => {

    const idSet = new Set(ids);

    (list || []).forEach(row => {
      if (idSet.has(row.id)) {
        row.verwerkt_at = at;
        row.verwerkt_door = door;
      }
    });

  };

  if (bySoort.orders) {
    apply(adminOrders, bySoort.orders);
  }

  if (bySoort.wholesale) {
    apply(adminWholesaleOrders, bySoort.wholesale);
  }

  if (bySoort.freebeer) {
    apply(adminFreeBeerRegistrations, bySoort.freebeer);
  }

}


async function markBoekhoudingSelected() {

  if (bkBusy) {
    return;
  }

  const items = bkFilteredTodo().filter(item => bkSelected.has(item.key));

  if (!items.length) {
    return;
  }

  const button = document.getElementById("bkMarkButton");

  bkBusy = true;

  if (button) {
    button.disabled = true;
    button.textContent = "Bezig...";
  }

  try {

    await bkSaveVerwerkt(items, true);

    bkSelected.clear();

    renderBoekhouding();

    if (typeof updateCentralReportCounts === "function") {
      updateCentralReportCounts();
    }

  }
  catch (error) {

    console.error("BOEKHOUDING VERWERKT:", error);

    alert(
      "Markeren als verwerkt is niet gelukt.\n\n" +
      (typeof adminReadableError === "function" ? adminReadableError(error) : error.message || "")
    );

  }
  finally {

    bkBusy = false;

    if (button) {
      button.disabled = false;
      button.textContent = "✓ Markeer als verwerkt";
    }

  }

}


async function undoBoekhoudingItem(key) {

  if (bkBusy) {
    return;
  }

  const item = bkCollectItems().find(entry => entry.key === key);

  if (!item) {
    return;
  }

  if (!confirm(`"${item.title}" terugzetten naar "Te verwerken"?`)) {
    return;
  }

  bkBusy = true;

  try {

    await bkSaveVerwerkt([item], false);

    renderBoekhouding();

  }
  catch (error) {

    console.error("BOEKHOUDING TERUGZETTEN:", error);

    alert(
      "Terugzetten is niet gelukt.\n\n" +
      (typeof adminReadableError === "function" ? adminReadableError(error) : error.message || "")
    );

  }
  finally {

    bkBusy = false;

  }

}


/* ===============================
   EXCEL (GEGROEPEERD)
================================ */

/* ===============================
   EXCEL: ÉÉN VASTE KOLOMSTRUCTUUR
   Alle groepen (POS/promo, gratis bier, groothandel, event-bier)
   gebruiken dezelfde kolommen, zodat de boekhouding alles in één
   keer kan filteren, sorteren en optellen.
================================ */

const BK_COLUMNS = [
  ["Datum", 12],
  ["Soort", 13],
  ["Ordernummer", 19],
  ["Vertegenwoordiger", 20],
  ["Klant / event", 30],
  ["Drankenhandel", 24],
  ["Douano-code", 16],
  ["Product", 38],
  ["Eenheid", 11],
  ["Aantal", 9],
  ["Actie", 10],
  ["Gratis", 9],
  ["Totaal", 9],
  ["Info", 26]
];

const BK_COL = Object.fromEntries(BK_COLUMNS.map((column, index) => [column[0], index]));


function bkParseBillingReference(reference) {

  const match =
    String(reference || "")
      .match(/^Facturatie\s*\|\s*Klant:\s*(.*?)\s*\|\s*Drankenhandel:\s*(.*)$/i);

  return match
    ? { klant: match[1] || "", drankenhandel: match[2] || "" }
    : null;

}


function bkRow(values) {

  const row = Array(BK_COLUMNS.length).fill("");

  Object.entries(values).forEach(([name, value]) => {
    if (name in BK_COL) {
      row[BK_COL[name]] = value ?? "";
    }
  });

  return row;

}


function bkRowsForItem(item) {

  const rep = bkProfileName(item.userId);
  const soort = BK_TYPES[item.type].label;

  if (item.type === "pos") {

    const billing = bkParseBillingReference(item.order.referentie);
    const lines = item.lines.length ? item.lines : [{ product_naam: "", aantal: 0 }];

    return lines.map(line => {

      const amount = Number(line.aantal || 0);

      return bkRow({
        "Datum": bkFullDate(item.order.created_at),
        "Soort": soort,
        "Ordernummer": bkOrderNumber(item.order),
        "Vertegenwoordiger": rep,
        "Klant / event": billing ? billing.klant : (item.order.referentie || "POS & Promo"),
        "Drankenhandel": billing ? billing.drankenhandel : "",
        "Douano-code": line.product_naam ? bkCodeForProduct(line.product_naam) : "",
        "Product": line.product_naam || "",
        "Eenheid": "stuk",
        "Aantal": amount,
        "Totaal": amount,
        "Info": [billing ? "Facturatie" : "", item.order.land || ""].filter(Boolean).join(" · ")
      });

    });

  }

  if (item.type === "eventbier") {

    const period =
      [bkFullDate(item.order.event_vanaf), bkFullDate(item.order.event_tot)]
        .filter(Boolean)
        .join(" – ");

    return item.lines.map(line => {

      const amount = Number(line.aantal || 0);

      return bkRow({
        "Datum": bkFullDate(item.order.created_at),
        "Soort": soort,
        "Ordernummer": bkOrderNumber(item.order),
        "Vertegenwoordiger": rep,
        "Klant / event": item.order.event_naam || "",
        "Douano-code": bkCodeForProduct(line.product_naam),
        "Product": line.product_naam || "",
        "Eenheid": "stuk",
        "Aantal": amount,
        "Totaal": amount,
        "Info": period ? `Event ${period}` : ""
      });

    });

  }

  if (item.type === "freebeer") {

    return item.lines.map(row => {

      const amount = Number(row.aantal || 0);

      return bkRow({
        "Datum": bkFullDate(row.datum),
        "Soort": soort,
        "Vertegenwoordiger": rep,
        "Klant / event": row.horecaklant || "",
        "Drankenhandel": row.drankenhandel || "",
        "Douano-code": bkCodeForProduct(row.sku),
        "Product": row.sku || "",
        "Eenheid": row.inhoud || "",
        "Gratis": amount,
        "Totaal": amount,
        "Info": ["Factuur enkel leeggoed", row.provincie || ""].filter(Boolean).join(" · ")
      });

    });

  }

  // groothandel
  const proofs = typeof adminWholesaleProofs !== "undefined" ? adminWholesaleProofs : [];
  const signed = proofs.some(proof => proof.order_id === item.order.id);
  const lines =
    item.lines.length
      ? item.lines
      : [{ product_naam: "", eenheid: "", betaald_aantal: 0, actie: "", gratis_aantal: 0, totaal_aantal: 0 }];

  return lines.map(line => {

    const action = String(line.actie || "").trim();

    return bkRow({
      "Datum": bkFullDate(item.order.created_at),
      "Soort": soort,
      "Vertegenwoordiger": rep,
      "Klant / event": item.order.referentie || "",
      "Drankenhandel": item.order.drankenhandel || "",
      "Douano-code": line.product_naam ? bkCodeForProduct(line.product_naam) : "",
      "Product": line.product_naam || "",
      "Eenheid": line.eenheid || "",
      "Aantal": Number(line.betaald_aantal || 0),
      "Actie": action && action.toLowerCase() !== "geen" ? action : "",
      "Gratis": Number(line.gratis_aantal || 0),
      "Totaal": Number(line.totaal_aantal || line.betaald_aantal || 0),
      "Info": signed ? "Ondertekend" : "Niet ondertekend"
    });

  });

}


/*
   De Excel wordt hier zelf opgebouwd (met JSZip, dat de app al
   gebruikt), zodat we vette koppen, kleuren en zwarte lijnen kunnen
   zetten. Stijlnummers: zie BK_XLSX_STYLES (cellXfs, van 0 tot 12).
*/

const BK_JSZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

const BK_STYLE = {
  plain: 0,
  title: 1,
  subtitle: 2,
  group: 3,
  header: 4,
  text: 5,
  missing: 6,
  totalLabel: 7,
  line: 8,
  number: 9,
  totalNumber: 10,
  groupFill: 11,
  muted: 12,
  headerCenter: 13,
  center: 14
};

const BK_CENTER_COLUMNS = new Set(["Aantal", "Actie", "Gratis", "Totaal"]);

const BK_NUMBER_COLUMNS = new Set(["Aantal", "Gratis", "Totaal"]);


async function bkLoadJsZip() {

  if (window.JSZip) {
    return;
  }

  await new Promise((resolve, reject) => {

    const script = document.createElement("script");
    script.src = BK_JSZIP_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error("Kon de Excel-module niet laden"));
    };
    document.head.appendChild(script);

  });

}


function bkBuildGroupedSheet(items, title) {

  const width = BK_COLUMNS.length;
  const rows = [];

  const add = (cells, extra = {}) => {
    rows.push({ cells, ...extra });
    return rows[rows.length - 1];
  };

  const filled = (style, firstValue = "", firstStyle = style) =>
    Array.from({ length: width }, (_, index) => ({
      v: index === 0 ? firstValue : "",
      s: index === 0 ? firstStyle : style
    }));

  // Titel + kolomkoppen (één keer, bovenaan vastgezet)
  add([{ v: title, s: BK_STYLE.title }], { height: 24 });
  add([{ v: `Aangemaakt op ${new Date().toLocaleString("nl-BE")}`, s: BK_STYLE.subtitle }]);
  add([]);
  add(
    BK_COLUMNS.map(column => ({
      v: column[0],
      s: BK_CENTER_COLUMNS.has(column[0]) ? BK_STYLE.headerCenter : BK_STYLE.header
    })),
    { height: 20 }
  );

  const headerRow = rows.length;

  let grandTotal = 0;
  let firstSection = true;

  BK_TYPE_ORDER.forEach(type => {

    const sectionItems = items.filter(item => item.type === type);

    if (!sectionItems.length) {
      return;
    }

    // Zwarte horizontale lijn tussen de groepen
    if (!firstSection) {
      add(filled(BK_STYLE.line), { height: 8 });
    }

    firstSection = false;

    // Groepsbalk over de volledige breedte
    add(
      filled(
        BK_STYLE.groupFill,
        `${BK_TYPES[type].section}  ·  ${sectionItems.length} ${sectionItems.length === 1 ? "aanvraag" : "aanvragen"}`,
        BK_STYLE.group
      ),
      { height: 20 }
    );

    let total = 0;

    sectionItems.forEach(item => {

      bkRowsForItem(item).forEach(values => {

        add(values.map((value, index) => {

          const name = BK_COLUMNS[index][0];

          if (BK_NUMBER_COLUMNS.has(name)) {
            return { v: value === "" ? "" : Number(value), s: BK_STYLE.number };
          }

          if (name === "Actie") {
            return { v: value, s: BK_STYLE.center };
          }

          if (name === "Douano-code" && value === "NIET GEKOPPELD") {
            return { v: value, s: BK_STYLE.missing };
          }

          if (name === "Info" || name === "Soort") {
            return { v: value, s: BK_STYLE.muted };
          }

          return { v: value, s: BK_STYLE.text };

        }));

        total += Number(values[BK_COL["Totaal"]] || 0);

      });

    });

    const totalRow = filled(BK_STYLE.totalLabel);
    totalRow[BK_COL["Totaal"] - 1] = { v: `Totaal ${BK_TYPES[type].label.toLowerCase()}`, s: BK_STYLE.totalLabel };
    totalRow[BK_COL["Totaal"]] = { v: total, s: BK_STYLE.totalNumber };
    add(totalRow);

    grandTotal += total;

  });

  // Afsluiting: zwarte lijn + algemeen totaal
  add(filled(BK_STYLE.line), { height: 8 });

  const grand = filled(BK_STYLE.plain);
  grand[BK_COL["Totaal"] - 1] = { v: "Algemeen totaal", s: BK_STYLE.totalLabel };
  grand[BK_COL["Totaal"]] = { v: grandTotal, s: BK_STYLE.totalNumber };
  add(grand, { height: 20 });

  return {
    rows,
    widths: BK_COLUMNS.map(column => column[1]),
    freezeRow: headerRow,
    filterRange: `A${headerRow}:${bkColumnLetter(width - 1)}${headerRow}`
  };

}


function bkXmlEscape(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // tekens die niet in XML mogen
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

}


function bkColumnLetter(index) {

  let letter = "";
  let number = index + 1;

  while (number > 0) {
    const rest = (number - 1) % 26;
    letter = String.fromCharCode(65 + rest) + letter;
    number = Math.floor((number - 1) / 26);
  }

  return letter;

}


const BK_XLSX_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="8">
<font><sz val="10"/><name val="Calibri"/></font>
<font><b/><sz val="15"/><color rgb="FF182019"/><name val="Calibri"/></font>
<font><i/><sz val="9"/><color rgb="FF777777"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF182019"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><color rgb="FFB00020"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><name val="Calibri"/></font>
<font><sz val="9"/><color rgb="FF666666"/><name val="Calibri"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF182019"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF1E8D7"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="4">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="hair"><color rgb="FFC8C8C8"/></bottom><diagonal/></border>
<border><left/><right/><top style="thick"><color rgb="FF000000"/></top><bottom/><diagonal/></border>
<border><left/><right/><top style="thin"><color rgb="FF182019"/></top><bottom/><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="15">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="49" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="6" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="1" fontId="6" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="49" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;


function bkSheetXml(model) {

  const cols =
    model.widths
      .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
      .join("");

  const rowsXml =
    model.rows
      .map((row, rowIndex) => {

        const number = rowIndex + 1;
        const height = row.height ? ` ht="${row.height}" customHeight="1"` : "";

        const cells =
          row.cells
            .map((cell, colIndex) => {

              const ref = `${bkColumnLetter(colIndex)}${number}`;

              if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
                return `<c r="${ref}" s="${cell.s}"><v>${cell.v}</v></c>`;
              }

              if (cell.v === "" || cell.v === null || cell.v === undefined) {
                return `<c r="${ref}" s="${cell.s}"/>`;
              }

              return `<c r="${ref}" s="${cell.s}" t="inlineStr"><is><t xml:space="preserve">${bkXmlEscape(cell.v)}</t></is></c>`;

            })
            .join("");

        return `<row r="${number}"${height}>${cells}</row>`;

      })
      .join("");

  const pane =
    model.freezeRow
      ? `<pane ySplit="${model.freezeRow}" topLeftCell="A${model.freezeRow + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${model.freezeRow + 1}" sqref="A${model.freezeRow + 1}"/>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>${rowsXml}</sheetData>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;

}


async function bkSheetToXlsxBlob(model) {

  await bkLoadJsZip();

  const zip = new JSZip();

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);

  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Boekhouding" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);

  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file("xl/styles.xml", BK_XLSX_STYLES);
  zip.file("xl/worksheets/sheet1.xml", bkSheetXml(model));

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

}


function bkDownloadBlob(blob, filename) {

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 4000);

}


async function bkExport(items, title, filename) {

  if (!items.length) {
    alert("Geen aanvragen voor deze selectie.");
    return;
  }

  try {

    if (typeof loadAdminProductMaster === "function") {
      await loadAdminProductMaster();
    }

    const blob = await bkSheetToXlsxBlob(bkBuildGroupedSheet(items, title));
    bkDownloadBlob(blob, filename);

  }
  catch (error) {

    console.error("BOEKHOUDING EXCEL:", error);

    alert(
      "De Excel kon niet gemaakt worden. Controleer je internetverbinding en probeer opnieuw.\n\n" +
      (error?.message || "")
    );

  }

}


function exportBoekhoudingMonthExcel(monthKey) {

  const items =
    bkCollectItems()
      .filter(item => item.verwerktAt && bkMonthKey(item.date) === monthKey);

  const label = bkMonthLabel(monthKey);

  bkExport(
    items,
    `Boekhoudkundig verwerkt - ${label}`,
    `Achel_boekhouding_verwerkt_${monthKey}.xlsx`
  );

}


function exportBoekhoudingTodoExcel() {

  const filters =
    typeof getCentralReportFilters === "function" ? getCentralReportFilters() : {};

  bkExport(
    bkFilteredTodo(),
    "Te verwerken aanvragen",
    `Achel_boekhouding_te_verwerken_${filters.year || "alle"}_${filters.month || "alle"}.xlsx`
  );

}
