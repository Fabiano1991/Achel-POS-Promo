// ACHEL B2B - BEVESTIGINGSMAIL OP BASIS VAN ECHTE INSCHRIJVING
// Supabase Edge Function: b2b-confirmation-email
//
// Verwacht POST JSON: { "registration_id": "UUID-VAN-DE-INSCHRIJVING" }
//
// De functie:
// 1. haalt de inschrijving + B2B-dag op uit Supabase;
// 2. stuurt de bevestiging naar het e-mailadres van die inschrijving,
//    VANAF het Achel-adres van de collega die de klant inschreef (sinds 29/09/2026);
// 3. vult confirmation_sent_at in na succesvolle verzending.
//
// Terugval-afzender: B2B_MAIL_FROM (secret, optioneel), standaard fabiano.venaruzzo@achelsekluis.be

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRepresentativeEmail, sendFromRepresentative } from "./graph-mail.ts";

const MAIL_FROM = Deno.env.get("B2B_MAIL_FROM") || "fabiano.venaruzzo@achelsekluis.be";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ACHEL_LOGO_URL =
  "https://fabiano1991.github.io/Achel-POS-Promo/achel-header-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Alleen POST is toegestaan." }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, error: "Supabase server secrets ontbreken." }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const registrationId = String(body?.registration_id || "").trim();

    if (!registrationId) {
      return jsonResponse({ success: false, error: "registration_id ontbreekt." }, 400);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: registration, error: registrationError } = await supabaseAdmin
      .from("b2b_registrations")
      .select(`
        id,
        representative_id,
        company_name,
        contact_name,
        email,
        number_of_guests,
        registration_status,
        confirmation_sent_at,
        b2b_days (
          title,
          event_date,
          start_time,
          end_time,
          location
        )
      `)
      .eq("id", registrationId)
      .single();

    if (registrationError || !registration) {
      return jsonResponse(
        { success: false, error: registrationError?.message || "Inschrijving niet gevonden." },
        404,
      );
    }

    if (registration.registration_status === "cancelled") {
      return jsonResponse(
        { success: false, error: "Geannuleerde inschrijvingen krijgen geen bevestigingsmail." },
        400,
      );
    }

    if (!registration.email) {
      return jsonResponse(
        { success: false, error: "Bij deze inschrijving is geen e-mailadres ingevuld." },
        400,
      );
    }

    if (registration.confirmation_sent_at) {
      return jsonResponse({
        success: true,
        already_sent: true,
        message: "De bevestigingsmail was al verzonden.",
      });
    }

    const dayRaw = registration.b2b_days;
    const day = Array.isArray(dayRaw) ? dayRaw[0] : dayRaw;

    if (!day) {
      return jsonResponse(
        { success: false, error: "De gekoppelde B2B-dag kon niet worden gevonden." },
        404,
      );
    }

    const contactName = String(registration.contact_name || "").trim();
    const greeting = contactName ? `Beste ${escapeHtml(contactName)},` : "Beste,";

    const title = escapeHtml(day.title || "Achel B2B");
    const location = escapeHtml(day.location || "Achelse Kluis");
    const date = escapeHtml(formatDate(day.event_date));
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
Uw inschrijving is bevestigd
</h1>

<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#4c4339;">
${greeting}
</p>

<p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#4c4339;">
Bedankt voor uw inschrijving voor <strong>${title}</strong>.
We kijken ernaar uit u te mogen verwelkomen bij de Achelse Kluis.
</p>
</td>
</tr>

<tr>
<td style="padding:0 34px 28px;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f3eb;border:1px solid #eadfce;border-radius:10px;">

<tr>
<td style="padding:18px 20px 8px;font-size:13px;color:#8b7c69;">
B2B-dag
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
<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#4c4339;">
Enkele dagen voor het evenement ontvangt u nog een herinnering met de praktische informatie.
</p>

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

    let sendResult: { sentFrom: string; fallbackUsed: boolean };

    try {
      const repEmail = await getRepresentativeEmail(supabaseAdmin, registration.representative_id);

      sendResult = await sendFromRepresentative({
        repEmail,
        fallbackFrom: MAIL_FROM,
        to: registration.email,
        subject: `Bevestiging inschrijving – ${day.title || "Achel B2B"}`,
        html,
      });
    } catch (mailError) {
      console.error("B2B bevestigingsmail niet verzonden:", mailError);
      return jsonResponse(
        {
          success: false,
          error: mailError instanceof Error ? mailError.message : String(mailError),
        },
        502,
      );
    }

    const sentAt = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("b2b_registrations")
      .update({ confirmation_sent_at: sentAt, updated_at: sentAt })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Mail verzonden maar confirmation_sent_at kon niet worden opgeslagen:", updateError);
      return jsonResponse({
        success: true,
        mail_sent: true,
        sent_from: sendResult.sentFrom,
        tracking_updated: false,
        warning: "Mail is verzonden, maar confirmation_sent_at kon niet worden opgeslagen.",
      });
    }

    return jsonResponse({
      success: true,
      mail_sent: true,
      sent_from: sendResult.sentFrom,
      fallback_used: sendResult.fallbackUsed,
      tracking_updated: true,
      message: "B2B-bevestigingsmail succesvol verzonden.",
    });
  } catch (error) {
    console.error("Achel B2B bevestigingsmail fout:", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
