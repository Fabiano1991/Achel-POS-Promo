// Supabase Edge Function: send-order-mail
// Verstuurt een mail via Microsoft Graph namens een specifiek Achel e-mailadres.
//
// Deploy met:  supabase functions deploy send-order-mail
// Vereiste secrets (al ingesteld):
//   MS_CLIENT_ID, MS_TENANT_ID, MS_CLIENT_SECRET

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Stap 1: haal een access token op bij Microsoft (client credentials flow)
async function getAccessToken(): Promise<string> {
  const tenantId = Deno.env.get("MS_TENANT_ID")!;
  const clientId = Deno.env.get("MS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("MS_CLIENT_SECRET")!;

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token ophalen mislukt: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// Stap 2: verstuur de mail via Graph, namens het opgegeven afzenderadres
async function sendMail(params: {
  accessToken: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  bodyHtml: string;
}) {
  const { accessToken, fromAddress, toAddress, subject, bodyHtml } = params;

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    fromAddress
  )}/sendMail`;

  const payload = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: bodyHtml,
      },
      toRecipients: [
        {
          emailAddress: { address: toAddress },
        },
      ],
    },
    saveToSentItems: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mail versturen mislukt: ${res.status} ${errText}`);
  }
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fromAddress, toAddress, subject, bodyHtml } = await req.json();

    if (!fromAddress || !toAddress || !subject || !bodyHtml) {
      return new Response(
        JSON.stringify({
          error:
            "fromAddress, toAddress, subject en bodyHtml zijn verplicht.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getAccessToken();
    await sendMail({ accessToken, fromAddress, toAddress, subject, bodyHtml });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
