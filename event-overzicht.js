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
      background: var(--bg, #f4f3ef);
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
      padding: 14px 16px calc(10px + env(safe-area-inset-top));
      background: var(--surface, #fff);
      border-bottom: 1px solid var(--border, #ddd9cf);
    }

    .eo-header button.eo-back {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border, #ddd9cf);
      border-radius: 10px;
      background: white;
      color: var(--dark, #182019);
      font-size: 18px;
    }

    .eo-header strong {
      font-size: 16px;
      color: var(--dark, #182019);
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
      color: var(--dark, #182019);
      font-size: 15px;
      text-transform: capitalize;
    }

    .eo-nav button {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border, #ddd9cf);
      border-radius: 10px;
      background: white;
      color: var(--gold, #8c692f);
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
      color: var(--muted, #717972);
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
      color: var(--dark, #182019);
      font-size: 12px;
      font-weight: 700;
    }

    .eo-day.other-month {
      opacity: .22;
    }

    .eo-day.today {
      box-shadow: inset 0 0 0 1px var(--gold, #8c692f);
    }

    .eo-day.has-event {
      background: var(--gold-soft, #f1e8d7);
      color: #694e20;
      font-weight: 900;
    }

    .eo-day-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--gold, #8c692f);
      margin-top: 2px;
    }

    .eo-list-title {
      margin: 18px 0 8px;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--muted, #717972);
    }

    .eo-card {
      background: var(--surface, #fff);
      border: 1px solid var(--border, #ddd9cf);
      border-radius: 14px;
      padding: 12px 13px;
      margin-bottom: 10px;
    }

    .eo-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .eo-card-name {
      font-size: 14px;
      font-weight: 800;
      color: var(--dark, #182019);
    }

    .eo-card-dates {
      margin-top: 2px;
      font-size: 11px;
      color: var(--muted, #717972);
    }

    .eo-badge {
      flex-shrink: 0;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .eo-badge.nieuw        { background: var(--gold-soft, #f1e8d7); color: #694e20; }
    .eo-badge.in_behandeling { background: #e6eef8; color: #2c4d76; }
    .eo-badge.klaar         { background: var(--green-soft, #e7f3eb); color: var(--green, #2f7449); }
    .eo-badge.afgehaald     { background: var(--green-soft, #e7f3eb); color: var(--green, #2f7449); }
    .eo-badge.geannuleerd   { background: var(--red-soft, #f8e9e9); color: var(--red, #a74646); }

    .eo-materials {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--border, #ddd9cf);
      font-size: 12px;
      color: var(--text, #202722);
    }

    .eo-materials div {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }

    .eo-materials div span:first-child {
      color: var(--muted, #717972);
    }

    .eo-requester {
      margin-top: 6px;
      font-size: 11px;
      color: var(--muted, #717972);
    }

    .eo-empty {
      text-align: center;
      padding: 40px 10px;
      color: var(--muted, #717972);
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

    html += `
      <div class="${classes}">
        <span>${day.getDate()}</span>
        ${dayEvents.length ? '<span class="eo-day-dot"></span>' : ""}
      </div>
    `;

  }

  grid.innerHTML = html;

  eoRenderList(year, month);

}


/* ---------- RENDER: EVENTLIJST VAN DE MAAND ---------- */

function eoRenderList(year, month) {

  const list = document.getElementById("eoEventList");

  const monthEvents = eoEvents.filter(ev => {
    const start = eoParseDate(ev.event_vanaf);
    const end = eoParseDate(ev.event_tot) || start;
    if (!start) return false;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return start <= monthEnd && end >= monthStart;
  });

  if (!monthEvents.length) {
    list.innerHTML = `<div class="eo-empty">Geen events deze maand.</div>`;
    return;
  }

  list.innerHTML = monthEvents
    .map(ev => {

      const items = eoEventItems[ev.id] || [];

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

      const requester = eoProfiles[ev.user_id];

      return `
        <div class="eo-card">
          <div class="eo-card-top">
            <div>
              <div class="eo-card-name">${ev.event_naam || ""}</div>
              <div class="eo-card-dates">${eoFormatDateRange(ev)}</div>
            </div>
            <span class="eo-badge ${ev.status}">${eoStatusLabel(ev.status)}</span>
          </div>
          ${materialsHtml}
          ${requester ? `<div class="eo-requester">Aangevraagd door: ${requester}</div>` : ""}
        </div>
      `;

    })
    .join("");

}
