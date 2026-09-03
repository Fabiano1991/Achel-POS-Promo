// =========================================================
// ACHEL B2B MODULE
// b2b.js
// Alleen B2B-data wordt hier geladen.
// =========================================================

const SUPABASE_URL =
  "https://qosjfznmdnswwfnglxqt.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_pyiiMmH2tpl-lL3e_edcow_4ztJX-Ul";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =========================================================
// START
// =========================================================

document.addEventListener("DOMContentLoaded", initB2B);

async function initB2B() {

  // Dashboard alleen laden op de echte B2B-homepagina.
  // Andere B2B-pagina's voeren hierdoor geen onnodige queries uit.
  if (
    !document.getElementById("upcomingDaysCount")
  ) {
    return;
  }

  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) throw error;

    // Niet ingelogd? Terug naar hoofdapp.
    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    const user = session.user;

    setWelcomeName(user);

    // Alleen kleine queries voor deze dashboardtellers.
    await Promise.all([
      loadUpcomingDays(),
      loadMyRegistrations(user.id),
      loadMyFollowups(user.id),
      loadB2BHomeInsights(user.id)
    ]);

  } catch (error) {
    console.error("B2B initialisatie mislukt:", error);

    showStatus(
      "B2B kon niet volledig worden geladen. Probeer opnieuw."
    );
  }
}

async function loadB2BHomeInsights(userId) {
  const nextText = document.getElementById("nextB2BDayText");
  const occupancyText = document.getElementById("monthlyOccupancyText");
  const occupancyBar = document.getElementById("monthlyOccupancyBar");

  if (!nextText || !occupancyText || !occupancyBar) return;

  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().slice(0, 10);

    const { data: nextDays, error: nextDayError } = await supabaseClient
      .from("b2b_days")
      .select("id, event_date")
      .gte("event_date", today)
      .in("status", ["open", "full"])
      .order("event_date", { ascending: true })
      .limit(1);

    if (nextDayError) throw nextDayError;

    const nextDay = nextDays?.[0] || null;

    if (nextDay?.event_date) {
      const todayDate = new Date(`${today}T00:00:00`);
      const eventDate = new Date(`${nextDay.event_date}T00:00:00`);
      const diffDays = Math.max(0, Math.ceil((eventDate - todayDate) / 86400000));

      if (diffDays === 0) {
        nextText.innerHTML = "Eerstvolgende B2B-dag<br><strong>vandaag</strong>";
      } else if (diffDays === 1) {
        nextText.innerHTML = "Eerstvolgende B2B-dag<br><strong>morgen</strong>";
      } else {
        nextText.innerHTML = `Eerstvolgende B2B-dag<br>over <strong>${diffDays} dagen</strong>`;
      }
    } else {
      nextText.textContent = "Geen komende B2B-dag";
    }

    const { data: monthDays, error: monthDaysError } = await supabaseClient
      .from("b2b_days")
      .select("id")
      .gte("event_date", monthStart)
      .lte("event_date", monthEnd)
      .in("status", ["open", "full", "closed"]);

    if (monthDaysError) throw monthDaysError;

    const dayIds = (monthDays || []).map(day => day.id);

    if (!dayIds.length) {
      occupancyText.textContent = "0%";
      occupancyBar.style.width = "0%";
      return;
    }

    const [quotaResult, registrationResult] = await Promise.all([
      supabaseClient
        .from("b2b_quotas")
        .select("b2b_day_id, quota")
        .eq("representative_id", userId)
        .in("b2b_day_id", dayIds),

      supabaseClient
        .from("b2b_registrations")
        .select("b2b_day_id, number_of_guests")
        .eq("representative_id", userId)
        .neq("registration_status", "cancelled")
        .in("b2b_day_id", dayIds)
    ]);

    if (quotaResult.error) throw quotaResult.error;
    if (registrationResult.error) throw registrationResult.error;

    const totalQuota = (quotaResult.data || []).reduce(
      (sum, row) => sum + Number(row.quota || 0),
      0
    );

    const totalUsed = (registrationResult.data || []).reduce(
      (sum, row) => sum + Number(row.number_of_guests || 0),
      0
    );

    const percentage = totalQuota > 0
      ? Math.min(100, Math.round((totalUsed / totalQuota) * 100))
      : 0;

    occupancyText.textContent = `${percentage}%`;
    occupancyBar.style.width = `${percentage}%`;
  } catch (error) {
    console.error("B2B HOME INZICHTEN FOUT:", error);
    nextText.textContent = "Eerstvolgende B2B-dag niet beschikbaar";
    occupancyText.textContent = "—";
    occupancyBar.style.width = "0%";
  }
}


// =========================================================
// WELKOM
// =========================================================

function setWelcomeName(user) {
  const element = document.getElementById("welcomeName");

  if (!element) return;

  const metadataName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name;

  const emailName = user.email
    ? user.email.split("@")[0]
    : "";

  const name = metadataName || emailName;

  element.textContent = name
    ? `Welkom, ${formatName(name)}`
    : "Welkom";
}


function formatName(value) {
  return String(value)
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}


// =========================================================
// KOMENDE B2B-DAGEN
// Alleen COUNT ophalen.
// =========================================================

async function loadUpcomingDays() {
  const today = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabaseClient
    .from("b2b_days")
    .select("*", {
      count: "exact",
      head: true
    })
    .gte("event_date", today)
    .in("status", ["open", "full"]);

  if (error) {
    console.error("B2B-dagen laden mislukt:", error);
    setCounter("upcomingDaysCount", "—");
    return;
  }

  setCounter("upcomingDaysCount", count ?? 0);
}


// =========================================================
// MIJN INSCHRIJVINGEN
// Alleen COUNT ophalen.
// =========================================================

async function loadMyRegistrations(userId) {
  const { count, error } = await supabaseClient
    .from("b2b_registrations")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("representative_id", userId)
    .neq("registration_status", "cancelled");

  if (error) {
    console.error("Inschrijvingen laden mislukt:", error);
    setCounter("registrationsCount", "—");
    return;
  }

  setCounter("registrationsCount", count ?? 0);
}


// =========================================================
// OPEN COMMERCIËLE FOLLOW-UPS
// Alleen COUNT ophalen.
// =========================================================

async function loadMyFollowups(userId) {
  const { count, error } = await supabaseClient
    .from("b2b_followups")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("representative_id", userId)
    .in("status", [
      "to_follow_up",
      "contacted",
      "interested",
      "trial_or_offer"
    ]);

  if (error) {
    console.error("Follow-ups laden mislukt:", error);
    setCounter("followupsCount", "—");
    return;
  }

  setCounter("followupsCount", count ?? 0);
}


// =========================================================
// HELPERS
// =========================================================

function setCounter(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


function showStatus(message) {
  const element = document.getElementById("b2bStatus");

  if (!element) return;

  element.textContent = message;
  element.hidden = false;
}

// =========================================================
// B2B-DAGEN + QUOTA
// =========================================================

async function initB2BDaysPage() {
  const container =
    document.getElementById("b2bDaysList");

  if (!container) return;

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    const userId = session.user.id;

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    // Alleen komende B2B-dagen ophalen
    const {
      data: days,
      error: daysError
    } =
      await supabaseClient
        .from("b2b_days")
        .select(
          `
          id,
          title,
          event_date,
          start_time,
          end_time,
          location,
          max_capacity,
          status
          `
        )
        .gte("event_date", today)
        .in("status", ["open", "full"])
        .order("event_date", {
          ascending: true
        });

    if (daysError) throw daysError;


    if (!days?.length) {
      container.innerHTML = `
        <div class="status-message">
          Er zijn momenteel geen komende B2B-dagen.
        </div>
      `;

      return;
    }


    const dayIds =
      days.map(day => day.id);


    // Alleen eigen quota ophalen
    const {
      data: quotas,
      error: quotaError
    } =
      await supabaseClient
        .from("b2b_quotas")
        .select(
          "b2b_day_id, quota"
        )
        .eq(
          "representative_id",
          userId
        )
        .in(
          "b2b_day_id",
          dayIds
        );

    if (quotaError) throw quotaError;


    // Alleen eigen actieve inschrijvingen ophalen
    const {
      data: registrations,
      error: registrationError
    } =
      await supabaseClient
        .from("b2b_registrations")
        .select(
          "b2b_day_id, number_of_guests"
        )
        .eq(
          "representative_id",
          userId
        )
        .neq(
          "registration_status",
          "cancelled"
        )
        .in(
          "b2b_day_id",
          dayIds
        );

    if (registrationError) {
      throw registrationError;
    }


    const quotaMap = {};

    (quotas || [])
      .forEach(row => {
        quotaMap[row.b2b_day_id] =
          Number(row.quota || 0);
      });


    const usedMap = {};

    (registrations || [])
      .forEach(row => {

        if (!usedMap[row.b2b_day_id]) {
          usedMap[row.b2b_day_id] = 0;
        }

        usedMap[row.b2b_day_id] +=
          Number(
            row.number_of_guests || 0
          );

      });


    container.innerHTML =
      days
        .map(day => {

          const quota =
            quotaMap[day.id] || 0;

          const used =
            usedMap[day.id] || 0;

          const remaining =
            Math.max(
              0,
              quota - used
            );

          const percentage =
            quota > 0
              ? Math.min(
                  100,
                  Math.round(
                    (used / quota) * 100
                  )
                )
              : 0;

          return `

            <article class="b2b-day-card">

              <div class="b2b-day-top">

                <div>

                  <span class="menu-card-label">
                    ${formatB2BDate(day.event_date)}
                  </span>

                  <strong>
                    ${escapeB2BHtml(day.title)}
                  </strong>

                </div>

                <span class="b2b-day-status">
                  ${day.status === "full" ? "Volzet" : "Open"}
                </span>

              </div>


              <div class="b2b-day-meta">

                ${
                  day.location
                    ? `
                      <span>
                        ${escapeB2BHtml(day.location)}
                      </span>
                    `
                    : ""
                }

                ${
                  day.start_time
                    ? `
                      <span>
                        ${formatB2BTime(day.start_time)}
                        ${
                          day.end_time
                            ? `– ${formatB2BTime(day.end_time)}`
                            : ""
                        }
                      </span>
                    `
                    : ""
                }

              </div>


              <div class="quota-block">

                <div class="quota-head">

                  <span>
                    Jouw plaatsen
                  </span>

                  <strong>
                    ${used} / ${quota}
                  </strong>

                </div>


                <div class="quota-progress">

                  <span
                    style="width:${percentage}%"
                  ></span>

                </div>


                <div class="quota-footer">

                  <span>
                    Gebruikt: ${used}
                  </span>

                  <span>
                    Beschikbaar: ${remaining}
                  </span>

                </div>

              </div>


              <a
                href="./inschrijven.html?day=${encodeURIComponent(day.id)}"
                class="b2b-day-action ${
                  remaining <= 0
                    ? "disabled"
                    : ""
                }"
              >

                ${
                  remaining > 0
                    ? "Klant inschrijven"
                    : "Geen plaatsen beschikbaar"
                }

              </a>

            </article>

          `;

        })
        .join("");

  }

  catch (error) {

    console.error(
      "B2B-dagen laden mislukt:",
      error
    );

    container.innerHTML = `
      <div class="status-message">
        B2B-dagen konden niet worden geladen.
      </div>
    `;

  }
}


// Automatisch uitvoeren als dagen.html open is
document.addEventListener(
  "DOMContentLoaded",
  initB2BDaysPage
);


// =========================================================
// HELPERS B2B-DAGEN
// =========================================================

function formatB2BDate(value) {
  if (!value) return "";

  const date =
    new Date(
      `${value}T00:00:00`
    );

  return date.toLocaleDateString(
    "nl-BE",
    {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}


function formatB2BTime(value) {
  if (!value) return "";

  return String(value).slice(0, 5);
}


function escapeB2BHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// NIEUWE B2B INSCHRIJVING
// =========================================================

let activeB2BDay = null;
let activeB2BQuota = 0;
let activeB2BUsed = 0;
let activeB2BRemaining = 0;

async function initB2BRegistrationPage() {
  const title = document.getElementById("registrationDayTitle");
  if (!title) return;

  try {
    const { data: { session }, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const dayId = params.get("day");

    if (!dayId) {
      showRegistrationStatus("Geen B2B-dag geselecteerd.", true);
      return;
    }

    await loadRegistrationDay(dayId, session.user.id);
  } catch (error) {
    console.error("INSCHRIJFPAGINA FOUT:", error);
    showRegistrationStatus(
      error?.message || "De inschrijfpagina kon niet worden geladen.",
      true
    );
  }
}

async function loadRegistrationDay(dayId, userId) {
  const { data: day, error: dayError } =
    await supabaseClient
      .from("b2b_days")
      .select("id, title, event_date, start_time, end_time, location, status")
      .eq("id", dayId)
      .single();

  if (dayError || !day) {
    throw dayError || new Error("B2B-dag niet gevonden.");
  }

  if (!["open", "full"].includes(day.status)) {
    throw new Error("Deze B2B-dag staat niet open voor inschrijvingen.");
  }

  activeB2BDay = day;

  const { data: quotaRow, error: quotaError } =
    await supabaseClient
      .from("b2b_quotas")
      .select("quota")
      .eq("b2b_day_id", dayId)
      .eq("representative_id", userId)
      .maybeSingle();

  if (quotaError) throw quotaError;

  activeB2BQuota = Number(quotaRow?.quota || 0);

  const { data: registrations, error: registrationsError } =
    await supabaseClient
      .from("b2b_registrations")
      .select("number_of_guests")
      .eq("b2b_day_id", dayId)
      .eq("representative_id", userId)
      .neq("registration_status", "cancelled");

  if (registrationsError) throw registrationsError;

  activeB2BUsed = (registrations || []).reduce(
    (sum, row) => sum + Number(row.number_of_guests || 0),
    0
  );

  activeB2BRemaining = Math.max(0, activeB2BQuota - activeB2BUsed);
  renderRegistrationDay();
}

function renderRegistrationDay() {
  if (!activeB2BDay) return;

  document.getElementById("registrationDayTitle").textContent =
    activeB2BDay.title;

  const metaParts = [];
  if (activeB2BDay.event_date) metaParts.push(formatB2BDate(activeB2BDay.event_date));
  if (activeB2BDay.location) metaParts.push(activeB2BDay.location);
  if (activeB2BDay.start_time) {
    let time = formatB2BTime(activeB2BDay.start_time);
    if (activeB2BDay.end_time) time += " – " + formatB2BTime(activeB2BDay.end_time);
    metaParts.push(time);
  }

  document.getElementById("registrationDayMeta").textContent = metaParts.join(" · ");
  document.getElementById("registrationQuotaText").textContent =
    `${activeB2BRemaining} van ${activeB2BQuota} beschikbaar`;

  const percentage = activeB2BQuota > 0
    ? Math.min(100, Math.round((activeB2BUsed / activeB2BQuota) * 100))
    : 0;

  document.getElementById("registrationQuotaProgress").style.width = `${percentage}%`;
  updateGuestSelector();
}

function changeGuestCount(amount) {
  const input = document.getElementById("guestCount");
  if (!input) return;

  if (activeB2BRemaining <= 0) {
    input.value = 0;
    updateGuestSelector();
    return;
  }

  let value = Number(input.value || 1) + Number(amount || 0);
  value = Math.max(1, Math.min(activeB2BRemaining, value));
  input.value = value;
  updateGuestSelector();
}

function updateGuestSelector() {
  const input = document.getElementById("guestCount");
  const display = document.getElementById("guestCountDisplay");
  if (!input || !display) return;

  let value = Number(input.value || 1);
  if (activeB2BRemaining <= 0) value = 0;
  else value = Math.max(1, Math.min(value, activeB2BRemaining));

  input.value = value;
  display.textContent = value;

  const button = document.getElementById("registrationSubmitButton");
  if (button) button.disabled = activeB2BRemaining <= 0;
}

async function submitB2BRegistration() {
  const button = document.getElementById("registrationSubmitButton");

  try {
    const { data: { session }, error: sessionError } =
      await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    if (!activeB2BDay) {
      showRegistrationStatus("Geen B2B-dag geselecteerd.", true);
      return;
    }

    const companyName = document.getElementById("companyName").value.trim();
    const contactName = document.getElementById("contactName").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const notes = document.getElementById("registrationNotes").value.trim();
    const numberOfGuests = Number(document.getElementById("guestCount").value || 0);

    if (!companyName) {
      showRegistrationStatus("Vul de bedrijfsnaam of horecazaak in.", true);
      return;
    }

    await loadRegistrationDay(activeB2BDay.id, session.user.id);

    if (numberOfGuests <= 0 || numberOfGuests > activeB2BRemaining) {
      showRegistrationStatus("Het gekozen aantal gasten past niet binnen je beschikbare quota.", true);
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Inschrijving opslaan...";
    }

    const { error } = await supabaseClient
      .from("b2b_registrations")
      .insert({
        b2b_day_id: activeB2BDay.id,
        representative_id: session.user.id,
        company_name: companyName,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        number_of_guests: numberOfGuests,
        notes: notes || null,
        registration_status: "registered",
        attendance_status: "unknown"
      });

    if (error) throw error;

    showRegistrationStatus("✓ Klant succesvol ingeschreven.", false);
    document.getElementById("companyName").value = "";
    document.getElementById("contactName").value = "";
    document.getElementById("customerEmail").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("registrationNotes").value = "";
    document.getElementById("guestCount").value = "1";

    await loadRegistrationDay(activeB2BDay.id, session.user.id);
  } catch (error) {
    console.error("B2B INSCHRIJVING FOUT:", error);
    showRegistrationStatus(error?.message || "De inschrijving kon niet worden opgeslagen.", true);
  } finally {
    if (button) {
      button.disabled = activeB2BRemaining <= 0;
      button.textContent = "Klant inschrijven";
    }
  }
}

function showRegistrationStatus(message, isError) {
  const element = document.getElementById("registrationStatus");
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  element.style.borderColor = isError ? "rgba(190,83,83,.40)" : "rgba(91,170,116,.35)";
  element.style.color = isError ? "#eba3a3" : "#9bd9ae";
}

document.addEventListener("DOMContentLoaded", initB2BRegistrationPage);


// =========================================================
// B2B INSCHRIJVING BEWERKEN
// =========================================================

let editRegistration = null;
let editQuota = 0;
let editUsedByOthers = 0;
let editMaxGuests = 0;


// =========================================================
// INIT
// =========================================================

async function initEditB2BRegistration() {

  const title =
    document.getElementById(
      "editRegistrationTitle"
    );


  if (!title) {
    return;
  }


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {

      window.location.href =
        "../index.html";

      return;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const registrationId =
      params.get("id");


    if (!registrationId) {

      showEditRegistrationStatus(
        "Geen inschrijving geselecteerd.",
        true
      );

      return;
    }


    await loadEditRegistration(
      registrationId,
      session.user.id
    );

  }

  catch (error) {

    console.error(
      "B2B BEWERKEN LADEN FOUT:",
      error
    );


    showEditRegistrationStatus(
      "De inschrijving kon niet worden geladen.",
      true
    );

  }

}


// =========================================================
// INSCHRIJVING LADEN
// =========================================================

async function loadEditRegistration(
  registrationId,
  userId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("b2b_registrations")
      .select(`
        id,
        b2b_day_id,
        representative_id,
        company_name,
        contact_name,
        email,
        phone,
        number_of_guests,
        notes,
        registration_status,
        b2b_days (
          id,
          title,
          event_date,
          location,
          start_time,
          end_time
        )
      `)
      .eq(
        "id",
        registrationId
      )
      .eq(
        "representative_id",
        userId
      )
      .single();


  if (
    error ||
    !data
  ) {

    throw error ||
      new Error(
        "Inschrijving niet gevonden."
      );

  }


  if (
    data.registration_status ===
    "cancelled"
  ) {

    throw new Error(
      "Deze inschrijving is geannuleerd."
    );

  }


  editRegistration =
    data;


  await loadEditQuota(
    data.b2b_day_id,
    data.id,
    userId
  );


  renderEditRegistration();

}


// =========================================================
// QUOTA OPNIEUW BEREKENEN
// =========================================================

async function loadEditQuota(
  dayId,
  currentRegistrationId,
  userId
) {

  const {
    data: quotaRow,
    error: quotaError
  } =
    await supabaseClient
      .from("b2b_quotas")
      .select("quota")
      .eq(
        "b2b_day_id",
        dayId
      )
      .eq(
        "representative_id",
        userId
      )
      .maybeSingle();


  if (quotaError) {
    throw quotaError;
  }


  editQuota =
    Number(
      quotaRow?.quota || 0
    );


  const {
    data: registrations,
    error: registrationsError
  } =
    await supabaseClient
      .from("b2b_registrations")
      .select(
        "id, number_of_guests"
      )
      .eq(
        "b2b_day_id",
        dayId
      )
      .eq(
        "representative_id",
        userId
      )
      .neq(
        "registration_status",
        "cancelled"
      );


  if (registrationsError) {
    throw registrationsError;
  }


  editUsedByOthers =
    (registrations || [])
      .filter(
        row =>
          String(row.id) !==
          String(currentRegistrationId)
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.number_of_guests || 0
          ),
        0
      );


  editMaxGuests =
    Math.max(
      0,
      editQuota -
      editUsedByOthers
    );

}


// =========================================================
// RENDER
// =========================================================

function renderEditRegistration() {

  if (!editRegistration) {
    return;
  }


  const day =
    editRegistration.b2b_days ||
    {};


  document
    .getElementById(
      "editRegistrationTitle"
    )
    .textContent =
      editRegistration.company_name;


  const dayMeta = [];


  if (day.title) {
    dayMeta.push(day.title);
  }


  if (day.event_date) {
    dayMeta.push(
      formatB2BDate(
        day.event_date
      )
    );
  }


  if (day.location) {
    dayMeta.push(
      day.location
    );
  }


  document
    .getElementById(
      "editRegistrationDay"
    )
    .textContent =
      dayMeta.join(" · ");


  document
    .getElementById(
      "editCompanyName"
    )
    .value =
      editRegistration.company_name ||
      "";


  document
    .getElementById(
      "editContactName"
    )
    .value =
      editRegistration.contact_name ||
      "";


  document
    .getElementById(
      "editCustomerEmail"
    )
    .value =
      editRegistration.email ||
      "";


  document
    .getElementById(
      "editCustomerPhone"
    )
    .value =
      editRegistration.phone ||
      "";


  document
    .getElementById(
      "editRegistrationNotes"
    )
    .value =
      editRegistration.notes ||
      "";


  document
    .getElementById(
      "editGuestCount"
    )
    .value =
      Number(
        editRegistration.number_of_guests ||
        1
      );


  document
    .getElementById(
      "editQuotaText"
    )
    .textContent =
      `${editMaxGuests} maximaal voor deze inschrijving`;


  const usedIncludingCurrent =
    editUsedByOthers +
    Number(
      editRegistration.number_of_guests ||
      0
    );


  const percentage =
    editQuota > 0

      ? Math.min(
          100,
          Math.round(
            (
              usedIncludingCurrent /
              editQuota
            )
            *
            100
          )
        )

      : 0;


  document
    .getElementById(
      "editQuotaProgress"
    )
    .style.width =
      `${percentage}%`;


  updateEditGuestSelector();

}


// =========================================================
// AANTAL GASTEN
// =========================================================

function changeEditGuestCount(
  amount
) {

  const input =
    document.getElementById(
      "editGuestCount"
    );


  if (!input) {
    return;
  }


  if (
    editMaxGuests <= 0
  ) {

    input.value = 0;

    updateEditGuestSelector();

    return;

  }


  let value =
    Number(
      input.value || 1
    );


  value =
    value + amount;


  value =
    Math.max(
      1,
      value
    );


  value =
    Math.min(
      editMaxGuests,
      value
    );


  input.value =
    value;


  updateEditGuestSelector();

}


function updateEditGuestSelector() {

  const input =
    document.getElementById(
      "editGuestCount"
    );


  const display =
    document.getElementById(
      "editGuestCountDisplay"
    );


  if (
    !input ||
    !display
  ) {

    return;

  }


  let value =
    Number(
      input.value || 1
    );


  if (
    editMaxGuests > 0
  ) {

    value =
      Math.min(
        value,
        editMaxGuests
      );

  }


  value =
    Math.max(
      1,
      value
    );


  input.value =
    value;


  display.textContent =
    value;

}


// =========================================================
// OPSLAAN
// =========================================================

async function saveB2BRegistrationChanges() {

  if (!editRegistration) {
    return;
  }


  const button =
    document.getElementById(
      "editRegistrationSaveButton"
    );


  try {

    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();


    if (!session?.user) {
      return;
    }


    const companyName =
      document
        .getElementById(
          "editCompanyName"
        )
        .value
        .trim();


    const contactName =
      document
        .getElementById(
          "editContactName"
        )
        .value
        .trim();


    const email =
      document
        .getElementById(
          "editCustomerEmail"
        )
        .value
        .trim();


    const phone =
      document
        .getElementById(
          "editCustomerPhone"
        )
        .value
        .trim();


    const notes =
      document
        .getElementById(
          "editRegistrationNotes"
        )
        .value
        .trim();


    const guests =
      Number(
        document
          .getElementById(
            "editGuestCount"
          )
          .value ||
        1
      );


    if (!companyName) {

      showEditRegistrationStatus(
        "Vul de bedrijfsnaam in.",
        true
      );

      return;

    }


    // Opnieuw quota controleren vlak voor update
    await loadEditQuota(
      editRegistration.b2b_day_id,
      editRegistration.id,
      session.user.id
    );


    if (
      guests >
      editMaxGuests
    ) {

      showEditRegistrationStatus(
        "Dit aantal overschrijdt je beschikbare quota.",
        true
      );

      return;

    }


    button.disabled =
      true;


    button.textContent =
      "Wijzigingen opslaan...";


    const {
      error
    } =
      await supabaseClient
        .from("b2b_registrations")
        .update({

          company_name:
            companyName,

          contact_name:
            contactName || null,

          email:
            email || null,

          phone:
            phone || null,

          number_of_guests:
            guests,

          notes:
            notes || null,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          editRegistration.id
        )
        .eq(
          "representative_id",
          session.user.id
        );


    if (error) {
      throw error;
    }


    showEditRegistrationStatus(
      "✓ Wijzigingen opgeslagen.",
      false
    );


    setTimeout(
      () => {

        window.location.href =
          "./mijn-inschrijvingen.html";

      },
      600
    );

  }

  catch (error) {

    console.error(
      "B2B WIJZIGEN FOUT:",
      error
    );


    showEditRegistrationStatus(
      error?.message ||
      "Wijzigingen konden niet worden opgeslagen.",
      true
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Wijzigingen opslaan";

    }

  }

}


// =========================================================
// STATUS
// =========================================================

function showEditRegistrationStatus(
  message,
  isError
) {

  const element =
    document.getElementById(
      "editRegistrationStatus"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.hidden =
    false;


  element.style.color =
    isError
      ? "#eba3a3"
      : "#9bd9ae";

}


// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initEditB2BRegistration
);

// =========================================================
// MIJN INSCHRIJVINGEN OVERZICHT
// =========================================================

async function initB2BMyRegistrationsPage() {
  const container = document.getElementById("myB2BRegistrations");
  if (!container) return;

  try {
    const { data: { session }, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    const { data: registrations, error: registrationsError } =
      await supabaseClient
        .from("b2b_registrations")
        .select(`
          id,
          company_name,
          contact_name,
          email,
          phone,
          number_of_guests,
          notes,
          registration_status,
          attendance_status,
          created_at,
          b2b_days (
            title,
            event_date,
            start_time,
            end_time,
            location
          )
        `)
        .eq("representative_id", session.user.id)
        .order("created_at", { ascending: false });

    if (registrationsError) throw registrationsError;

    renderMyB2BRegistrations(registrations || []);
  } catch (error) {
    console.error("MIJN B2B INSCHRIJVINGEN FOUT:", error);

    container.innerHTML = `
      <div class="status-message">
        Inschrijvingen konden niet worden geladen.
      </div>
    `;

    showMyRegistrationsStatus(
      error?.message || "Probeer de pagina opnieuw te openen.",
      true
    );
  }
}

function renderMyB2BRegistrations(registrations) {
  const container = document.getElementById("myB2BRegistrations");
  if (!container) return;

  if (!registrations.length) {
    container.innerHTML = `
      <div class="status-message">
        Je hebt nog geen B2B-inschrijvingen.
      </div>
    `;
    return;
  }

  container.innerHTML = registrations
    .map(registration => {
      const day = registration.b2b_days || {};
      const cancelled = registration.registration_status === "cancelled";
      const meta = [];

      if (day.title) meta.push(day.title);
      if (day.event_date) meta.push(formatB2BDate(day.event_date));
      if (day.location) meta.push(day.location);

      const contactLines = [];
      if (registration.contact_name) contactLines.push(registration.contact_name);
      if (registration.email) contactLines.push(registration.email);
      if (registration.phone) contactLines.push(registration.phone);

      return `
        <article class="b2b-registration-card ${cancelled ? "b2b-registration-cancelled" : ""}">
          <div class="b2b-registration-top">
            <div>
              <span class="menu-card-label">
                ${cancelled ? "Geannuleerd" : "Ingeschreven"}
              </span>
              <strong>${escapeB2BHtml(registration.company_name)}</strong>
            </div>

            <span class="b2b-registration-count">
              ${Number(registration.number_of_guests || 0)} pers.
            </span>
          </div>

          <div class="b2b-registration-meta">
            ${escapeB2BHtml(meta.join(" · "))}
          </div>

          ${
            contactLines.length || registration.notes
              ? `
                <div class="b2b-registration-details">
                  ${
                    contactLines.length
                      ? `<div>${escapeB2BHtml(contactLines.join(" · "))}</div>`
                      : ""
                  }
                  ${
                    registration.notes
                      ? `<div><strong>Opmerking:</strong> ${escapeB2BHtml(registration.notes)}</div>`
                      : ""
                  }
                </div>
              `
              : ""
          }

          ${
            cancelled
              ? ""
              : `
                <div class="b2b-registration-details">
                  <strong>Aanwezigheid</strong>

                  <div class="b2b-registration-actions">
                    <button
                      type="button"
                      class="b2b-small-action edit"
                      data-attendance-choice="present"
                      onclick="setMyB2BAttendance('${registration.id}', 'present', this)"
                    >
                      ${
                        registration.attendance_status === "present"
                          ? "✓ Aanwezig"
                          : "Aanwezig"
                      }
                    </button>

                    <button
                      type="button"
                      class="b2b-small-action cancel"
                      data-attendance-choice="absent"
                      onclick="setMyB2BAttendance('${registration.id}', 'absent', this)"
                    >
                      ${
                        registration.attendance_status === "absent"
                          ? "✓ Afwezig"
                          : "Afwezig"
                      }
                    </button>
                  </div>
                </div>

                <div class="b2b-registration-actions">
                  <button
                    type="button"
                    class="b2b-small-action edit"
                    onclick="openB2BRegistrationEdit('${registration.id}')"
                  >
                    Wijzigen
                  </button>

                  <button
                    type="button"
                    class="b2b-small-action cancel"
                    onclick="cancelB2BRegistration('${registration.id}')"
                  >
                    Annuleren
                  </button>
                </div>
              `
          }
        </article>
      `;
    })
    .join("");
}

async function setMyB2BAttendance(
  registrationId,
  attendanceStatus,
  button
) {

  if (
    !["present", "absent"].includes(
      attendanceStatus
    )
  ) {
    return;
  }


  const card =
    button?.closest(
      ".b2b-registration-card"
    );


  const buttons =
    card
      ? [
          ...card.querySelectorAll(
            "[data-attendance-choice]"
          )
        ]
      : [];


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {

      window.location.href =
        "../index.html";

      return;

    }


    buttons.forEach(
      item => {
        item.disabled = true;
      }
    );


    const {
      error
    } =
      await supabaseClient
        .from("b2b_registrations")
        .update({
          attendance_status:
            attendanceStatus,

          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          registrationId
        )
        .eq(
          "representative_id",
          session.user.id
        );


    if (error) {
      throw error;
    }


    buttons.forEach(
      item => {

        const choice =
          item.dataset.attendanceChoice;


        if (
          choice === "present"
        ) {

          item.textContent =
            attendanceStatus === "present"
              ? "✓ Aanwezig"
              : "Aanwezig";

        }


        if (
          choice === "absent"
        ) {

          item.textContent =
            attendanceStatus === "absent"
              ? "✓ Afwezig"
              : "Afwezig";

        }

      }
    );


    showMyRegistrationsStatus(
      attendanceStatus === "present"
        ? "✓ Aanwezigheid opgeslagen."
        : "✓ Afwezigheid opgeslagen.",
      false
    );

  }

  catch (error) {

    console.error(
      "B2B AANWEZIGHEID OPSLAAN FOUT:",
      error
    );


    showMyRegistrationsStatus(
      error?.message ||
      "Aanwezigheid kon niet worden opgeslagen.",
      true
    );

  }

  finally {

    buttons.forEach(
      item => {
        item.disabled = false;
      }
    );

  }

}

function openB2BRegistrationEdit(registrationId) {
  window.location.href =
    `./inschrijving-bewerken.html?id=${encodeURIComponent(registrationId)}`;
}

async function cancelB2BRegistration(registrationId) {
  const confirmed = window.confirm(
    "Deze inschrijving annuleren? De gebruikte plaatsen komen opnieuw vrij."
  );

  if (!confirmed) return;

  try {
    const { data: { session }, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    const { error } = await supabaseClient
      .from("b2b_registrations")
      .update({
        registration_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", registrationId)
      .eq("representative_id", session.user.id);

    if (error) throw error;

    showMyRegistrationsStatus("✓ Inschrijving geannuleerd.", false);
    await initB2BMyRegistrationsPage();
  } catch (error) {
    console.error("B2B INSCHRIJVING ANNULEREN FOUT:", error);
    showMyRegistrationsStatus(
      error?.message || "De inschrijving kon niet worden geannuleerd.",
      true
    );
  }
}

function showMyRegistrationsStatus(message, isError) {
  const element = document.getElementById("myRegistrationsStatus");
  if (!element) return;

  element.textContent = message;
  element.hidden = false;
  element.style.color = isError ? "#eba3a3" : "#9bd9ae";
}

document.addEventListener(
  "DOMContentLoaded",
  initB2BMyRegistrationsPage
);

// =========================================================
// COMMERCIËLE OPVOLGING OVERZICHT
// =========================================================

async function initB2BFollowupOverviewPage() {
  const container = document.getElementById("followupList");
  if (!container) return;

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      window.location.href = "../index.html";
      return;
    }

    const userId = session.user.id;

    const {
      data: registrations,
      error: registrationsError
    } = await supabaseClient
      .from("b2b_registrations")
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        number_of_guests,
        registration_status,
        attendance_status,
        created_at,
        b2b_days (
          title,
          event_date
        )
      `)
      .eq("representative_id", userId)
      .neq("registration_status", "cancelled")
      .order("created_at", { ascending: false });

    if (registrationsError) throw registrationsError;

    const {
      data: followups,
      error: followupsError
    } = await supabaseClient
      .from("b2b_followups")
      .select(`
        id,
        registration_id,
        status,
        interested_products,
        commercial_note,
        next_action,
        followup_date
      `)
      .eq("representative_id", userId);

    if (followupsError) throw followupsError;

    const followupMap = {};
    (followups || []).forEach(row => {
      followupMap[row.registration_id] = row;
    });

    renderB2BFollowupOverview(registrations || [], followupMap);
  } catch (error) {
    console.error("COMMERCIËLE OPVOLGING OVERZICHT FOUT:", error);

    container.innerHTML = `
      <div class="status-message">
        Commerciële opvolging kon niet worden geladen.
      </div>
    `;

    setCounter("followupTodoCount", "—");
    setCounter("followupInterestedCount", "—");
    setCounter("followupCustomerCount", "—");
  }
}

function renderB2BFollowupOverview(registrations, followupMap) {
  const container = document.getElementById("followupList");
  if (!container) return;

  let todo = 0;
  let interested = 0;
  let customer = 0;

  registrations.forEach(registration => {
    const status =
      followupMap[registration.id]?.status ||
      "to_follow_up";

    if (
      status === "to_follow_up" ||
      status === "contacted"
    ) {
      todo += 1;
    }

    if (
      status === "interested" ||
      status === "trial_or_offer"
    ) {
      interested += 1;
    }

    if (status === "customer") {
      customer += 1;
    }
  });

  setCounter("followupTodoCount", todo);
  setCounter("followupInterestedCount", interested);
  setCounter("followupCustomerCount", customer);

  if (!registrations.length) {
    container.innerHTML = `
      <div class="status-message">
        Je hebt nog geen klanten om commercieel op te volgen.
      </div>
    `;
    return;
  }

  container.innerHTML = registrations
    .map(registration => {
      const followup = followupMap[registration.id] || null;
      const status = followup?.status || "to_follow_up";
      const day = registration.b2b_days || {};

      const meta = [];

      if (registration.contact_name) {
        meta.push(registration.contact_name);
      }

      if (day.title) {
        meta.push(day.title);
      }

      if (day.event_date) {
        meta.push(formatB2BDate(day.event_date));
      }

      if (registration.number_of_guests) {
        meta.push(
          `${Number(registration.number_of_guests)} ${
            Number(registration.number_of_guests) === 1
              ? "persoon"
              : "personen"
          }`
        );
      }

      return `
        <article class="b2b-followup-card">

          <div class="b2b-day-top">

            <div>
              <span class="menu-card-label">
                ${escapeB2BHtml(formatB2BFollowupStatus(status))}
              </span>

              <strong>
                ${escapeB2BHtml(registration.company_name)}
              </strong>
            </div>

          </div>

          <div class="b2b-day-meta">
            <span>
              ${escapeB2BHtml(meta.join(" · "))}
            </span>
          </div>

          ${
            followup?.next_action
              ? `
                <div class="b2b-day-meta">
                  <span>
                    Volgende actie: ${escapeB2BHtml(followup.next_action)}
                  </span>
                </div>
              `
              : ""
          }

          ${
            followup?.followup_date
              ? `
                <div class="b2b-day-meta">
                  <span>
                    Opvolgen op: ${escapeB2BHtml(formatB2BDate(followup.followup_date))}
                  </span>
                </div>
              `
              : ""
          }

          <div class="b2b-registration-actions">
            <button
              type="button"
              class="b2b-small-action edit"
              onclick="openB2BFollowup('${registration.id}')"
            >
              Commercieel opvolgen
            </button>
          </div>

        </article>
      `;
    })
    .join("");
}

function formatB2BFollowupStatus(status) {
  return (
    {
      to_follow_up: "Te contacteren",
      contacted: "Gecontacteerd",
      interested: "Interesse",
      trial_or_offer: "Proef / voorstel",
      customer: "Klant geworden",
      not_interested: "Geen interesse"
    }[status] ||
    status ||
    "Te contacteren"
  );
}

function openB2BFollowup(registrationId) {
  window.location.href =
    `./opvolging-bewerken.html?id=${encodeURIComponent(registrationId)}`;
}

document.addEventListener(
  "DOMContentLoaded",
  initB2BFollowupOverviewPage
);

// =========================================================
// FOLLOW-UP BEWERKEN
// =========================================================

let followupEditRegistration = null;


// =========================================================
// INIT
// =========================================================

async function initB2BFollowupEditPage() {

  const company =
    document.getElementById(
      "followupEditCompany"
    );


  if (!company) {
    return;
  }


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {

      window.location.href =
        "../index.html";

      return;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const registrationId =
      params.get("id");


    if (!registrationId) {

      showFollowupEditMessage(
        "Geen klant geselecteerd.",
        true
      );

      return;
    }


    await loadB2BFollowupEditData(
      registrationId,
      session.user.id
    );

  }

  catch (error) {

    console.error(
      "FOLLOW-UP LADEN FOUT:",
      error
    );


    showFollowupEditMessage(
      "De commerciële fiche kon niet worden geladen.",
      true
    );

  }

}


// =========================================================
// DATA LADEN
// =========================================================

async function loadB2BFollowupEditData(
  registrationId,
  userId
) {

  const {
    data: registration,
    error: registrationError
  } =
    await supabaseClient
      .from("b2b_registrations")
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        representative_id,
        b2b_days (
          title,
          event_date
        )
      `)
      .eq(
        "id",
        registrationId
      )
      .eq(
        "representative_id",
        userId
      )
      .single();


  if (
    registrationError ||
    !registration
  ) {

    throw registrationError ||
      new Error(
        "Klant niet gevonden."
      );

  }


  followupEditRegistration =
    registration;


  const {
    data: followup,
    error: followupError
  } =
    await supabaseClient
      .from("b2b_followups")
      .select(`
        id,
        status,
        interested_products,
        commercial_note,
        next_action,
        followup_date
      `)
      .eq(
        "registration_id",
        registrationId
      )
      .eq(
        "representative_id",
        userId
      )
      .maybeSingle();


  if (followupError) {
    throw followupError;
  }


  renderB2BFollowupEdit(
    registration,
    followup
  );

}


// =========================================================
// RENDER
// =========================================================

function renderB2BFollowupEdit(
  registration,
  followup
) {

  document
    .getElementById(
      "followupEditCompany"
    )
    .textContent =
      registration.company_name;


  const meta = [];


  if (
    registration.contact_name
  ) {

    meta.push(
      registration.contact_name
    );

  }


  const day =
    registration.b2b_days ||
    {};


  if (day.title) {
    meta.push(day.title);
  }


  if (day.event_date) {

    meta.push(
      formatB2BDate(
        day.event_date
      )
    );

  }


  document
    .getElementById(
      "followupEditMeta"
    )
    .textContent =
      meta.join(" · ");


  document
    .getElementById(
      "followupEditStatus"
    )
    .value =
      followup?.status ||
      "to_follow_up";


  document
    .getElementById(
      "followupEditProducts"
    )
    .value =
      followup?.interested_products ||
      "";


  document
    .getElementById(
      "followupEditNote"
    )
    .value =
      followup?.commercial_note ||
      "";


  document
    .getElementById(
      "followupEditNextAction"
    )
    .value =
      followup?.next_action ||
      "";


  document
    .getElementById(
      "followupEditDate"
    )
    .value =
      followup?.followup_date ||
      "";


  syncB2BFollowupStatusButtons();
  syncB2BFollowupProductChips();

}


// =========================================================
// FOLLOW-UP UI HELPERS
// =========================================================

function selectB2BFollowupStatus(status) {
  const select = document.getElementById("followupEditStatus");
  if (!select) return;

  select.value = status;
  syncB2BFollowupStatusButtons();
}

function syncB2BFollowupStatusButtons() {
  const select = document.getElementById("followupEditStatus");
  if (!select) return;

  document.querySelectorAll("[data-followup-status]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.followupStatus === select.value
    );
  });
}

function toggleB2BFollowupProduct(product) {
  const input = document.getElementById("followupEditProducts");
  if (!input) return;

  const current = String(input.value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  const normalized = product.toLowerCase();
  const exists = current.some(item => item.toLowerCase() === normalized);

  const next = exists
    ? current.filter(item => item.toLowerCase() !== normalized)
    : [...current, product];

  input.value = next.join(", ");
  syncB2BFollowupProductChips();
}

function syncB2BFollowupProductChips() {
  const input = document.getElementById("followupEditProducts");
  if (!input) return;

  const selected = String(input.value || "")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  document.querySelectorAll("[data-followup-product]").forEach(button => {
    button.classList.toggle(
      "active",
      selected.includes(
        String(button.dataset.followupProduct || "").toLowerCase()
      )
    );
  });
}

// =========================================================
// OPSLAAN / UPSERT
// =========================================================

async function saveB2BFollowup() {

  if (!followupEditRegistration) {
    return;
  }


  const button =
    document.getElementById(
      "followupEditSaveButton"
    );


  try {

    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();


    if (!session?.user) {
      return;
    }


    const status =
      document
        .getElementById(
          "followupEditStatus"
        )
        .value;


    const products =
      document
        .getElementById(
          "followupEditProducts"
        )
        .value
        .trim();


    const note =
      document
        .getElementById(
          "followupEditNote"
        )
        .value
        .trim();


    const nextAction =
      document
        .getElementById(
          "followupEditNextAction"
        )
        .value
        .trim();


    const followupDate =
      document
        .getElementById(
          "followupEditDate"
        )
        .value;


    button.disabled =
      true;


    button.textContent =
      "Opvolging opslaan...";


    const {
      error
    } =
      await supabaseClient
        .from("b2b_followups")
        .upsert(
          {

            registration_id:
              followupEditRegistration.id,

            representative_id:
              session.user.id,

            status:
              status,

            interested_products:
              products || null,

            commercial_note:
              note || null,

            next_action:
              nextAction || null,

            followup_date:
              followupDate || null,

            updated_at:
              new Date().toISOString()

          },
          {
            onConflict:
              "registration_id"
          }
        );


    if (error) {
      throw error;
    }


    showFollowupEditMessage(
      "✓ Commerciële opvolging opgeslagen.",
      false
    );


    setTimeout(
      () => {

        window.location.href =
          "./opvolging.html";

      },
      600
    );

  }

  catch (error) {

    console.error(
      "FOLLOW-UP OPSLAAN FOUT:",
      error
    );


    showFollowupEditMessage(
      error?.message ||
      "De opvolging kon niet worden opgeslagen.",
      true
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Opvolging opslaan";

    }

  }

}


// =========================================================
// MELDING
// =========================================================

function showFollowupEditMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "followupEditMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.hidden =
    false;


  element.style.color =
    isError
      ? "#eba3a3"
      : "#9bd9ae";

}


// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initB2BFollowupEditPage
);

// =========================================================
// B2B ADMIN
// =========================================================

const b2bAdminRegistrationExportData = {};

async function initB2BAdminPage() {

  const container =
    document.getElementById(
      "adminB2BDaysList"
    );


  if (!container) {
    return;
  }


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {

      window.location.href =
        "../index.html";

      return;
    }


    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, naam, rol, actief"
        )
        .eq(
          "id",
          session.user.id
        )
        .single();


    if (
      profileError ||
      !profile
    ) {

      throw profileError ||
        new Error(
          "Profiel niet gevonden."
        );

    }


    const canManage =
      profile.actief === true
      &&
      (
        profile.rol === "admin"
        ||
        profile.rol === "verantwoordelijke"
      );


    if (!canManage) {

      window.location.href =
        "./index.html";

      return;
    }


    await loadAdminB2BDays();

  }

  catch (error) {

    console.error(
      "B2B ADMIN FOUT:",
      error
    );


    container.innerHTML = `
      <div class="status-message">
        B2B-beheer kon niet worden geladen.
      </div>
    `;

  }

}


// =========================================================
// B2B-DAG AANMAKEN
// =========================================================

async function createB2BDay() {

  const button =
    document.getElementById(
      "adminCreateDayButton"
    );


  try {

    const title =
      document
        .getElementById(
          "adminDayTitle"
        )
        .value
        .trim();


    const eventDate =
      document
        .getElementById(
          "adminDayDate"
        )
        .value;


    const startTime =
      document
        .getElementById(
          "adminStartTime"
        )
        .value;


    const endTime =
      document
        .getElementById(
          "adminEndTime"
        )
        .value;


    const location =
      document
        .getElementById(
          "adminLocation"
        )
        .value
        .trim();


    const capacity =
      Number(
        document
          .getElementById(
            "adminCapacity"
          )
          .value ||
        0
      );


    const status =
      document
        .getElementById(
          "adminDayStatus"
        )
        .value;


    const description =
      document
        .getElementById(
          "adminDescription"
        )
        .value
        .trim();


    if (!title) {

      showAdminCreateDayMessage(
        "Vul een naam in.",
        true
      );

      return;
    }


    if (!eventDate) {

      showAdminCreateDayMessage(
        "Kies een datum.",
        true
      );

      return;
    }


    if (
      capacity < 0
    ) {

      showAdminCreateDayMessage(
        "De capaciteit kan niet negatief zijn.",
        true
      );

      return;
    }


    button.disabled =
      true;


    button.textContent =
      "B2B-dag opslaan...";


    const {
      error
    } =
      await supabaseClient
        .from("b2b_days")
        .insert({

          title:
            title,

          event_date:
            eventDate,

          start_time:
            startTime || null,

          end_time:
            endTime || null,

          location:
            location || null,

          description:
            description || null,

          max_capacity:
            capacity,

          status:
            status

        });


    if (error) {
      throw error;
    }


    showAdminCreateDayMessage(
      "✓ B2B-dag aangemaakt.",
      false
    );


    resetB2BDayAdminForm();


    await loadAdminB2BDays();

  }

  catch (error) {

    console.error(
      "B2B-DAG AANMAKEN FOUT:",
      error
    );


    showAdminCreateDayMessage(
      error?.message ||
      "B2B-dag kon niet worden aangemaakt.",
      true
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "B2B-dag aanmaken";

    }

  }

}


// =========================================================
// ADMIN DAGEN LADEN
// =========================================================

async function loadAdminB2BDays() {

  const container =
    document.getElementById(
      "adminB2BDaysList"
    );


  if (!container) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("b2b_days")
      .select(`
        id,
        title,
        event_date,
        start_time,
        end_time,
        location,
        max_capacity,
        status
      `)
      .order(
        "event_date",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  const days =
    data || [];


  if (!days.length) {

    container.innerHTML = `
      <div class="status-message">
        Nog geen B2B-dagen aangemaakt.
      </div>
    `;

    return;
  }


  container.innerHTML =
    days
      .map(
        day => `

          <article
            class="b2b-day-card"
            data-admin-day-id="${day.id}"
            data-admin-day-title="${escapeB2BHtml(day.title)}"
            data-admin-day-date="${escapeB2BHtml(day.event_date || "")}"
            data-admin-day-location="${escapeB2BHtml(day.location || "")}"
          >

            <div class="b2b-day-top">

              <div>

                <span class="menu-card-label">
                  ${formatB2BDate(
                    day.event_date
                  )}
                </span>

                <strong>
                  ${escapeB2BHtml(
                    day.title
                  )}
                </strong>

              </div>


              <span class="b2b-day-status">

                ${formatAdminDayStatus(
                  day.status
                )}

              </span>

            </div>


            <div class="b2b-day-meta">

              ${
                day.location

                  ? `
                    <span>
                      ${escapeB2BHtml(
                        day.location
                      )}
                    </span>
                  `

                  : ""
              }


              <span>
                Capaciteit:
                ${Number(
                  day.max_capacity || 0
                )}
              </span>

            </div>


            <div class="b2b-registration-actions admin-day-actions">

              <button
                type="button"
                class="b2b-small-action edit"
                onclick="toggleB2BAdminRegistrations('${day.id}')"
              >
                Inschrijvingen
              </button>

              <button
                type="button"
                class="b2b-small-action edit"
                onclick="openB2BQuotaAdmin('${day.id}')"
              >
                Quota beheren
              </button>


              <button
                type="button"
                class="b2b-small-action edit"
                onclick="openB2BDayEdit('${day.id}')"
              >
                Dag wijzigen
              </button>

            </div>

            <div
              id="adminRegistrations-${day.id}"
              class="admin-registrations-panel"
              hidden
            ></div>

          </article>

        `
      )
      .join("");

}


// =========================================================
// ADMIN HELPERS
// =========================================================

function resetB2BDayAdminForm() {

  [
    "adminDayTitle",
    "adminDayDate",
    "adminStartTime",
    "adminEndTime",
    "adminLocation",
    "adminDescription"
  ]
    .forEach(
      id => {

        const element =
          document.getElementById(id);

        if (element) {
          element.value = "";
        }

      }
    );


  document
    .getElementById(
      "adminCapacity"
    )
    .value = "0";


  document
    .getElementById(
      "adminDayStatus"
    )
   .value = "open";

}


function formatAdminDayStatus(
  status
) {

  return (

    {
      draft:
        "Concept",

      open:
        "Open",

      full:
        "Volzet",

      closed:
        "Afgesloten",

      cancelled:
        "Geannuleerd"

    }[
      status
    ]

    ||

    status

  );

}


function showAdminCreateDayMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "adminCreateDayMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.hidden =
    false;


  element.style.color =
    isError
      ? "#eba3a3"
      : "#9bd9ae";

}



async function toggleB2BAdminRegistrations(dayId) {

  const panel =
    document.getElementById(
      `adminRegistrations-${dayId}`
    );


  if (!panel) {
    return;
  }


  if (!panel.hidden) {

    panel.hidden =
      true;

    return;
  }


  panel.hidden =
    false;


  if (
    panel.dataset.loaded ===
    "true"
  ) {

    return;

  }


  panel.innerHTML = `
    <div class="status-message">
      Inschrijvingen laden...
    </div>
  `;


  try {

    const {
      data: registrations,
      error: registrationsError
    } =
      await supabaseClient
        .from("b2b_registrations")
        .select(`
          id,
          representative_id,
          company_name,
          contact_name,
          email,
          phone,
          number_of_guests,
          notes,
          registration_status,
          attendance_status,
          created_at
        `)
        .eq(
          "b2b_day_id",
          dayId
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (registrationsError) {
      throw registrationsError;
    }


    const rows =
      registrations || [];


    const representativeIds =
      [
        ...new Set(
          rows
            .map(
              row =>
                row.representative_id
            )
            .filter(Boolean)
        )
      ];


    let profileMap =
      {};


    if (
      representativeIds.length
    ) {

      const {
        data: profiles,
        error: profilesError
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id, naam, email"
          )
          .in(
            "id",
            representativeIds
          );


      if (profilesError) {
        throw profilesError;
      }


      (profiles || [])
        .forEach(
          profile => {

            profileMap[
              profile.id
            ] =
              profile;

          }
        );

    }


    b2bAdminRegistrationExportData[
      dayId
    ] = {
      registrations: rows,
      profileMap: profileMap
    };


    renderB2BAdminRegistrations(
      panel,
      rows,
      profileMap,
      dayId
    );


    panel.dataset.loaded =
      "true";

  }

  catch (error) {

    console.error(
      "B2B ADMIN INSCHRIJVINGEN FOUT:",
      error
    );


    panel.innerHTML = `
      <div class="status-message">
        Inschrijvingen konden niet worden geladen.
      </div>
    `;

  }

}


function renderB2BAdminRegistrations(
  panel,
  registrations,
  profileMap,
  dayId
) {

  const active =
    registrations.filter(
      registration =>
        registration.registration_status !==
        "cancelled"
    );


  const cancelled =
    registrations.filter(
      registration =>
        registration.registration_status ===
        "cancelled"
    );


  const totalGuests =
    active.reduce(
      (
        total,
        registration
      ) =>
        total +
        Number(
          registration.number_of_guests ||
          0
        ),
      0
    );


  const summary = `
    <div class="admin-registration-summary">

      <div>
        <span>Inschrijvingen</span>
        <strong>${active.length}</strong>
      </div>

      <div>
        <span>Personen</span>
        <strong>${totalGuests}</strong>
      </div>

      <div>
        <span>Geannuleerd</span>
        <strong>${cancelled.length}</strong>
      </div>

    </div>
  `;


  const guestListActions = `
    <div class="admin-guest-list-actions">

      <div>
        <span class="menu-card-label">
          Gastenlijst
        </span>

        <small>
          Alleen actieve inschrijvingen worden geëxporteerd.
        </small>
      </div>

      <button
        type="button"
        class="admin-export-button"
        onclick="exportB2BGuestList('${dayId}')"
      >
        Excel exporteren
      </button>

    </div>
  `;


  if (
    !registrations.length
  ) {

    panel.innerHTML =
      summary +
      guestListActions +
      `
        <div class="admin-registration-empty">
          Nog geen klanten ingeschreven voor deze B2B-dag.
        </div>
      `;

    return;

  }


  const cards =
    [...registrations]
      .sort(
        (
          a,
          b
        ) => {

          const aCancelled =
            a.registration_status ===
            "cancelled"
              ? 1
              : 0;


          const bCancelled =
            b.registration_status ===
            "cancelled"
              ? 1
              : 0;


          if (
            aCancelled !==
            bCancelled
          ) {

            return (
              aCancelled -
              bCancelled
            );

          }


          return String(
            a.company_name ||
            ""
          )
            .localeCompare(
              String(
                b.company_name ||
                ""
              ),
              "nl"
            );

        }
      )
      .map(
        registration => {

          const isCancelled =
            registration.registration_status ===
            "cancelled";


          const profile =
            profileMap[
              registration.representative_id
            ] ||
            {};


          const representativeName =
            profile.naam ||
            profile.email ||
            "Onbekende vertegenwoordiger";


          const contactParts =
            [];


          if (
            registration.contact_name
          ) {

            contactParts.push(
              registration.contact_name
            );

          }


          if (
            registration.email
          ) {

            contactParts.push(
              registration.email
            );

          }


          if (
            registration.phone
          ) {

            contactParts.push(
              registration.phone
            );

          }


          return `

            <div class="admin-registration-row ${
              isCancelled
                ? "is-cancelled"
                : ""
            }">

              <div class="admin-registration-row-top">

                <div>

                  <span class="admin-registration-state">
                    ${
                      isCancelled
                        ? "Geannuleerd"
                        : "Ingeschreven"
                    }
                  </span>

                  <strong>
                    ${escapeB2BHtml(
                      registration.company_name
                    )}
                  </strong>

                </div>


                <span class="admin-registration-guests">
                  ${Number(
                    registration.number_of_guests ||
                    0
                  )} pers.
                </span>

              </div>


              ${
                contactParts.length

                  ? `
                    <div class="admin-registration-contact">
                      ${escapeB2BHtml(
                        contactParts.join(
                          " · "
                        )
                      )}
                    </div>
                  `

                  : ""
              }


              ${
                !isCancelled
                  ? `
                    <div class="admin-attendance-readonly">
                      <span>Aanwezigheid</span>
                      <strong class="${
                        registration.attendance_status === "present"
                          ? "is-present"
                          : registration.attendance_status === "absent"
                            ? "is-absent"
                            : "is-unknown"
                      }">
                        ${
                          registration.attendance_status === "present"
                            ? "Aanwezig"
                            : registration.attendance_status === "absent"
                              ? "Afwezig"
                              : "Nog niet geregistreerd"
                        }
                      </strong>
                    </div>
                  `
                  : ""
              }

              <div class="admin-registration-extra">

                <div>
                  <span>Vertegenwoordiger</span>
                  <strong>
                    ${escapeB2BHtml(
                      representativeName
                    )}
                  </strong>
                </div>

                ${
                  registration.notes

                    ? `
                      <div>
                        <span>Opmerking</span>
                        <strong>
                          ${escapeB2BHtml(
                            registration.notes
                          )}
                        </strong>
                      </div>
                    `

                    : ""
                }

              </div>

            </div>

          `;

        }
      )
      .join("");


  panel.innerHTML =
    summary +
    guestListActions +
    `<div class="admin-registration-list">${cards}</div>`;

}



function exportB2BGuestList(dayId) {

  try {

    if (
      typeof XLSX ===
      "undefined"
    ) {

      throw new Error(
        "Excel-module kon niet worden geladen."
      );

    }


    const exportData =
      b2bAdminRegistrationExportData[
        dayId
      ];


    if (!exportData) {

      throw new Error(
        "Open eerst de inschrijvingen van deze B2B-dag."
      );

    }


    const registrations =
      (
        exportData.registrations ||
        []
      )
        .filter(
          registration =>
            registration.registration_status !==
            "cancelled"
        );


    if (
      !registrations.length
    ) {

      window.alert(
        "Er zijn geen actieve inschrijvingen om te exporteren."
      );

      return;

    }


    const dayCard =
      document.querySelector(
        `[data-admin-day-id="${dayId}"]`
      );


    const dayTitle =
      dayCard?.dataset.adminDayTitle ||
      "B2B-dag";


    const dayDate =
      dayCard?.dataset.adminDayDate ||
      "";


    const dayLocation =
      dayCard?.dataset.adminDayLocation ||
      "";


    const profileMap =
      exportData.profileMap ||
      {};


    const rows =
      registrations
        .sort(
          (
            a,
            b
          ) =>
            String(
              a.company_name ||
              ""
            )
              .localeCompare(
                String(
                  b.company_name ||
                  ""
                ),
                "nl"
              )
        )
        .map(
          registration => {

            const profile =
              profileMap[
                registration.representative_id
              ] ||
              {};


            return {

              "B2B-dag":
                dayTitle,

              "Datum":
                dayDate,

              "Locatie":
                dayLocation,

              "Horecazaak / bedrijf":
                registration.company_name ||
                "",

              "Contactpersoon":
                registration.contact_name ||
                "",

              "E-mail":
                registration.email ||
                "",

              "Telefoon":
                registration.phone ||
                "",

              "Aantal personen":
                Number(
                  registration.number_of_guests ||
                  0
                ),

              "Vertegenwoordiger":
                profile.naam ||
                profile.email ||
                "",

              "Opmerking":
                registration.notes ||
                ""

            };

          }
        );


    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );


    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 13 },
      { wch: 22 },
      { wch: 28 },
      { wch: 24 },
      { wch: 30 },
      { wch: 18 },
      { wch: 16 },
      { wch: 24 },
      { wch: 36 }
    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Gastenlijst"
    );


    const safeTitle =
      String(
        dayTitle
      )
        .replace(
          /[\\/:*?"<>|]+/g,
          "-"
        )
        .replace(
          /\s+/g,
          "_"
        )
        .slice(
          0,
          60
        );


    const fileName =
      `Achel_B2B_gastenlijst_${dayDate || "datum"}_${safeTitle}.xlsx`;


    XLSX.writeFile(
      workbook,
      fileName
    );

  }

  catch (error) {

    console.error(
      "B2B GASTENLIJST EXPORT FOUT:",
      error
    );


    window.alert(
      error?.message ||
      "De gastenlijst kon niet worden geëxporteerd."
    );

  }

}


function openB2BQuotaAdmin(
  dayId
) {

  window.location.href =
    `./admin-quota.html?day=${encodeURIComponent(
      dayId
    )}`;

}


function openB2BDayEdit(
  dayId
) {

  window.location.href =
    `./admin-dag-bewerken.html?id=${encodeURIComponent(
      dayId
    )}`;

}


// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initB2BAdminPage
);

// =========================================================
// B2B QUOTA ADMIN
// =========================================================

let quotaAdminDay = null;
let quotaAdminRepresentatives = [];
let quotaAdminCurrent = {};


// =========================================================
// INIT
// =========================================================

async function initB2BQuotaAdmin() {

  const container =
    document.getElementById(
      "quotaRepresentativesList"
    );


  if (!container) {
    return;
  }


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {

      window.location.href =
        "../index.html";

      return;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const dayId =
      params.get("day");


    if (!dayId) {

      throw new Error(
        "Geen B2B-dag geselecteerd."
      );

    }


    await loadQuotaAdminDay(
      dayId
    );


    await loadQuotaRepresentatives();


    await loadExistingQuotas(
      dayId
    );


    renderQuotaAdmin();

  }

  catch (error) {

    console.error(
      "B2B QUOTA ADMIN FOUT:",
      error
    );


    container.innerHTML = `
      <div class="status-message">
        Quota konden niet worden geladen.
      </div>
    `;

  }

}


// =========================================================
// DAG LADEN
// =========================================================

async function loadQuotaAdminDay(
  dayId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("b2b_days")
      .select(`
        id,
        title,
        event_date,
        location,
        max_capacity
      `)
      .eq(
        "id",
        dayId
      )
      .single();


  if (
    error ||
    !data
  ) {

    throw error ||
      new Error(
        "B2B-dag niet gevonden."
      );

  }


  quotaAdminDay =
    data;

}


// =========================================================
// VERTEGENWOORDIGERS LADEN
// =========================================================

async function loadQuotaRepresentatives() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, naam, email, rol, actief"
      )
      .eq(
        "actief",
        true
      )
      .order(
        "naam",
        {
          ascending: true
        }
      );


  if (error) {
    throw error;
  }


  quotaAdminRepresentatives =
    (data || [])
      .filter(
        profile =>
          profile.rol ===
          "vertegenwoordiger"
          ||
          profile.rol ===
          "admin"
          ||
          profile.rol ===
          "verantwoordelijke"
      );

}


// =========================================================
// BESTAANDE QUOTA
// =========================================================

async function loadExistingQuotas(
  dayId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("b2b_quotas")
      .select(`
        representative_id,
        quota
      `)
      .eq(
        "b2b_day_id",
        dayId
      );


  if (error) {
    throw error;
  }


  quotaAdminCurrent =
    {};


  (data || [])
    .forEach(
      row => {

        quotaAdminCurrent[
          row.representative_id
        ] =
          Number(
            row.quota || 0
          );

      }
    );

}


// =========================================================
// RENDER
// =========================================================

function renderQuotaAdmin() {

  if (!quotaAdminDay) {
    return;
  }


  document
    .getElementById(
      "quotaDayTitle"
    )
    .textContent =
      quotaAdminDay.title;


  const meta = [];


  if (
    quotaAdminDay.event_date
  ) {

    meta.push(
      formatB2BDate(
        quotaAdminDay.event_date
      )
    );

  }


  if (
    quotaAdminDay.location
  ) {

    meta.push(
      quotaAdminDay.location
    );

  }


  document
    .getElementById(
      "quotaDayMeta"
    )
    .textContent =
      meta.join(" · ");


  const container =
    document.getElementById(
      "quotaRepresentativesList"
    );


  if (
    !quotaAdminRepresentatives.length
  ) {

    container.innerHTML = `
      <div class="status-message">
        Geen actieve vertegenwoordigers gevonden.
      </div>
    `;

    return;
  }


  container.innerHTML =
    quotaAdminRepresentatives
      .map(
        profile => `

          <div class="quota-rep-card">

            <div class="quota-rep-info">

              <strong>
                ${escapeB2BHtml(
                  profile.naam ||
                  "Geen naam"
                )}
              </strong>

              <small>
                ${escapeB2BHtml(
                  profile.email ||
                  ""
                )}
              </small>

            </div>


            <input
              class="quota-rep-input"
              type="number"
              min="0"
              step="1"
              value="${
                quotaAdminCurrent[
                  profile.id
                ] || 0
              }"
              data-user-id="${profile.id}"
              oninput="updateQuotaAdminTotals()"
            >

          </div>

        `
      )
      .join("");


  updateQuotaAdminTotals();

}


// =========================================================
// TOTALEN
// =========================================================

function updateQuotaAdminTotals() {

  if (!quotaAdminDay) {
    return;
  }


  const inputs =
    [
      ...document.querySelectorAll(
        ".quota-rep-input"
      )
    ];


  const assigned =
    inputs.reduce(
      (
        total,
        input
      ) =>

        total +
        Math.max(
          0,
          Number(
            input.value || 0
          )
        ),

      0
    );


  const capacity =
    Number(
      quotaAdminDay.max_capacity ||
      0
    );


  const remaining =
    capacity -
    assigned;


  document
    .getElementById(
      "quotaTotalCapacity"
    )
    .textContent =
      capacity;


  document
    .getElementById(
      "quotaAssignedTotal"
    )
    .textContent =
      assigned;


  document
    .getElementById(
      "quotaUnassignedTotal"
    )
    .textContent =
      remaining;


  const saveButton =
    document.getElementById(
      "quotaSaveButton"
    );


  if (saveButton) {

    saveButton.disabled =
      assigned > capacity;

  }


  const remainingElement =
    document.getElementById(
      "quotaUnassignedTotal"
    );


  if (remainingElement) {

    remainingElement.style.color =
      remaining < 0
        ? "#eba3a3"
        : "";

  }

}


// =========================================================
// OPSLAAN
// =========================================================

async function saveB2BQuotas() {

  if (!quotaAdminDay) {
    return;
  }


  const button =
    document.getElementById(
      "quotaSaveButton"
    );


  try {

    const inputs =
      [
        ...document.querySelectorAll(
          ".quota-rep-input"
        )
      ];


    const rows =
      inputs.map(
        input => ({

          b2b_day_id:
            quotaAdminDay.id,

          representative_id:
            input.dataset.userId,

          quota:
            Math.max(
              0,
              Number(
                input.value || 0
              )
            )

        })
      );


    const assigned =
      rows.reduce(
        (
          total,
          row
        ) =>
          total +
          row.quota,
        0
      );


    const capacity =
      Number(
        quotaAdminDay.max_capacity ||
        0
      );


    if (
      assigned >
      capacity
    ) {

      showQuotaSaveMessage(
        "De verdeelde quota overschrijden de totale capaciteit.",
        true
      );

      return;
    }


    button.disabled =
      true;


    button.textContent =
      "Quota opslaan...";


    const {
      error
    } =
      await supabaseClient
        .from("b2b_quotas")
        .upsert(
          rows,
          {
            onConflict:
              "b2b_day_id,representative_id"
          }
        );


    if (error) {
      throw error;
    }


    showQuotaSaveMessage(
      "✓ Quota opgeslagen.",
      false
    );


    await loadExistingQuotas(
      quotaAdminDay.id
    );


    renderQuotaAdmin();

  }

  catch (error) {

    console.error(
      "B2B QUOTA OPSLAAN FOUT:",
      error
    );


    showQuotaSaveMessage(
      error?.message ||
      "Quota konden niet worden opgeslagen.",
      true
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Quota opslaan";


      updateQuotaAdminTotals();

    }

  }

}


// =========================================================
// MELDING
// =========================================================

function showQuotaSaveMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "quotaSaveMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.hidden =
    false;


  element.style.color =
    isError
      ? "#eba3a3"
      : "#9bd9ae";

}


// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initB2BQuotaAdmin
);

// =========================================================
// B2B-DAG BEWERKEN
// =========================================================

let editAdminB2BDay = null;


// =========================================================
// INIT
// =========================================================

async function initEditAdminB2BDay() {

  const heading =
    document.getElementById(
      "editDayHeading"
    );


  if (!heading) {
    return;
  }


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {

      window.location.href =
        "../index.html";

      return;
    }


    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, rol, actief"
        )
        .eq(
          "id",
          session.user.id
        )
        .single();


    if (
      profileError ||
      !profile
    ) {

      throw profileError ||
        new Error(
          "Profiel niet gevonden."
        );

    }


    const canManage =
      profile.actief === true
      &&
      (
        profile.rol === "admin"
        ||
        profile.rol === "verantwoordelijke"
      );


    if (!canManage) {

      window.location.href =
        "./index.html";

      return;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const dayId =
      params.get("id");


    if (!dayId) {

      throw new Error(
        "Geen B2B-dag geselecteerd."
      );

    }


    await loadAdminDayForEdit(
      dayId
    );

  }

  catch (error) {

    console.error(
      "B2B-DAG BEWERKEN LADEN FOUT:",
      error
    );


    showEditDayMessage(
      error?.message ||
      "B2B-dag kon niet worden geladen.",
      true
    );

  }

}


// =========================================================
// DAG LADEN
// =========================================================

async function loadAdminDayForEdit(
  dayId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("b2b_days")
      .select(`
        id,
        title,
        event_date,
        start_time,
        end_time,
        location,
        description,
        max_capacity,
        status
      `)
      .eq(
        "id",
        dayId
      )
      .single();


  if (
    error ||
    !data
  ) {

    throw error ||
      new Error(
        "B2B-dag niet gevonden."
      );

  }


  editAdminB2BDay =
    data;


  renderAdminDayEdit();

}


// =========================================================
// RENDER
// =========================================================

function renderAdminDayEdit() {

  if (!editAdminB2BDay) {
    return;
  }


  document
    .getElementById(
      "editDayHeading"
    )
    .textContent =
      editAdminB2BDay.title;


  document
    .getElementById(
      "editDayTitle"
    )
    .value =
      editAdminB2BDay.title ||
      "";


  document
    .getElementById(
      "editDayDate"
    )
    .value =
      editAdminB2BDay.event_date ||
      "";


  document
    .getElementById(
      "editDayStartTime"
    )
    .value =
      editAdminB2BDay.start_time
        ? String(
            editAdminB2BDay.start_time
          ).slice(0,5)
        : "";


  document
    .getElementById(
      "editDayEndTime"
    )
    .value =
      editAdminB2BDay.end_time
        ? String(
            editAdminB2BDay.end_time
          ).slice(0,5)
        : "";


  document
    .getElementById(
      "editDayLocation"
    )
    .value =
      editAdminB2BDay.location ||
      "";


  document
    .getElementById(
      "editDayCapacity"
    )
    .value =
      Number(
        editAdminB2BDay.max_capacity ||
        0
      );


  document
    .getElementById(
      "editDayStatus"
    )
    .value =
      editAdminB2BDay.status ||
      "draft";


  document
    .getElementById(
      "editDayDescription"
    )
    .value =
      editAdminB2BDay.description ||
      "";

}


// =========================================================
// OPSLAAN
// =========================================================

async function saveB2BDayChanges() {

  if (!editAdminB2BDay) {
    return;
  }


  const button =
    document.getElementById(
      "editDaySaveButton"
    );


  try {

    const title =
      document
        .getElementById(
          "editDayTitle"
        )
        .value
        .trim();


    const eventDate =
      document
        .getElementById(
          "editDayDate"
        )
        .value;


    const startTime =
      document
        .getElementById(
          "editDayStartTime"
        )
        .value;


    const endTime =
      document
        .getElementById(
          "editDayEndTime"
        )
        .value;


    const location =
      document
        .getElementById(
          "editDayLocation"
        )
        .value
        .trim();


    const description =
      document
        .getElementById(
          "editDayDescription"
        )
        .value
        .trim();


    const capacity =
      Number(
        document
          .getElementById(
            "editDayCapacity"
          )
          .value ||
        0
      );


    const status =
      document
        .getElementById(
          "editDayStatus"
        )
        .value;


    if (!title) {

      showEditDayMessage(
        "Vul een naam in.",
        true
      );

      return;
    }


    if (!eventDate) {

      showEditDayMessage(
        "Kies een datum.",
        true
      );

      return;
    }


    if (
      capacity < 0
    ) {

      showEditDayMessage(
        "De capaciteit kan niet negatief zijn.",
        true
      );

      return;
    }


    // Controleer of bestaande quota
    // niet groter zijn dan nieuwe capaciteit.

    const {
      data: quotas,
      error: quotaError
    } =
      await supabaseClient
        .from("b2b_quotas")
        .select("quota")
        .eq(
          "b2b_day_id",
          editAdminB2BDay.id
        );


    if (quotaError) {
      throw quotaError;
    }


    const assigned =
      (quotas || [])
        .reduce(
          (
            total,
            row
          ) =>
            total +
            Number(
              row.quota || 0
            ),
          0
        );


    if (
      capacity <
      assigned
    ) {

      showEditDayMessage(
        `De capaciteit kan niet lager zijn dan de reeds verdeelde quota (${assigned}).`,
        true
      );

      return;
    }


    button.disabled =
      true;


    button.textContent =
      "Wijzigingen opslaan...";


    const {
      error
    } =
      await supabaseClient
        .from("b2b_days")
        .update({

          title:
            title,

          event_date:
            eventDate,

          start_time:
            startTime || null,

          end_time:
            endTime || null,

          location:
            location || null,

          description:
            description || null,

          max_capacity:
            capacity,

          status:
            status,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          editAdminB2BDay.id
        );


    if (error) {
      throw error;
    }


    showEditDayMessage(
      "✓ B2B-dag gewijzigd.",
      false
    );


    setTimeout(
      () => {

        window.location.href =
          "./admin.html";

      },
      600
    );

  }

  catch (error) {

    console.error(
      "B2B-DAG WIJZIGEN FOUT:",
      error
    );


    showEditDayMessage(
      error?.message ||
      "De B2B-dag kon niet worden gewijzigd.",
      true
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Wijzigingen opslaan";

    }

  }

}


// =========================================================
// MELDING
// =========================================================

function showEditDayMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "editDayMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.hidden =
    false;


  element.style.color =
    isError
      ? "#eba3a3"
      : "#9bd9ae";

}


// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  initEditAdminB2BDay
);

// =========================================================
// B2B ADMIN KAART TONEN
// =========================================================

async function showB2BAdminCardIfAllowed() {

  const card =
    document.getElementById(
      "b2bAdminCard"
    );


  if (!card) {
    return;
  }


  try {

    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();


    if (!session?.user) {
      return;
    }


    const {
      data: profile,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "rol, actief"
        )
        .eq(
          "id",
          session.user.id
        )
        .single();


    if (error || !profile) {
      return;
    }


    const canManage =
      profile.actief === true
      &&
      (
        profile.rol === "admin"
        ||
        profile.rol === "verantwoordelijke"
      );


    card.hidden =
      !canManage;

  }

  catch (error) {

    console.error(
      "B2B ADMIN KAART FOUT:",
      error
    );

  }

}


document.addEventListener(
  "DOMContentLoaded",
  showB2BAdminCardIfAllowed
);
