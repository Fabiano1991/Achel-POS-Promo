// Gedeelde hulp: mail versturen via Microsoft Graph vanaf een Achel-mailbox.
// Vereist secrets: MS_CLIENT_ID, MS_TENANT_ID, MS_CLIENT_SECRET (al ingesteld).
//
// 29/09/2026: B2B-mails worden verstuurd vanaf het adres van de collega die de
// klant inschreef. Lukt dat niet (bv. geen mailbox), dan valt de mail terug op
// het standaardadres, met "antwoorden aan" = de collega.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let cachedToken: { value: string; expiresAt: number } | null = null;

const ALLOWED_DOMAIN = "@achelsekluis.be";

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const res = await fetch(
    `https://login.microsoftonline.com/${Deno.env.get("MS_TENANT_ID")}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("MS_CLIENT_ID")!,
        client_secret: Deno.env.get("MS_CLIENT_SECRET")!,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!res.ok) throw new Error(`Microsoft-token ophalen mislukt: ${res.status} ${await res.text()}`);

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in || 3600) - 300) * 1000,
  };
  return cachedToken.value;
}

export async function sendGraphMail(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(params.from)}/sendMail`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: params.subject,
          body: { contentType: "HTML", content: params.html },
          toRecipients: [{ emailAddress: { address: params.to } }],
          ...(params.replyTo
            ? { replyTo: [{ emailAddress: { address: params.replyTo } }] }
            : {}),
        },
        saveToSentItems: true,
      }),
    },
  );
  if (!res.ok) throw new Error(`Mail versturen mislukt: ${res.status} ${await res.text()}`);
}

// Zoekt het Achel-e-mailadres van de collega die de inschrijving deed.
export async function getRepresentativeEmail(
  supabaseAdmin: SupabaseClient,
  representativeId: string | null | undefined,
): Promise<string | null> {
  if (!representativeId) return null;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("email, actief")
    .eq("id", representativeId)
    .maybeSingle();

  const email = String(data?.email || "").trim().toLowerCase();
  if (!email || !email.endsWith(ALLOWED_DOMAIN)) return null;
  return email;
}

// Verstuurt vanaf de collega; valt terug op het standaardadres als dat niet lukt.
export async function sendFromRepresentative(params: {
  repEmail: string | null;
  fallbackFrom: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ sentFrom: string; fallbackUsed: boolean }> {
  const { repEmail, fallbackFrom, to, subject, html } = params;

  if (repEmail) {
    try {
      await sendGraphMail({ from: repEmail, to, subject, html });
      return { sentFrom: repEmail, fallbackUsed: false };
    } catch (error) {
      console.error(`Versturen vanaf ${repEmail} mislukt, terugval op ${fallbackFrom}:`, error);
    }
  }

  await sendGraphMail({
    from: fallbackFrom,
    to,
    subject,
    html,
    replyTo: repEmail || undefined,
  });
  return { sentFrom: fallbackFrom, fallbackUsed: true };
}
