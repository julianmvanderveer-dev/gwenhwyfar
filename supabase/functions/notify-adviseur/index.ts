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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Build email content
    let subject: string;
    let html: string;

    if (type === "audit_afgerond") {
      subject = `Audit afgerond: ${project.projectnaam}`;
      html = `
        <h2>Audit afgerond</h2>
        <p>Beste ${adviseur.naam},</p>
        <p>De audit voor project <strong>${project.projectnaam}</strong> is afgerond.</p>
        <p>Er staan findings klaar die uw reactie vereisen. Log in om de findings te bekijken en te reageren.</p>
        <p>Met vriendelijke groet,<br/>EPWD Auditplatform</p>
      `;
    } else if (type === "niet_akkoord") {
      subject = `Actie vereist: ${project.projectnaam}`;
      html = `
        <h2>Beoordeling: niet akkoord</h2>
        <p>Beste ${adviseur.naam},</p>
        <p>Uw reactie op een finding in project <strong>${project.projectnaam}</strong> is beoordeeld als <strong>niet akkoord</strong>.</p>
        <p>De finding is heropend. Log in om uw reactie aan te passen.</p>
        <p>Met vriendelijke groet,<br/>EPWD Auditplatform</p>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Ongeldig type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EPWD Audit <onboarding@resend.dev>",
        to: [adviseur.email],
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      throw new Error(`Resend API failed [${emailRes.status}]: ${JSON.stringify(emailData)}`);
    }

    return new Response(JSON.stringify({ success: true, email_id: emailData.id }), {
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
