import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, project_id } = await req.json();

    if (!type || !project_id) {
      return new Response(JSON.stringify({ error: "type and project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project } = await admin
      .from("projects")
      .select("projectnaam, toegewezen_aan, adviseur_id")
      .eq("id", project_id)
      .maybeSingle();

    if (!project?.toegewezen_aan) {
      return new Response(
        JSON.stringify({ success: false, reason: "geen_auditor_toegewezen" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: auditor } = await admin
      .from("profiles")
      .select("email, naam")
      .eq("id", project.toegewezen_aan)
      .maybeSingle();

    if (!auditor?.email) {
      return new Response(
        JSON.stringify({ success: false, reason: "auditor_zonder_email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let templateName: string;
    let templateData: Record<string, any> = {
      auditorNaam: auditor.naam,
      projectnaam: project.projectnaam,
    };

    if (type === "reactie_ontvangen") {
      templateName = "reactie-ontvangen-auditor";
      if (project.adviseur_id) {
        const { data: adv } = await admin
          .from("adviseurs")
          .select("naam")
          .eq("id", project.adviseur_id)
          .maybeSingle();
        if (adv?.naam) templateData.adviseurNaam = adv.naam;
      }
    } else if (type === "audit_afgerond") {
      templateName = "audit-afgerond-auditor";
    } else {
      return new Response(JSON.stringify({ error: "Ongeldig type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotencyKey = `auditor-${type}-${project_id}-${Date.now()}`;

    const emailResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          templateName,
          recipientEmail: auditor.email,
          idempotencyKey,
          templateData,
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
    console.error("Error in notify-auditor:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});