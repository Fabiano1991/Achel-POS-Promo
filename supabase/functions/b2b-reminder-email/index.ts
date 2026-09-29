// ACHEL B2B - AUTOMATISCHE HERINNERINGSMAIL
// Supabase Edge Function: b2b-reminder-email
//
// Doel:
// - zoekt inschrijvingen voor B2B-dagen die over 3 dagen plaatsvinden
// - slaat geannuleerde inschrijvingen en inschrijvingen zonder e-mailadres over
// - verstuurt maximaal 1 herinneringsmail
// - vult reminder_sent_at in na succesvolle verzending
//
// Sinds 29/09/2026 vanaf het Achel-adres van de collega die de klant inschreef.
// Terugval-afzender: B2B_MAIL_FROM (secret, optioneel), standaard fabiano.venaruzzo@achelsekluis.be

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRepresentativeEmail, sendFromRepresentative } from "./graph-mail.ts";

const MAIL_FROM = Deno.env.get("B2B_MAIL_FROM") || "fabiano.venaruzzo@achelsekluis.be";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ACHEL_LOGO_URL =
  "https://fabiano1991.github.io/Achel-POS-Promo/achel-header-logo.png";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  }).format(new Date(`${value}T12:00:00+02:00`));
}

function formatTime(value: string | null) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function getBrusselsDatePlusDays(days: number) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const target = new Date(Date.UTC(year, month - 1, day));
  target.setUTCDate(target.getUTCDate() + days);

  return [
    target.getUTCFullYear(),
    String(target.getUTCMonth() + 1).padStart(2, "0"),
    String(target.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Alleen POST is toegestaan." }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, error: "Supabase server secrets ontbreken." }, 500);
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Standaard: herinnering 3 dagen vóór de B2B-dag.
    const targetDate = getBrusselsDatePlusDays(3);

    const { data: registrations, error: loadError } = await supabaseAdmin
      .from("b2b_registrations")
      .select(`
        id,
        representative_id,
        contact_name,
        email,
        number_of_guests,
        registration_status,
        reminder_sent_at,
        b2b_days!inner (
          title,
          event_date,
          start_time,
          end_time,
          location,
          status
        )
      `)
      .eq("b2b_days.event_date", targetDate)
      .neq("registration_status", "cancelled")
      .is("reminder_sent_at", null)
      .not("email", "is", null);

    if (loadError) throw loadError;

    const results = [];
    const repEmailCache: Record<string, string | null> = {};

    for (const registration of registrations || []) {
      const email = String(registration.email || "").trim();
      if (!email) continue;

      const dayRaw = registration.b2b_days;
      const day = Array.isArray(dayRaw) ? dayRaw[0] : dayRaw;
      if (!day) continue;
      if (day.status === "cancelled") continue;

      const contactName = String(registration.contact_name || "").trim();
      const greeting = contactName ? `Beste ${escapeHtml(contactName)},` : "Beste,";

      const title = escapeHtml(day.title || "Achel B2B");
      const date = escapeHtml(formatDate(day.event_date));
      const location = escapeHtml(day.location || "Achelse Kluis");
      const startTime = formatTime(day.start_time);
      const endTime = formatTime(day.end_time);

      let timeText = "";
      if (startTime && endTime) {
        timeText = `${escapeHtml(startTime)} – ${escapeHtml(endTime)}`;
      } else if (startTime) {
        timeText = escapeHtml(startTime);
      }

      const guests = Number(registration.number_of_guests || 1);

      const html = `
<!doctype html>
<html lang="nl">
<body style="margin:0;padding:0;background:#f3eadb;font-family:Arial,Helvetica,sans-serif;color:#2b231b;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3eadb;padding:24px 12px;">
<tr>
<td align="center">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5d8c4;">

<tr>
<td align="center" style="background:#211b15;padding:30px 24px 24px;">
<img src="${ACHEL_LOGO_URL}" alt="Achelse Kluis" width="180" style="display:block;width:180px;max-width:70%;height:auto;border:0;">
</td>
</tr>

<tr>
<td style="padding:34px 34px 12px;">

<div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#c89a52;font-weight:bold;margin-bottom:10px;">
Achel B2B
</div>

<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#211b15;">
We verwachten u binnenkort
</h1>

<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#4c4339;">
${greeting}
</p>

<p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#4c4339;">
Een kleine herinnering: over enkele dagen vindt
<strong>${title}</strong> plaats.
We kijken ernaar uit u te mogen verwelkomen bij de Achelse Kluis.
</p>

</td>
</tr>

<tr>
<td style="padding:0 34px 28px;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f3eb;border:1px solid #eadfce;border-radius:10px;">

<tr>
<td style="padding:18px 20px 8px;font-size:13px;color:#8b7c69;">
Praktische informatie
</td>
</tr>

<tr>
<td style="padding:0 20px 14px;font-size:17px;font-weight:bold;color:#211b15;">
${title}
</td>
</tr>

<tr>
<td style="padding:0 20px 8px;font-size:15px;line-height:1.7;color:#4c4339;">
<strong>Datum:</strong> ${date}
</td>
</tr>

${timeText ? `
<tr>
<td style="padding:0 20px 8px;font-size:15px;line-height:1.7;color:#4c4339;">
<strong>Tijd:</strong> ${timeText}
</td>
</tr>
` : ""}

<tr>
<td style="padding:0 20px 8px;font-size:15px;line-height:1.7;color:#4c4339;">
<strong>Locatie:</strong> ${location}
</td>
</tr>

<tr>
<td style="padding:0 20px 18px;font-size:15px;line-height:1.7;color:#4c4339;">
<strong>Aantal personen:</strong> ${guests}
</td>
</tr>

</table>
</td>
</tr>

<tr>
<td style="padding:0 34px 34px;">

<p style="margin:0;font-size:16px;line-height:1.65;color:#4c4339;">
Tot binnenkort bij de Achelse Kluis.<br><br>
Met vriendelijke groet,<br>
<strong>Team Achelse Kluis</strong>
</p>

</td>
</tr>

<tr>
<td align="center" style="background:#211b15;padding:18px 24px;font-size:12px;line-height:1.5;color:#aa9e8e;">
Achelse Kluis · B2B
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

      let sentFrom = MAIL_FROM;

      try {
        const repId = String(registration.representative_id || "");
        if (!(repId in repEmailCache)) {
          repEmailCache[repId] = await getRepresentativeEmail(supabaseAdmin, repId || null);
        }

        const sendResult = await sendFromRepresentative({
          repEmail: repEmailCache[repId],
          fallbackFrom: MAIL_FROM,
          to: email,
          subject: `Herinnering – ${day.title || "Achel B2B"}`,
          html,
        });
        sentFrom = sendResult.sentFrom;
      } catch (mailError) {
        console.error("B2B herinneringsmail niet verzonden:", registration.id, mailError);
        results.push({
          registration_id: registration.id,
          success: false,
          error: mailError instanceof Error ? mailError.message : String(mailError),
        });
        continue;
      }

      const sentAt = new Date().toISOString();

      const { error: updateError } = await supabaseAdmin
        .from("b2b_registrations")
        .update({ reminder_sent_at: sentAt, updated_at: sentAt })
        .eq("id", registration.id);

      if (updateError) {
        console.error("Mail verzonden maar reminder_sent_at kon niet worden opgeslagen:", updateError);
        results.push({ registration_id: registration.id, success: true, sent_from: sentFrom, tracking_updated: false });
        continue;
      }

      results.push({ registration_id: registration.id, success: true, sent_from: sentFrom, tracking_updated: true });
    }

    return jsonResponse({
      success: true,
      target_date: targetDate,
      found: registrations?.length || 0,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Achel B2B herinneringsmail fout:", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
