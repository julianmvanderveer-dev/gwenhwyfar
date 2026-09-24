import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TYPE_LABELS: Record<string, string> = {
  probleem: "🐛 Probleem",
  tip: "💡 Tip / suggestie",
  opmerking: "💬 Opmerking",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback_id } = await req.json();

    if (!feedback_id) {
      return new Response(JSON.stringify({ error: "feedback_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: feedback } = await admin
      .from("feedback")
      .select("user_id, pagina, type, bericht, created_at")
      .eq("id", feedback_id)
      .maybeSingle();

    if (!feedback) {
      return new Response(JSON.stringify({ success: false, reason: "feedback_niet_gevonden" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let afzenderNaam: string | undefined;
    let afzenderEmail: string | undefined;
    if (feedback.user_id) {
      const { data: profiel } = await admin
        .from("profiles")
        .select("naam, email")
        .eq("id", feedback.user_id)
        .maybeSingle();
      afzenderNaam = profiel?.naam ?? undefined;
      afzenderEmail = profiel?.email ?? undefined;
    }

    const datum = new Date(feedback.created_at).toLocaleString("nl-NL", {
      timeZone: "Europe/Amsterdam",
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          templateName: "feedback-ontvangen",
          recipientEmail: "info@bengcert.nl",
          idempotencyKey: `feedback-${feedback_id}`,
          templateData: {
            afzenderNaam,
            afzenderEmail,
            typeLabel: TYPE_LABELS[feedback.type] ?? feedback.type,
            bericht: feedback.bericht,
            pagina: feedback.pagina,
            datum,
          },
        }),
      }
    );

    if (!emailResp.ok) {
      const errBody = await emailResp.text();
      console.error("Email send error:", emailResp.status, errBody);
      throw new Error(`Email verzenden mislukt: ${errBody}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-feedback:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
