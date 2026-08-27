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


  let value =
    Number(
      input.value || 1
    );


  value += amount;


  value =
    Math.max(
      1,
      value
    );


  value =
    Math.min(
      Math.max(
        1,
        editMaxGuests
      ),
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

          <article class="b2b-day-card">

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


            <div class="b2b-registration-actions">

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
    .value = "draft";

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
