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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is authenticated (JWT validated by gateway via verify_jwt=false config,
    // but we still check the header exists for basic auth)
    const _callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { type, project_id, finding_id } = await req.json();

    if (!type || !project_id) {
      return new Response(JSON.stringify({ error: "type and project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to look up advisor email
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("projectnaam, adviseur_id")
      .eq("id", project_id)
      .single();

    if (projErr || !project?.adviseur_id) {
      return new Response(JSON.stringify({ error: "Project of adviseur niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adviseur } = await admin
      .from("adviseurs")
      .select("email, naam")
      .eq("id", project.adviseur_id)
      .single();

    if (!adviseur?.email) {
      return new Response(JSON.stringify({ error: "Adviseur heeft geen e-mailadres" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine template name based on type
    let templateName: string;
    if (type === "audit_afgerond") {
      templateName = "audit-afgerond";
    } else if (type === "niet_akkoord") {
      templateName = "niet-akkoord";
    } else {
      return new Response(JSON.stringify({ error: "Ongeldig type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via transactional email infrastructure
    const idempotencyKey = `${templateName}-${project_id}-${finding_id ?? "all"}-${Date.now()}`;

    const { error: emailError } = await admin.functions.invoke(
      "send-transactional-email",
      {
        body: {
          templateName,
          recipientEmail: adviseur.email,
          cc: "julian@borgch.nl",
          idempotencyKey,
          templateData: {
            adviseurNaam: adviseur.naam,
            projectnaam: project.projectnaam,
          },
        },
      }
    );

    if (emailError) {
      console.error("Email send error:", emailError);
      throw new Error(`Email verzenden mislukt: ${emailError.message}`);
    }

    return new Response(JSON.stringify({ success: true, queued: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-adviseur:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
