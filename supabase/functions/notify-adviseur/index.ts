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

    const { type, project_id, finding_id } = await req.json();

    if (!type || !project_id) {
      return new Response(JSON.stringify({ error: "type and project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for all admin operations
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
      .select("email, naam, user_id")
      .eq("id", project.adviseur_id)
      .single();

    if (!adviseur?.email) {
      return new Response(JSON.stringify({ error: "Adviseur heeft geen e-mailadres" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Auto-invite if adviseur has no account yet ---
    let invited = false;
    if (!adviseur.user_id) {
      try {
        const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
          adviseur.email,
          { data: { naam: adviseur.naam } }
        );

        if (inviteError) {
          console.error("Invite error:", inviteError);
        } else if (inviteData?.user) {
          invited = true;
          const newUserId = inviteData.user.id;

          // Update adviseur record with new user_id
          await admin
            .from("adviseurs")
            .update({ user_id: newUserId })
            .eq("id", project.adviseur_id);

          // Assign ep_adviseur role
          await admin
            .from("user_roles")
            .insert({ user_id: newUserId, role: "ep_adviseur" });

          console.log("Adviseur invited and linked:", adviseur.email, newUserId);

          // Notify Julian about the new invite via a separate email
          const notifyResp = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                templateName: "audit-afgerond",
                recipientEmail: "julian@borgch.nl",
                idempotencyKey: `invite-notify-${project.adviseur_id}-${Date.now()}`,
                templateData: {
                  adviseurNaam: "Julian",
                  projectnaam: `[Uitnodiging verstuurd] ${adviseur.naam} (${adviseur.email}) is uitgenodigd voor BengCert`,
                },
              }),
            }
          );
          if (!notifyResp.ok) {
            console.error("Failed to notify Julian about invite:", await notifyResp.text());
          }
        }
      } catch (invErr) {
        console.error("Invite process failed:", invErr);
      }
    }

    // --- Determine template and send audit notification ---
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

    // Send via direct fetch instead of admin.functions.invoke to bypass gateway auth
    const idempotencyKey = `${templateName}-${project_id}-${finding_id ?? "all"}-${Date.now()}`;

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
          recipientEmail: adviseur.email,
          idempotencyKey,
          templateData: {
            adviseurNaam: adviseur.naam,
            projectnaam: project.projectnaam,
            projectId: project_id,
          },
        }),
      }
    );

    if (!emailResp.ok) {
      const errBody = await emailResp.text();
      console.error("Email send error:", emailResp.status, errBody);
      throw new Error(`Email verzenden mislukt: ${errBody}`);
    }

    const emailResult = await emailResp.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, invited, queued: true }), {
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
