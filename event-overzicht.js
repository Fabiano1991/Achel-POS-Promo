/* ============================================================
   EVENT KALENDEROVERZICHT
   Los toe te voegen bestand — voeg toe via:
     <script src="./event-overzicht.js"></script>
   ergens na admin.js / wholesale.js in index.html.

   Open het scherm door ergens `openEventOverzicht()` aan te
   roepen, bv. vanuit het bierglas-menu naast "Event aanvragen":
     <button onclick="openEventOverzicht()">Event kalender</button>

   Vereist geen wijzigingen aan bestaande functies — leest enkel
   uit de bestaande tabellen `orders` en `order_items`, en
   optioneel `profiles` voor de naam van de aanvrager.
============================================================ */

let eoCurrentMonth = new Date();
eoCurrentMonth.setDate(1);

let eoEvents = [];      // ruwe orders met event_naam gevuld
let eoEventItems = {};  // order_id -> [order_items]
let eoProfiles = {};    // user_id -> naam
let eoLoaded = false;
let eoLoading = false;

let eoExpandedIds = new Set(); // order_id's die uitgeklapt staan

// Vaste kleur per aanvrager, zodat dezelfde persoon altijd dezelfde
// kleur krijgt (gebaseerd op user_id, niet willekeurig per render).
// Lichtere tinten dan voorheen, zodat de stippen goed afsteken tegen
// de donkere achtergrond van de app.
const EO_REQUESTER_COLORS = [
  "#e0b85f", "#4fd9c0", "#b794f6", "#6fa8dc",
  "#f0917a", "#8fd48f", "#dd9ecb", "#9cb3d9",
];

function eoColorForUser(userId) {
  if (!userId) return "rgba(246,240,227,.62)";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return EO_REQUESTER_COLORS[hash % EO_REQUESTER_COLORS.length];
}


/* ---------- STYLES ---------- */

function eoInjectStyles() {

  if (document.getElementById("eoStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "eoStyles";
  style.textContent = `

    .eo-overlay {
      position: fixed;
      inset: 0;
      z-index: 260;
      background:
        radial-gradient(
          circle at 50% 45%,
          #20271d 0%,
          #151a14 38%,
          #0d110d 100%
        );
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .eo-overlay.hidden {
      display: none;
    }

    .eo-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: calc(14px + env(safe-area-inset-top)) 16px 14px;
      background: rgba(24,32,25,.97);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(201,155,67,.18);
    }

    .eo-header button.eo-back {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(201,155,67,.38);
      border-radius: 10px;
      background: rgba(18,24,19,.94);
      color: var(--achel-gold-bright, #e0b85f);
      font-size: 18px;
      box-shadow: 0 7px 18px rgba(0,0,0,.22);
    }

    .eo-header strong {
      font-size: 16px;
      color: #fff;
    }

    .eo-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 14px 16px calc(24px + env(safe-area-inset-bottom));
    }

    .eo-nav {
      display: grid;
      grid-template-columns: 40px 1fr 40px;
      align-items: center;
      margin-bottom: 10px;
    }

    .eo-nav strong {
      text-align: center;
      color: #fff;
      font-size: 15px;
      text-transform: capitalize;
    }

    .eo-nav button {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(201,155,67,.20);
      border-radius: 10px;
      background: rgba(255,255,255,.055);
      color: var(--achel-gold-bright, #e0b85f);
      font-size: 20px;
    }

    .eo-weekdays,
    .eo-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .eo-weekdays span {
      padding: 4px 0;
      text-align: center;
      font-size: 8px;
      font-weight: 900;
      color: rgba(246,240,227,.42);
      text-transform: uppercase;
    }

    .eo-days {
      gap: 4px 0;
      margin-top: 4px;
    }

    .eo-day {
      position: relative;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0;
      padding: 0;
      background: transparent;
      color: rgba(255,255,255,.82);
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      -webkit-tap-highlight-color: transparent;
    }

    .eo-day > span.eo-num {
      position: relative;
      z-index: 1;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .eo-day.other-month {
      opacity: .22;
    }

    .eo-day.today > span.eo-num {
      box-shadow: inset 0 0 0 1.5px var(--achel-gold, #c99b43);
    }

    /* Goudkleurige balk onder eventdagen; meerdaagse events lopen door */
    .eo-day.has-event::before {
      content: "";
      position: absolute;
      top: 5px;
      bottom: 5px;
      left: 2px;
      right: 2px;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(224,184,95,.30), rgba(201,155,67,.18));
      border: 1px solid rgba(224,184,95,.38);
    }

    .eo-day.range-start::before {
      right: 0;
      border-right: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    .eo-day.range-mid::before {
      left: 0;
      right: 0;
      border-left: 0;
      border-right: 0;
      border-radius: 0;
    }

    .eo-day.range-end::before {
      left: 0;
      border-left: 0;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    .eo-day.has-event {
      color: #f6e3b4;
      font-weight: 900;
      cursor: pointer;
    }

    .eo-day-count {
      position: absolute;
      z-index: 2;
      top: 1px;
      right: 3px;
      min-width: 15px;
      height: 15px;
      padding: 0 4px;
      border-radius: 999px;
      background: var(--achel-gold, #c99b43);
      color: #151a14;
      font-size: 9px;
      font-weight: 900;
      line-height: 15px;
      text-align: center;
    }

    /* Inklapbare lijst "Events deze maand" */
    .eo-section-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 18px 0 8px;
      padding: 13px 14px;
      border: 1px solid rgba(201,155,67,.32);
      border-radius: 14px;
      background: linear-gradient(145deg,#20271f,#151a15);
      color: #fff;
      font: inherit;
      font-size: 14px;
      font-weight: 850;
      text-align: left;
    }

    .eo-section-toggle .eo-section-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .eo-section-count {
      min-width: 26px;
      padding: 3px 9px;
      border-radius: 999px;
      background: rgba(201,155,67,.16);
      border: 1px solid rgba(201,155,67,.28);
      color: var(--achel-gold-bright, #e0b85f);
      font-size: 12px;
      font-weight: 900;
      text-align: center;
    }

    .eo-section-toggle .eo-chevron {
      margin-top: 0;
    }

    .eo-section-toggle.open .eo-chevron {
      transform: rotate(180deg);
    }

    #eoEventList.collapsed {
      display: none;
    }

    .eo-avatar {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(201,155,67,.16);
      border: 1px solid rgba(201,155,67,.34);
      color: var(--achel-gold-bright, #e0b85f);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .02em;
    }

    .eo-card-by {
      margin-top: 2px;
      font-size: 11px;
      color: rgba(246,240,227,.62);
    }

    .eo-card-by strong {
      color: rgba(246,240,227,.9);
      font-weight: 800;
    }

    .eo-card.flash {
      border-color: var(--achel-gold-bright, #e0b85f);
      box-shadow: 0 0 0 2px rgba(224,184,95,.35), 0 12px 30px rgba(0,0,0,.26);
    }

    .eo-list-title {
      margin: 18px 0 8px;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--achel-gold, #c99b43);
    }

    .eo-card {
      background:
        radial-gradient(circle at 100% 0%, rgba(201,155,67,.08), transparent 31%),
        linear-gradient(145deg,#20271f,#151a15);
      border: 1px solid rgba(201,155,67,.32);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 10px;
      box-shadow: 0 12px 30px rgba(0,0,0,.26);
    }

    .eo-card-header {
      width: 100%;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 13px;
      background: transparent;
      border: 0;
      text-align: left;
      cursor: pointer;
    }

    .eo-card-top {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .eo-card-name-wrap {
      display: flex;
      align-items: flex-start;
      gap: 7px;
    }

    .eo-card-name-wrap {
      min-width: 0;
    }

    .eo-card-name {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
    }

    .eo-chevron {
      flex-shrink: 0;
      margin-top: 2px;
      width: 12px;
      height: 12px;
      transition: transform .15s ease;
      color: var(--achel-gold-bright, #e0b85f);
    }

    .eo-card.expanded .eo-chevron {
      transform: rotate(180deg);
    }

    .eo-card-body {
      display: none;
      padding: 0 13px 12px;
    }

    .eo-card.expanded .eo-card-body {
      display: block;
    }

    .eo-card-dates {
      margin-top: 2px;
      font-size: 11px;
      color: rgba(246,240,227,.62);
    }

    .eo-badge {
      flex-shrink: 0;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      white-space: nowrap;
      background: rgba(201,155,67,.14);
      border: 1px solid rgba(201,155,67,.18);
      color: var(--achel-gold-bright, #e0b85f);
    }

    .eo-badge.in_behandeling {
      background: rgba(58,99,158,.22);
      border: 1px solid rgba(94,140,199,.28);
      color: #a9c6ef;
    }

    .eo-badge.klaar,
    .eo-badge.afgehaald {
      background: rgba(75,152,98,.16);
      border: 1px solid rgba(92,181,119,.22);
      color: #91dbaa;
    }

    .eo-badge.geannuleerd {
      background: rgba(167,70,70,.18);
      border: 1px solid rgba(199,91,91,.22);
      color: #e49b9b;
    }

    .eo-materials {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed rgba(201,155,67,.18);
      font-size: 12px;
      color: rgba(246,240,227,.78);
    }

    .eo-materials div {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }

    .eo-materials div span:first-child {
      color: rgba(246,240,227,.62);
    }

    .eo-requester {
      margin-top: 6px;
      font-size: 11px;
      color: rgba(246,240,227,.62);
    }

    .eo-empty {
      text-align: center;
      padding: 40px 10px;
      color: rgba(246,240,227,.46);
      font-size: 13px;
    }

  `;

  document.head.appendChild(style);

}


/* ---------- SCHERM OPBOUWEN ---------- */

function eoEnsureScreen() {

  if (document.getElementById("eventOverzichtScreen")) {
    return;
  }

  eoInjectStyles();

  const wrapper = document.createElement("div");

  wrapper.id = "eventOverzichtScreen";
  wrapper.className = "eo-overlay hidden";

  wrapper.innerHTML = `

    <div class="eo-header">
      <button class="eo-back" onclick="closeEventOverzicht()">&#8592;</button>
      <strong>Event kalender</strong>
    </div>

    <div class="eo-scroll">

      <div class="eo-nav">
        <button onclick="changeEventOverzichtMonth(-1)">&#8249;</button>
        <strong id="eoMonthLabel"></strong>
        <button onclick="changeEventOverzichtMonth(1)">&#8250;</button>
      </div>

      <div class="eo-weekdays">
        <span>ma</span><span>di</span><span>wo</span><span>do</span>
        <span>vr</span><span>za</span><span>zo</span>
      </div>

      <div class="eo-days" id="eoDaysGrid"></div>

      <button type="button" class="eo-section-toggle" id="eoSectionToggle" onclick="eoToggleSection()" aria-expanded="false">
        <span>Events deze maand</span>
        <span class="eo-section-right">
          <span class="eo-section-count" id="eoSectionCount">0</span>
          <svg class="eo-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </span>
      </button>

      <div id="eoEventList" class="collapsed"></div>

    </div>

  `;

  document.body.appendChild(wrapper);

}


/* ---------- OPENEN / SLUITEN ---------- */

async function openEventOverzicht() {

  eoEnsureScreen();

  eoSectionOpen = false;

  document
    .getElementById("eventOverzichtScreen")
    .classList
    .remove("hidden");

  /*
    Bij elke opening opnieuw ophalen, zodat nieuwe aanvragen van
    collega's (bv. Tom) meteen zichtbaar zijn, ook als de app al
    uren openstaat. Eerder geladen events worden intussen al
    getoond, zodat het scherm niet leeg blijft tijdens het laden.
  */
  if (eoLoaded) {
    eoRenderMonth();
  }

  if (!eoLoading) {
    await eoLoadData();
  }

  eoRenderMonth();

}


function closeEventOverzicht() {

  const el = document.getElementById("eventOverzichtScreen");

  if (el) {
    el.classList.add("hidden");
  }

}


/*
  Namen van alle aanvragers ophalen, ook van collega's.
  Gewone gebruikers mogen de profielen van anderen niet
  rechtstreeks lezen, daarom via een aparte functie in de
  database die enkel id + naam teruggeeft.
  Bestaat die functie (nog) niet, dan vallen we terug op
  de gewone profielen-tabel.
*/
async function eoLoadRequesterNames(userIds) {

  const { data: rpcNames, error: rpcError } =
    await supabaseClient.rpc(
      "get_event_requester_names",
      { user_ids: userIds }
    );

  if (!rpcError && rpcNames) {
    return rpcNames;
  }

  const { data: tableNames, error: profilesError } =
    await supabaseClient
      .from("profiles")
      .select("id, naam")
      .in("id", userIds);

  return profilesError ? [] : (tableNames || []);

}


/* ---------- DATA LADEN ---------- */

async function eoLoadData() {

  eoLoading = true;

  const { data: orders, error: ordersError } =
    await supabaseClient
      .from("orders")
      .select(
        "id, user_id, event_naam, event_vanaf, event_tot, opmerking, status, created_at"
      )
      .not("event_naam", "is", null)
      .order("event_vanaf", { ascending: true });

  if (ordersError) {
    console.error("Kon events niet laden:", ordersError);
    eoLoading = false;
    return;
  }

  eoEvents = orders || [];

  const orderIds = eoEvents.map(o => o.id);
  const userIds = [...new Set(eoEvents.map(o => o.user_id).filter(Boolean))];

  eoEventItems = {};
  eoProfiles = {};

  /*
    SNELHEID: artikels en namen worden nu tegelijk opgehaald
    in plaats van na elkaar (scheelt een volledige wachtronde).
  */

  const itemsPromise =
    orderIds.length
      ? supabaseClient
          .from("order_items")
          .select("order_id, product_naam, aantal")
          .in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null });

  const namesPromise =
    userIds.length
      ? eoLoadRequesterNames(userIds)
      : Promise.resolve([]);

  const [itemsResult, profiles] =
    await Promise.all([itemsPromise, namesPromise]);

  if (!itemsResult.error && itemsResult.data) {
    itemsResult.data.forEach(item => {
      if (!eoEventItems[item.order_id]) {
        eoEventItems[item.order_id] = [];
      }
      eoEventItems[item.order_id].push(item);
    });
  }

  (profiles || []).forEach(p => {
    eoProfiles[p.id] = p.naam;
  });

  eoLoaded = true;
  eoLoading = false;

}


/* ---------- KAART UIT-/INKLAPPEN ---------- */

function eoToggleCard(orderId) {

  if (eoExpandedIds.has(orderId)) {
    eoExpandedIds.delete(orderId);
  } else {
    eoExpandedIds.add(orderId);
  }

  eoRenderList(eoCurrentMonth.getFullYear(), eoCurrentMonth.getMonth());

}


/* ---------- MAAND NAVIGATIE ---------- */

function changeEventOverzichtMonth(direction) {

  eoCurrentMonth.setMonth(eoCurrentMonth.getMonth() + direction);

  eoRenderMonth();

}


/* ---------- HELPERS ---------- */

function eoParseDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d) ? null : d;
}

function eoSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eoDateInEvent(day, ev) {
  const start = eoParseDate(ev.event_vanaf);
  const end = eoParseDate(ev.event_tot) || start;
  if (!start) return false;
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return d >= start && d <= end;
}

function eoFormatDateRange(ev) {
  const start = ev.event_vanaf || "";
  const end = ev.event_tot || "";
  if (start && end && start !== end) {
    return `${eoFormatDate(start)} t/m ${eoFormatDate(end)}`;
  }
  return eoFormatDate(start);
}

function eoFormatDate(str) {
  const d = eoParseDate(str);
  if (!d) return "";
  return d.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function eoStatusLabel(status) {
  const labels = {
    nieuw: "Nieuw",
    in_behandeling: "In behandeling",
    klaar: "Klaar",
    afgehaald: "Afgehaald",
    geannuleerd: "Geannuleerd",
  };
  return labels[status] || status || "";
}


/* ---------- KLEINE HULPFUNCTIES ---------- */

let eoSectionOpen = false;

function eoEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function eoInitials(naam) {
  const parts = String(naam || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function eoActiveEventsOn(day) {
  return eoEvents.filter(
    ev => ev.status !== "geannuleerd" && eoDateInEvent(day, ev)
  );
}

function eoSetSectionOpen(open) {
  eoSectionOpen = open;
  document.getElementById("eoEventList")?.classList.toggle("collapsed", !open);
  const toggle = document.getElementById("eoSectionToggle");
  if (toggle) {
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
}

function eoToggleSection() {
  eoSetSectionOpen(!eoSectionOpen);
}

// Tik op een dag: lijst openklappen en de events van die dag laten oplichten
function eoOpenDay(isoDay) {
  const day = eoParseDate(isoDay);
  if (!day) return;
  const ids = eoActiveEventsOn(day).map(ev => ev.id);
  if (!ids.length) return;

  eoSetSectionOpen(true);

  let first = null;
  ids.forEach(id => {
    const card = document.querySelector(`.eo-card[data-id="${id}"]`);
    if (!card) return;
    if (!first) first = card;
    card.classList.add("flash");
    setTimeout(() => card.classList.remove("flash"), 1600);
  });

  first?.scrollIntoView({ behavior: "smooth", block: "center" });
}


/* ---------- RENDER: MAANDGRID ---------- */

function eoRenderMonth() {

  const label = document.getElementById("eoMonthLabel");
  const grid = document.getElementById("eoDaysGrid");
  const list = document.getElementById("eoEventList");

  if (!label || !grid || !list) {
    return;
  }

  label.textContent = eoCurrentMonth.toLocaleDateString("nl-BE", {
    month: "long",
    year: "numeric",
  });

  const year = eoCurrentMonth.getFullYear();
  const month = eoCurrentMonth.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  // ma=0 ... zo=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Eerst per dag tellen, zodat we doorlopende balken kunnen tekenen
  const days = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push({ day, count: eoActiveEventsOn(day).length });
  }

  let html = "";

  days.forEach(({ day, count }, i) => {

    const col = i % 7;
    const prevHas = col > 0 && days[i - 1].count > 0;
    const nextHas = col < 6 && i < 41 && days[i + 1].count > 0;

    let range = "";
    if (count) {
      if (prevHas && nextHas) range = "range-mid";
      else if (prevHas) range = "range-end";
      else if (nextHas) range = "range-start";
    }

    const classes = [
      "eo-day",
      day.getMonth() !== month ? "other-month" : "",
      eoSameDay(day, today) ? "today" : "",
      count ? "has-event" : "",
      range,
    ].filter(Boolean).join(" ");

    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

    html += `
      <button type="button" class="${classes}" ${count ? `onclick="eoOpenDay('${iso}')" aria-label="${count} event(s) op ${day.getDate()}"` : "tabindex=\"-1\""}>
        <span class="eo-num">${day.getDate()}</span>
        ${count > 1 ? `<span class="eo-day-count">${count}</span>` : ""}
      </button>
    `;

  });

  grid.innerHTML = html;

  eoRenderList(year, month);

}


/* ---------- RENDER: EVENTLIJST VAN DE MAAND ---------- */

function eoRenderList(year, month) {

  const list = document.getElementById("eoEventList");
  const countEl = document.getElementById("eoSectionCount");

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const monthEvents = eoEvents.filter(ev => {
    const start = eoParseDate(ev.event_vanaf);
    const end = eoParseDate(ev.event_tot) || start;
    if (!start) return false;
    return start <= monthEnd && end >= monthStart;
  });

  if (countEl) {
    countEl.textContent = String(
      monthEvents.filter(ev => ev.status !== "geannuleerd").length
    );
  }

  eoSetSectionOpen(eoSectionOpen);

  if (!monthEvents.length) {
    list.innerHTML = `<div class="eo-empty">Geen events deze maand.</div>`;
    return;
  }

  list.innerHTML = monthEvents
    .map(ev => {

      const items = eoEventItems[ev.id] || [];
      const requester = eoProfiles[ev.user_id] || "Onbekend";
      const expanded = eoExpandedIds.has(ev.id);

      const materialsHtml = items.length
        ? `<div class="eo-materials">
            ${items
              .map(
                it =>
                  `<div><span>${eoEsc(it.product_naam)}</span><span>${Number(it.aantal) || 0}x</span></div>`
              )
              .join("")}
          </div>`
        : `<div class="eo-materials"><div><span>Geen materiaal opgegeven</span></div></div>`;

      return `
        <div class="eo-card ${expanded ? "expanded" : ""}" data-id="${eoEsc(ev.id)}">
          <button class="eo-card-header" onclick="eoToggleCard('${eoEsc(ev.id)}')" aria-expanded="${expanded}">
            <div class="eo-card-top">
              <span class="eo-avatar" aria-hidden="true">${eoEsc(eoInitials(requester))}</span>
              <div class="eo-card-name-wrap">
                <div>
                  <div class="eo-card-name">${eoEsc(ev.event_naam)}</div>
                  <div class="eo-card-dates">${eoEsc(eoFormatDateRange(ev))}</div>
                  <div class="eo-card-by">door <strong>${eoEsc(requester)}</strong></div>
                </div>
              </div>
            </div>
            <span class="eo-badge ${eoEsc(ev.status)}">${eoEsc(eoStatusLabel(ev.status))}</span>
            <svg class="eo-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="eo-card-body">
            ${materialsHtml}
            ${ev.opmerking ? `<div class="eo-requester">${eoEsc(ev.opmerking)}</div>` : ""}
          </div>
        </div>
      `;

    })
    .join("");

}
