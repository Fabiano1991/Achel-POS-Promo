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
      gap: 2px;
      margin-top: 4px;
    }

    .eo-day {
      aspect-ratio: 1 / 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: rgba(255,255,255,.82);
      font-size: 12px;
      font-weight: 700;
    }

    .eo-day.other-month {
      opacity: .22;
    }

    .eo-day.today {
      box-shadow: inset 0 0 0 1px var(--achel-gold, #c99b43);
    }

    .eo-day.has-event {
      background: rgba(201,155,67,.20);
      color: #f2d99f;
      font-weight: 900;
    }

    .eo-day-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--achel-gold, #c99b43);
      margin-top: 2px;
    }

    .eo-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
    }

    .eo-legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: rgba(246,240,227,.62);
    }

    .eo-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      display: inline-block;
    }

    .eo-day-dots {
      display: flex;
      gap: 2px;
      margin-top: 2px;
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

    .eo-card-name-wrap .eo-dot {
      margin-top: 5px;
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

      <div class="eo-legend" id="eoLegend"></div>

      <div class="eo-list-title">Events deze maand</div>

      <div id="eoEventList"></div>

    </div>

  `;

  document.body.appendChild(wrapper);

}


/* ---------- OPENEN / SLUITEN ---------- */

async function openEventOverzicht() {

  eoEnsureScreen();

  document
    .getElementById("eventOverzichtScreen")
    .classList
    .remove("hidden");

  if (!eoLoaded && !eoLoading) {
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

  if (orderIds.length) {

    const { data: items, error: itemsError } =
      await supabaseClient
        .from("order_items")
        .select("order_id, product_naam, aantal")
        .in("order_id", orderIds);

    if (!itemsError && items) {
      items.forEach(item => {
        if (!eoEventItems[item.order_id]) {
          eoEventItems[item.order_id] = [];
        }
        eoEventItems[item.order_id].push(item);
      });
    }

  }

  if (userIds.length) {

    const { data: profiles, error: profilesError } =
      await supabaseClient
        .from("profiles")
        .select("id, naam")
        .in("id", userIds);

    if (!profilesError && profiles) {
      profiles.forEach(p => {
        eoProfiles[p.id] = p.naam;
      });
    }

  }

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

  let html = "";

  for (let i = 0; i < 42; i++) {

    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);

    const isOtherMonth = day.getMonth() !== month;
    const isToday = eoSameDay(day, today);

    const dayEvents = eoEvents.filter(
      ev => ev.status !== "geannuleerd" && eoDateInEvent(day, ev)
    );

    const classes = [
      "eo-day",
      isOtherMonth ? "other-month" : "",
      isToday ? "today" : "",
      dayEvents.length ? "has-event" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const dayDotsHtml = dayEvents.length
      ? `<div class="eo-day-dots">
          ${dayEvents
            .slice(0, 3)
            .map(
              ev =>
                `<span class="eo-dot" style="width:4px;height:4px;background:${eoColorForUser(
                  ev.user_id
                )}"></span>`
            )
            .join("")}
        </div>`
      : "";

    html += `
      <div class="${classes}">
        <span>${day.getDate()}</span>
        ${dayDotsHtml}
      </div>
    `;

  }

  grid.innerHTML = html;

  eoRenderList(year, month);

}


/* ---------- RENDER: EVENTLIJST VAN DE MAAND ---------- */

function eoRenderList(year, month) {

  const list = document.getElementById("eoEventList");
  const legend = document.getElementById("eoLegend");

  const monthEvents = eoEvents.filter(ev => {
    const start = eoParseDate(ev.event_vanaf);
    const end = eoParseDate(ev.event_tot) || start;
    if (!start) return false;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return start <= monthEnd && end >= monthStart;
  });

  // Legende: één stip per unieke aanvrager die deze maand voorkomt.
  if (legend) {

    const seen = new Set();
    const requesterEntries = [];

    monthEvents.forEach(ev => {
      const naam = eoProfiles[ev.user_id];
      if (naam && !seen.has(ev.user_id)) {
        seen.add(ev.user_id);
        requesterEntries.push({ naam, kleur: eoColorForUser(ev.user_id) });
      }
    });

    legend.innerHTML = requesterEntries
      .map(
        r =>
          `<span class="eo-legend-item"><span class="eo-dot" style="background:${r.kleur}"></span>${r.naam}</span>`
      )
      .join("");

  }

  if (!monthEvents.length) {
    list.innerHTML = `<div class="eo-empty">Geen events deze maand.</div>`;
    return;
  }

  list.innerHTML = monthEvents
    .map(ev => {

      const items = eoEventItems[ev.id] || [];
      const requester = eoProfiles[ev.user_id];
      const kleur = eoColorForUser(ev.user_id);
      const expanded = eoExpandedIds.has(ev.id);

      const materialsHtml = items.length
        ? `<div class="eo-materials">
            ${items
              .map(
                it =>
                  `<div><span>${it.product_naam}</span><span>${it.aantal}x</span></div>`
              )
              .join("")}
          </div>`
        : "";

      return `
        <div class="eo-card ${expanded ? "expanded" : ""}">
          <button class="eo-card-header" onclick="eoToggleCard('${ev.id}')" aria-expanded="${expanded}">
            <div class="eo-card-top">
              <div class="eo-card-name-wrap">
                <span class="eo-dot" style="background:${kleur}"></span>
                <div>
                  <div class="eo-card-name">${ev.event_naam || ""}</div>
                  <div class="eo-card-dates">${eoFormatDateRange(ev)}</div>
                </div>
              </div>
            </div>
            <span class="eo-badge ${ev.status}">${eoStatusLabel(ev.status)}</span>
            <svg class="eo-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="eo-card-body">
            ${materialsHtml}
            ${requester ? `<div class="eo-requester">Aangevraagd door: <strong style="color:${kleur}">${requester}</strong></div>` : ""}
          </div>
        </div>
      `;

    })
    .join("");

}
