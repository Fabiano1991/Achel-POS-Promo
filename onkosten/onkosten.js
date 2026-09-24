// =========================================================
// ACHEL ONKOSTEN MODULE
// onkosten.js
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

// Gratis OCR.space API-key: maak er zelf een aan (30 sec, geen creditcard)
// via https://ocr.space/ocrapi/freekey en vul hem hieronder in.
const OCR_SPACE_API_KEY = "K89223258088957";

const CATEGORY_COLUMNS = {
  restaurant: "E",
  hotel: "F",
  vervoer: "G",
  brandstof: "H",
  parking: "I",
  maaltijd: "J",
  overige: "K"
};

const CATEGORY_LABELS = {
  restaurant: "Restaurant",
  hotel: "Hotel",
  vervoer: "Vervoer",
  brandstof: "Brandstof",
  parking: "Parking",
  maaltijd: "Maaltijd",
  overige: "Overige"
};

// Template-rijen (zie onkosten-template.xlsx — origineel, ongewijzigd bestand)
const DATA_START_ROW = 9;
const DATA_END_ROW = 27;      // 19 regels beschikbaar per export
const SUM_ROW = 28;
const SUBTOTAL_ROW = 29;
const APPROVED_ROW = 30;
const TOTAL_ROW = 31;

const ADMIN_ROLES = ["admin", "verantwoordelijke", "commercieel_directeur", "boekhoudster"];

let currentSession = null;
let currentProfile = null;
let representatives = [];
let myExpenses = [];
let adminExpenses = [];
let isAdminUser = false;
let currentView = "homeView";
let adminRepFilterValue = "all";
let lastReceiptFile = null;

// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initOnkosten
);

async function initOnkosten() {
  bindNavigation();
  bindForm();
  bindReceiptUpload();
  bindExportButton();

  const dateField =
    document.getElementById("expenseDate");

  if (dateField) {
    dateField.value =
      new Date().toISOString().slice(0, 10);
  }

  const today = new Date();
  const monthStart =
    new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().slice(0, 10);
  const monthEnd =
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().slice(0, 10);

  ["exportFrom", "adminExportFrom"].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = monthStart;
  });

  ["exportTo", "adminExportTo"].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = monthEnd;
  });

  try {
    const {
      data: { session },
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    currentSession = session;

    await Promise.all([
      loadCurrentProfile(),
      loadRepresentatives()
    ]);

    fillRepresentativeSelect();

    isAdminUser =
      ADMIN_ROLES.includes(currentProfile?.rol);

    if (isAdminUser) {
      document
        .getElementById("adminActionCard")
        ?.classList.remove("hidden");

      fillAdminRepFilter();
      bindAdminControls();
    }

    await refreshMyExpenses();
  }
  catch (error) {
    console.error("ONKOSTEN INIT FOUT:", error);
    showMessage(
      "expenseMessage",
      "De onkosten-module kon niet volledig worden geladen.",
      "error"
    );
  }
}

// =========================================================
// NAVIGATIE
// =========================================================

function bindNavigation() {
  document
    .querySelectorAll("[data-view-target]")
    .forEach(button => {
      button.addEventListener("click", () =>
        openView(button.dataset.viewTarget)
      );
    });

  document
    .getElementById("headerBackButton")
    ?.addEventListener("click", handleHeaderBack);
}

function openView(viewId) {
  document
    .querySelectorAll(".view-section")
    .forEach(section =>
      section.classList.add("hidden")
    );

  const target = document.getElementById(viewId);

  if (target) {
    target.classList.remove("hidden");
  }

  currentView = viewId;

  window.scrollTo({ top: 0, behavior: "smooth" });
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
  const { data, error } =
    await supabaseClient
      .from("profiles")
      .select("id, naam, email, rol, actief")
      .eq("id", currentSession.user.id)
      .single();

  if (error) throw error;

  currentProfile = data;
}

async function loadRepresentatives() {
  const { data, error } =
    await supabaseClient
      .from("profiles")
      .select("id, naam, email, rol, actief")
      .eq("actief", true)
      .order("naam", { ascending: true });

  if (error) throw error;

  representatives =
    (data || []).filter(profile =>
      [
        "vertegenwoordiger",
        "admin",
        "verantwoordelijke"
      ].includes(profile.rol)
    );
}

function fillRepresentativeSelect() {
  const select =
    document.getElementById("expenseRepresentative");

  if (!select) return;

  select.innerHTML =
    representatives
      .map(profile => `
        <option value="${escapeHtml(profile.id)}">
          ${escapeHtml(profile.naam || profile.email || "Onbekend")}
        </option>
      `)
      .join("");

  const own =
    representatives.find(
      item => item.id === currentSession.user.id
    );

  if (own) {
    select.value = own.id;
  }
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

// =========================================================
// BONNETJE UPLOAD + OCR
// =========================================================

function bindReceiptUpload() {
  const input = document.getElementById("receiptInput");

  input?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    lastReceiptFile = file;

    const preview =
      document.getElementById("receiptPreview");

    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.classList.remove("hidden");
    }

    await runReceiptOcr(file);
  });
}

async function runReceiptOcr(file) {
  const statusEl = document.getElementById("ocrStatus");

  if (!OCR_SPACE_API_KEY || OCR_SPACE_API_KEY.startsWith("PLAK_HIER")) {
    setOcrStatus(
      "Geen OCR-key ingesteld — vul je gratis OCR.space API-key in bovenaan onkosten.js. Je kan onderstaande velden ook gewoon manueel invullen.",
      "error"
    );
    return;
  }

  setOcrStatus("Bonnetje wordt gelezen...", "");

  try {
    const compressedBlob = await compressImageForOcr(file);

    const formData = new FormData();
    formData.append("apikey", OCR_SPACE_API_KEY);
    formData.append("language", "dut");
    formData.append("OCREngine", "2");
    formData.append("scale", "true");
    formData.append("file", compressedBlob, "bonnetje.jpg");

    const response = await fetch(
      "https://api.ocr.space/parse/image",
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(
        data.ErrorMessage?.join?.(", ") ||
        "OCR-dienst gaf een fout terug."
      );
    }

    const text =
      data?.ParsedResults?.[0]?.ParsedText || "";

    if (!text.trim()) {
      setOcrStatus(
        "Geen tekst herkend op het bonnetje. Vul de velden manueel in.",
        "error"
      );
      return;
    }

    const parsed = parseReceiptText(text);
    applyParsedReceipt(parsed);

    const found = [];
    if (parsed.amount) found.push(`bedrag €${parsed.amount.toFixed(2)}`);
    if (parsed.date) found.push(`datum ${parsed.date}`);
    if (parsed.supplierGuess) found.push(`leverancier "${parsed.supplierGuess}"`);

    setOcrStatus(
      found.length
        ? `Herkend: ${found.join(", ")}. Controleer en pas aan indien nodig.`
        : "Bonnetje gelezen, maar geen bedrag/datum herkend. Vul manueel aan.",
      found.length ? "success" : ""
    );
  }
  catch (error) {
    console.error("OCR FOUT:", error);
    setOcrStatus(
      "Bonnetje scannen mislukt. Vul de velden manueel in.",
      "error"
    );
  }
}

function compressImageForOcr(file) {
  const MAX_DIMENSION = 1600;
  const MAX_BYTES = 950 * 1024; // veiligheidsmarge onder de 1MB-limiet

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = quality => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error("Kon foto niet verwerken."));
              return;
            }

            if (blob.size > MAX_BYTES && quality > 0.3) {
              tryQuality(quality - 0.15);
              return;
            }

            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };

      tryQuality(0.8);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Kon foto niet inladen."));
    };

    img.src = objectUrl;
  });
}

function setOcrStatus(message, type) {
  const el = document.getElementById("ocrStatus");
  if (!el) return;

  el.textContent = message;
  el.classList.remove("hidden", "ocr-error", "ocr-success");

  if (type === "error") el.classList.add("ocr-error");
  if (type === "success") el.classList.add("ocr-success");
}

function parseReceiptText(text) {
  const lines =
    text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

  // ---- bedrag ----
  // Zoek eerst naar een lijn met "totaal"/"total"/"te betalen", anders het
  // grootste bedrag op het hele bonnetje (meestal het eindtotaal).
  const amountPattern = /(\d{1,4}[.,]\d{2})/g;
  let amount = null;

  const totalLine = lines.find(line =>
    /totaal|total|te betalen|som/i.test(line)
  );

  if (totalLine) {
    const matches = [...totalLine.matchAll(amountPattern)];
    if (matches.length) {
      amount = parseFloat(
        matches[matches.length - 1][1].replace(",", ".")
      );
    }
  }

  if (amount === null) {
    const allMatches = [...text.matchAll(amountPattern)];
    const values =
      allMatches
        .map(m => parseFloat(m[1].replace(",", ".")))
        .filter(v => !isNaN(v) && v > 0 && v < 5000);

    if (values.length) {
      amount = Math.max(...values);
    }
  }

  // ---- datum ----
  const datePattern =
    /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/;

  let date = null;
  const dateMatch = text.match(datePattern);

  if (dateMatch) {
    let [, day, month, year] = dateMatch;
    if (year.length === 2) year = `20${year}`;

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      date =
        `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // ---- leverancier (ruwe gok: eerste niet-lege regel) ----
  const supplierGuess =
    lines.length ? lines[0].slice(0, 60) : null;

  return { amount, date, supplierGuess };
}

function applyParsedReceipt(parsed) {
  if (parsed.amount) {
    const field = document.getElementById("expenseAmount");
    if (field) field.value = parsed.amount.toFixed(2);
  }

  if (parsed.date) {
    const field = document.getElementById("expenseDate");
    if (field) field.value = parsed.date;
  }

  if (parsed.supplierGuess) {
    const field = document.getElementById("expenseSupplier");
    if (field && !field.value) field.value = parsed.supplierGuess;
  }
}

// =========================================================
// FORMULIER OPSLAAN
// =========================================================

function bindForm() {
  document
    .getElementById("expenseForm")
    ?.addEventListener("submit", handleExpenseSubmit);
}

async function handleExpenseSubmit(event) {
  event.preventDefault();

  const button = document.getElementById("saveExpenseButton");
  const form = event.target;
  const formData = new FormData(form);

  const representativeId =
    formData.get("representative_id");

  const representative =
    representatives.find(
      item => item.id === representativeId
    );

  const payload = {
    representative_id: representativeId,
    representative_name:
      representative?.naam || representative?.email || "",
    expense_date: formData.get("expense_date"),
    supplier: (formData.get("supplier") || "").trim(),
    description: (formData.get("description") || "").trim(),
    category: formData.get("category"),
    amount: parseFloat(formData.get("amount"))
  };

  if (!payload.representative_id || !payload.expense_date ||
      !payload.supplier || !payload.category ||
      isNaN(payload.amount) || payload.amount <= 0) {
    showMessage(
      "expenseMessage",
      "Vul alle verplichte velden correct in.",
      "error"
    );
    return;
  }

  button.disabled = true;

  try {
    const { error } =
      await supabaseClient
        .from("expenses")
        .insert(payload);

    if (error) throw error;

    showMessage(
      "expenseMessage",
      "Onkost opgeslagen.",
      "success"
    );

    form.reset();
    document.getElementById("expenseDate").value =
      new Date().toISOString().slice(0, 10);
    fillRepresentativeSelect();

    const preview = document.getElementById("receiptPreview");
    preview?.classList.add("hidden");
    lastReceiptFile = null;

    document.getElementById("ocrStatus")?.classList.add("hidden");

    await refreshMyExpenses();

    setTimeout(() => openView("homeView"), 700);
  }
  catch (error) {
    console.error("OPSLAAN FOUT:", error);
    showMessage(
      "expenseMessage",
      "Opslaan mislukt. Probeer opnieuw.",
      "error"
    );
  }
  finally {
    button.disabled = false;
  }
}

function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = text;
  el.classList.remove("hidden", "success", "error");
  el.classList.add(type);
}

// =========================================================
// LIJST + TELLERS
// =========================================================

async function refreshMyExpenses() {
  const { data, error } =
    await supabaseClient
      .from("expenses")
      .select("*")
      .eq("representative_id", currentSession.user.id)
      .order("expense_date", { ascending: false });

  if (error) throw error;

  myExpenses = data || [];

  updateStats();
  renderExpenseRecords("expensesList", myExpenses);

  if (isAdminUser) {
    await refreshAdminExpenses();
  }
}

async function refreshAdminExpenses() {
  let query =
    supabaseClient
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

  if (adminRepFilterValue !== "all") {
    query = query.eq("representative_id", adminRepFilterValue);
  }

  const { data, error } = await query;
  if (error) throw error;

  adminExpenses = data || [];
  renderExpenseRecords("adminExpensesList", adminExpenses);
}

function updateStats() {
  const currentMonth =
    new Date().toISOString().slice(0, 7);

  const monthExpenses =
    myExpenses.filter(expense =>
      (expense.expense_date || "").startsWith(currentMonth)
    );

  const total =
    monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

  setText("monthCount", monthExpenses.length);
  setText("monthTotal", `€${total.toFixed(2)}`);

  const hint = document.getElementById("expensesEmptyHint");
  hint?.classList.toggle("hidden", monthExpenses.length > 0);
}

function renderExpenseRecords(containerId, expenses) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!expenses.length) {
    container.innerHTML =
      `<div class="empty-state">Nog geen onkosten.</div>`;
    return;
  }

  container.innerHTML =
    expenses
      .map(expense => `
        <details class="record-card">
          <summary>
            <div>
              <strong>${escapeHtml(expense.supplier)}</strong>
              <small>${formatDate(expense.expense_date)} · ${escapeHtml(CATEGORY_LABELS[expense.category] || expense.category)}</small>
            </div>
            <span class="record-badge">€${Number(expense.amount).toFixed(2)}</span>
          </summary>
          <div class="record-body">
            ${expense.description ? `<p>${escapeHtml(expense.description)}</p>` : ""}
            ${expense.representative_name ? `<p>${escapeHtml(expense.representative_name)}</p>` : ""}
          </div>
        </details>
      `)
      .join("");
}

// =========================================================
// ADMIN
// =========================================================

function bindAdminControls() {
  document
    .getElementById("adminRepFilter")
    ?.addEventListener("change", async event => {
      adminRepFilterValue = event.target.value;
      await refreshAdminExpenses();
    });

  document
    .getElementById("exportAdminExpensesButton")
    ?.addEventListener("click", () =>
      exportExpensesToExcel({
        expenses: adminExpenses,
        fromInputId: "adminExportFrom",
        toInputId: "adminExportTo",
        kantoorInputId: "adminExportKantoor",
        representativeId:
          adminRepFilterValue !== "all"
            ? adminRepFilterValue
            : null
      })
    );
}

function bindExportButton() {
  document
    .getElementById("exportExpensesButton")
    ?.addEventListener("click", () =>
      exportExpensesToExcel({
        expenses: myExpenses,
        fromInputId: "exportFrom",
        toInputId: "exportTo",
        kantoorInputId: "exportKantoor",
        representativeId: currentSession?.user?.id,
        forceOwnProfile: true
      })
    );
}

// =========================================================
// EXCEL EXPORT — vult het bestaande sjabloon in
// =========================================================

async function exportExpensesToExcel({
  expenses,
  fromInputId,
  toInputId,
  kantoorInputId,
  representativeId,
  forceOwnProfile
}) {
  const fromValue =
    document.getElementById(fromInputId)?.value;

  const toValue =
    document.getElementById(toInputId)?.value;

  const kantoor =
    document.getElementById(kantoorInputId)?.value || "";

  if (!fromValue || !toValue) {
    alert("Kies eerst een 'Van' en 'T/m' datum om te exporteren.");
    return;
  }

  if (fromValue > toValue) {
    alert("De 'Van'-datum ligt na de 'T/m'-datum.");
    return;
  }

  const filtered =
    expenses.filter(expense =>
      expense.expense_date >= fromValue &&
      expense.expense_date <= toValue
    );

  if (!filtered.length) {
    alert("Geen onkosten gevonden in deze periode.");
    return;
  }

  // Als er meer onkosten zijn dan er rijen in het sjabloon passen, worden
  // hieronder automatisch extra rijen toegevoegd (in dezelfde opmaak) —
  // het sjabloonbestand zelf blijft ongewijzigd, dit gebeurt enkel in het
  // geëxporteerde bestand.

  // Naam: bij de eigen export altijd het profiel van de ingelogde gebruiker,
  // ongeacht welke vertegenwoordiger op individuele onkosten staat.
  // Bij beheer-export: de gekozen/gefilterde vertegenwoordiger.
  const naam =
    forceOwnProfile
      ? (currentProfile?.naam || currentProfile?.email || "")
      : (
          representatives.find(item => item.id === representativeId)?.naam ||
          representatives.find(item => item.id === representativeId)?.email ||
          currentProfile?.naam ||
          currentProfile?.email ||
          ""
        );

  let templateBuffer;

  try {
    const response =
      await fetch("./onkosten-template.xlsx");

    if (!response.ok) {
      alert(
        `Het sjabloon 'onkosten-template.xlsx' werd niet gevonden (fout ${response.status}). ` +
        `Controleer of dat bestand in dezelfde map staat als index.html en onkosten.js.`
      );
      return;
    }

    templateBuffer = await response.arrayBuffer();

    if (!templateBuffer || templateBuffer.byteLength < 1000) {
      alert(
        "Het geladen sjabloon lijkt leeg of beschadigd. Controleer of " +
        "onkosten-template.xlsx correct is geüpload (niet als tekstbestand)."
      );
      return;
    }
  }
  catch (error) {
    console.error("SJABLOON LAADFOUT:", error);
    alert("Kon het sjabloon niet laden. Controleer je internetverbinding en probeer opnieuw.");
    return;
  }

  try {
    const zip = await JSZip.loadAsync(templateBuffer);
    const sheetPath = "xl/worksheets/sheet1.xml";
    const sheetFile = zip.file(sheetPath);

    if (!sheetFile) {
      alert(
        "Het sjabloon werd geladen, maar het werkblad werd niet gevonden. " +
        "Is dit wel het juiste bestand?"
      );
      return;
    }

    let xml = await sheetFile.async("string");

    xml = setInlineStringCell(xml, "C5", naam);
    xml = setInlineStringCell(xml, "C6", kantoor);
    xml = setNumberCell(xml, "L4", toExcelSerial(fromValue));
    xml = setNumberCell(xml, "L5", toExcelSerial(toValue));

    const sorted =
      [...filtered].sort((a, b) =>
        (a.expense_date || "").localeCompare(b.expense_date || "")
      );

    // Past het sjabloon aan (extra rijen, in dezelfde stijl) als er meer
    // onkosten zijn dan de standaard 19 rijen. Bij minder of gelijk aan
    // 19 gebeurt er niets en blijft alles zoals in het origineel sjabloon.
    const expansion = expandTemplateIfNeeded(xml, sorted.length);
    xml = expansion.xml;
    const dataEndRow = expansion.dataEndRow;
    const subtotalRow = expansion.subtotalRow;
    const approvedRow = expansion.approvedRow;
    const totalRow = expansion.totalRow;

    let totalAmount = 0;

    sorted.forEach((expense, index) => {
      const row = DATA_START_ROW + index;
      const amount = Number(expense.amount) || 0;
      totalAmount += amount;

      xml = setNumberCell(xml, `B${row}`, toExcelSerial(expense.expense_date));
      xml = setInlineStringCell(xml, `C${row}`, expense.supplier || "");
      xml = setInlineStringCell(xml, `D${row}`, expense.description || "");
      xml = setNumberCell(xml, `L${row}`, amount);
    });

    // Het sjabloon heeft in de "Subtotaal"-rij al een som-formule staan
    // (SUM(L9:L...)) en in de "Totaal"-rij de formule (Subtotaal-Voorschot).
    // Enkel de vooraf opgeslagen berekende waarde (<v>) in het sjabloon
    // staat nog op 0, en die wordt niet altijd automatisch herberekend bij
    // het openen — daardoor bleef het totaal onderaan leeg/0 staan. We
    // laten de formules exact zoals ze in het sjabloon staan (of, bij extra
    // rijen, met de meegeschoven rij-range), en vullen enkel de berekende
    // waarde meteen correct in.
    xml = setFormulaCell(
      xml,
      `L${subtotalRow}`,
      `SUM(L${DATA_START_ROW}:L${dataEndRow})`,
      totalAmount
    );

    // "Voorschot" wordt niet door de export ingevuld en staat dus op 0 bij
    // het genereren, dus Totaal = Subtotaal - 0 = Subtotaal.
    xml = setFormulaCell(
      xml,
      `L${totalRow}`,
      `(L${subtotalRow}-L${approvedRow})`,
      totalAmount
    );

    zip.file(sheetPath, xml);

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
      `Onkostennota_${(naam || "onbekend").replace(/\s+/g, "_")}_${fromValue}_${toValue}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  catch (error) {
    console.error("EXPORT FOUT:", error);
    alert("Export mislukt. Probeer opnieuw.");
  }
}

// ---- automatisch extra rijen toevoegen als er meer onkosten zijn dan ----
// ---- het sjabloon aan vaste rijen (9 t/m 27) heeft ----------------------
//
// Het sjabloon zelf (onkosten-template.xlsx) wordt hierbij NOOIT aangepast:
// dit gebeurt enkel op de XML in het geheugen tijdens het exporteren. De
// stijl van rij 13 (geschaduwd) en rij 14 (effen) wordt gebruikt als basis
// voor de afwisseling van nieuwe rijen; de laatste rij krijgt de dikkere
// "afsluit"-opmaak die rij 27 van origine had.

const ROW_STYLE_SHADED = {
  A: 29, B: 52, C: 19, D: 61, E: 53, F: 35, G: 35,
  H: 35, I: 35, J: 35, K: 35, L: 36, M: 5
};

const ROW_STYLE_PLAIN = {
  A: 29, B: 54, C: 20, D: 55, E: 67, F: 37, G: 37,
  H: 37, I: 37, J: 37, K: 37, L: 36, M: 5
};

const ROW_STYLE_CLOSING = {
  A: 29, B: 65, C: 22, D: 63, E: 39, F: 39, G: 39,
  H: 39, I: 39, J: 39, K: 39, L: 40, M: 5
};

const ROW_COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];

function getRowXml(xml, rowNum) {
  const openTag = `<row r="${rowNum}"`;
  const start = xml.indexOf(openTag);

  if (start === -1) {
    throw new Error(`Rij ${rowNum} niet gevonden in sjabloon.`);
  }

  const end = xml.indexOf("</row>", start) + "</row>".length;

  return { start, end, xml: xml.slice(start, end) };
}

function replaceRowXmlInPlace(xml, rowNum, newRowXml) {
  const { start, end } = getRowXml(xml, rowNum);
  return xml.slice(0, start) + newRowXml + xml.slice(end);
}

function shiftRowXml(rowXml, oldRowNum, newRowNum) {
  let shifted = rowXml.replace(
    new RegExp(`<row r="${oldRowNum}"`),
    `<row r="${newRowNum}"`
  );

  shifted = shifted.replace(
    new RegExp(`r="([A-Z]+)${oldRowNum}"`, "g"),
    (match, col) => `r="${col}${newRowNum}"`
  );

  return shifted;
}

function buildEmptyDataRow(rowNum, styles) {
  const cells = ROW_COLUMNS
    .map(col => `<c r="${col}${rowNum}" s="${styles[col]}"/>`)
    .join("");

  return (
    `<row r="${rowNum}" spans="1:13" ht="17.100000000000001" ` +
    `customHeight="1" x14ac:dyDescent="0.25">${cells}</row>`
  );
}

function expandTemplateIfNeeded(xml, neededRows) {
  const capacity = DATA_END_ROW - DATA_START_ROW + 1;
  const extra = neededRows - capacity;

  if (extra <= 0) {
    return {
      xml,
      dataEndRow: DATA_END_ROW,
      subtotalRow: SUBTOTAL_ROW,
      approvedRow: APPROVED_ROW,
      totalRow: TOTAL_ROW
    };
  }

  // 1) De "voettekst"-rijen bewaren (categorie-sommen, subtotaal,
  //    voorschot, totaal) — deze schuiven straks samen met de nieuwe
  //    rijen mee naar onder.
  const footerRowNums = [SUM_ROW, SUBTOTAL_ROW, APPROVED_ROW, TOTAL_ROW];
  const footerRows = footerRowNums.map(rowNum => getRowXml(xml, rowNum));

  // 2) Dat volledige stuk (rij 28 t/m 31) uit de XML knippen — dit wordt
  //    verderop helemaal opnieuw samengesteld met de juiste rijnummers.
  const cutStart = footerRows[0].start;
  const cutEnd = footerRows[footerRows.length - 1].end;
  let head = xml.slice(0, cutStart);
  const tail = xml.slice(cutEnd);

  // 3) Rij 27 had tot nu toe de dikkere "afsluit"-rand omdat het de
  //    laatste rij was. Nu er meer rijen bijkomen, wordt rij 27 een
  //    gewone (geschaduwde) rij zoals de rest van het afwisselende
  //    patroon.
  const row27Xml = buildEmptyDataRow(DATA_END_ROW, ROW_STYLE_SHADED);
  head = replaceRowXmlInPlace(head, DATA_END_ROW, row27Xml);

  // 4) Nieuwe rijen toevoegen na rij 27, in hetzelfde afwisselende
  //    geschaduwd/effen-patroon. De echt laatste nieuwe rij krijgt de
  //    "afsluit"-opmaak.
  const newDataEndRow = DATA_END_ROW + extra;
  let newRowsXml = "";

  for (let rowNum = DATA_END_ROW + 1; rowNum <= newDataEndRow; rowNum++) {
    if (rowNum === newDataEndRow) {
      newRowsXml += buildEmptyDataRow(rowNum, ROW_STYLE_CLOSING);
    }
    else {
      const isShaded = (rowNum - DATA_START_ROW) % 2 === 0;
      newRowsXml += buildEmptyDataRow(rowNum, isShaded ? ROW_STYLE_SHADED : ROW_STYLE_PLAIN);
    }
  }

  // 5) De voettekst-rijen opnieuw opbouwen met de opgeschoven rijnummers,
  //    met behoud van hun labels ("Subtotaal", "GOEDGEKEURD:", "Totaal", ...)
  //    en opmaak.
  const newSumRow = SUM_ROW + extra;
  const newSubtotalRow = SUBTOTAL_ROW + extra;
  const newApprovedRow = APPROVED_ROW + extra;
  const newTotalRow = TOTAL_ROW + extra;

  const shiftedFooterXml =
    shiftRowXml(footerRows[0].xml, SUM_ROW, newSumRow) +
    shiftRowXml(footerRows[1].xml, SUBTOTAL_ROW, newSubtotalRow) +
    shiftRowXml(footerRows[2].xml, APPROVED_ROW, newApprovedRow) +
    shiftRowXml(footerRows[3].xml, TOTAL_ROW, newTotalRow);

  let newXml = head + newRowsXml + shiftedFooterXml + tail;

  // 6) De dimension-referentie (bv. A1:M31) bijwerken naar de nieuwe
  //    laatste rij.
  newXml = newXml.replace(
    /<dimension ref="A1:M\d+"\/>/,
    `<dimension ref="A1:M${newTotalRow}"/>`
  );

  // 7) De categorie-som-formules (op de opgeschoven "SUM_ROW") verwezen
  //    nog naar de oude rij-27-grens; die bijwerken naar de nieuwe
  //    laatste datarij. (Deze kolommen worden niet door de export
  //    ingevuld, dus de berekende waarde blijft 0.)
  ["E", "F", "G", "H", "I", "K"].forEach(col => {
    newXml = setFormulaCell(
      newXml,
      `${col}${newSumRow}`,
      `SUM(${col}${DATA_START_ROW}:${col}${newDataEndRow})`,
      0
    );
  });

  return {
    xml: newXml,
    dataEndRow: newDataEndRow,
    subtotalRow: newSubtotalRow,
    approvedRow: newApprovedRow,
    totalRow: newTotalRow
  };
}

// ---- chirurgische celbewerking: past enkel de aangeduide cel aan, ----
// ---- de rest van het bestand blijft volledig ongewijzigd ----

function findCellTag(xml, ref) {
  const start = xml.indexOf(`<c r="${ref}"`);
  if (start === -1) {
    throw new Error(`Cel ${ref} niet gevonden in sjabloon.`);
  }

  const selfClose = xml.indexOf("/>", start);
  const openClose = xml.indexOf("</c>", start);
  const tagOpenEnd = xml.indexOf(">", start);

  let end;
  if (tagOpenEnd !== -1 && xml[tagOpenEnd - 1] === "/") {
    end = tagOpenEnd + 1; // zelfsluitend: <c .../>
  }
  else {
    end = openClose + 4; // heeft inhoud: <c ...>...</c>
  }

  const fullTag = xml.slice(start, end);
  const styleMatch = fullTag.match(/ s="(\d+)"/);
  const style = styleMatch ? ` s="${styleMatch[1]}"` : "";

  return { start, end, fullTag, style };
}

function setNumberCell(xml, ref, number) {
  const { start, end, style } = findCellTag(xml, ref);
  const newTag = `<c r="${ref}"${style}><v>${number}</v></c>`;
  return xml.slice(0, start) + newTag + xml.slice(end);
}

function setFormulaCell(xml, ref, formula, cachedValue) {
  const { start, end, style } = findCellTag(xml, ref);
  const newTag =
    `<c r="${ref}"${style}><f>${escapeXml(formula)}</f><v>${cachedValue}</v></c>`;
  return xml.slice(0, start) + newTag + xml.slice(end);
}

function setInlineStringCell(xml, ref, text) {
  const { start, end, style } = findCellTag(xml, ref);

  if (!text) {
    const newTag = `<c r="${ref}"${style}/>`;
    return xml.slice(0, start) + newTag + xml.slice(end);
  }

  const newTag =
    `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
  return xml.slice(0, start) + newTag + xml.slice(end);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

function toExcelSerial(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcDate = Date.UTC(y, m - 1, d);
  const epoch = Date.UTC(1899, 11, 30);
  return Math.round((utcDate - epoch) / 86400000);
}

// =========================================================
// HULPFUNCTIES
// =========================================================

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
