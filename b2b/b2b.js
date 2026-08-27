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
      loadMyFollowups(user.id)
    ]);

  } catch (error) {
    console.error("B2B initialisatie mislukt:", error);

    showStatus(
      "B2B kon niet volledig worden geladen. Probeer opnieuw."
    );
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
