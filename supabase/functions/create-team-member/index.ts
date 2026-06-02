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

    // Verify caller has beheer role
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: userError } = await anonClient.auth.getUser();
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = caller.id;

    // Check beheer role via DB
    const { data: roleCheck } = await anonClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "beheer")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Alleen beheerders mogen teamleden beheren" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Admin client
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Action: create EP-adviseur account met standaardwachtwoord
    if (body.action === "create_adviseur_account") {
      const email: string | undefined = body.email?.trim().toLowerCase();
      const naam: string | undefined = body.naam?.trim();
      if (!email || !naam) {
        return new Response(JSON.stringify({ error: "Naam en e-mail zijn verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const DEFAULT_PASSWORD = "BengCert26";

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { naam },
      });

      if (createErr) {
        const msg = createErr.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
          return new Response(JSON.stringify({ success: true, created: false, exists: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, created: true, exists: false, user_id: created.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list unconfirmed users
    if (body.action === "list_unconfirmed") {
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const unconfirmedIds = (users ?? [])
        .filter(u => !u.email_confirmed_at)
        .map(u => u.id);
      return new Response(JSON.stringify({ unconfirmed_ids: unconfirmedIds }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: delete user (volledig: auth + profile + rollen + categorieen + notificaties)
    if (body.action === "delete_user") {
      const targetId: string | undefined = body.user_id;
      if (!targetId) {
        return new Response(JSON.stringify({ error: "user_id is verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (targetId === userId) {
        return new Response(JSON.stringify({ error: "Je kunt je eigen account niet verwijderen" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Voorkom dat laatste actieve beheerder verdwijnt
      const { data: targetRoles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", targetId);
      const targetIsBeheer = (targetRoles ?? []).some((r: any) => r.role === "beheer");
      if (targetIsBeheer) {
        const { data: allBeheer } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "beheer");
        const uniqueBeheer = new Set((allBeheer ?? []).map((r: any) => r.user_id));
        if (uniqueBeheer.size <= 1) {
          return new Response(JSON.stringify({ error: "Dit is de laatste beheerder; verwijderen niet toegestaan." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Blokkerende koppelingen: actieve projecttoewijzingen / openstaande beoordelingen
      const { data: blokProjects } = await adminClient
        .from("projects")
        .select("id, projectnaam")
        .eq("toegewezen_aan", targetId)
        .limit(5);
      if (blokProjects && blokProjects.length > 0) {
        const namen = blokProjects.map((p: any) => p.projectnaam).join(", ");
        return new Response(
          JSON.stringify({ error: `Nog toegewezen aan project(en): ${namen}. Eerst hertoewijzen of terug naar pool.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: blokFindings } = await adminClient
        .from("findings")
        .select("id")
        .eq("toegewezen_beoordelaar", targetId)
        .limit(1);
      if (blokFindings && blokFindings.length > 0) {
        return new Response(
          JSON.stringify({ error: "Nog toegewezen als beoordelaar van openstaande bevindingen. Eerst hertoewijzen." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // EP-adviseur koppeling losmaken (record blijft bestaan)
      await adminClient.from("adviseurs").update({ user_id: null }).eq("user_id", targetId);

      // Opruimen
      await adminClient.from("user_audit_categorieen").delete().eq("user_id", targetId);
      await adminClient.from("user_roles").delete().eq("user_id", targetId);
      await adminClient.from("notificaties").delete().eq("user_id", targetId);
      const { error: profileDelErr } = await adminClient.from("profiles").delete().eq("id", targetId);
      if (profileDelErr) {
        return new Response(JSON.stringify({ error: profileDelErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: authDelErr } = await adminClient.auth.admin.deleteUser(targetId);
      if (authDelErr) {
        return new Response(JSON.stringify({ error: authDelErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: resend invite
    if (body.resend_invite) {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "E-mail is verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { naam: body.naam },
      });

      if (inviteError) {
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify Julian about the resend
      try {
        await fetch(
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
              templateData: {
                adviseurNaam: "Julian",
                projectnaam: `[Uitnodiging opnieuw verstuurd] ${body.naam ?? email} (${email})`,
              },
            }),
          }
        );
      } catch (notifyErr) {
        console.error("Failed to notify about resend:", notifyErr);
      }

      return new Response(JSON.stringify({ success: true, invited: true, user_id: inviteData.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Original create flow
    const { naam, email, password, roles, invite } = body;

    if (!naam || !email) {
      return new Response(JSON.stringify({ error: "Naam en e-mail zijn verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newUserId: string;

    if (invite || !password) {
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { naam },
      });

      if (inviteError) {
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      newUserId = inviteData.user.id;

      // Notify Julian about the new invite
      try {
        await fetch(
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
              templateData: {
                adviseurNaam: "Julian",
                projectnaam: `[Nieuw teamlid uitgenodigd] ${naam} (${email})`,
              },
            }),
          }
        );
      } catch (notifyErr) {
        console.error("Failed to notify about new invite:", notifyErr);
      }
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { naam },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      newUserId = newUser.user.id;
    }

    // Assign roles if provided
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const roleInserts = roles.map((role: string) => ({
        user_id: newUserId,
        role,
      }));
      await adminClient.from("user_roles").insert(roleInserts);
    }

    // Auto-link adviseur record if ep_adviseur role is assigned
    if (roles && Array.isArray(roles) && roles.includes("ep_adviseur")) {
      await adminClient
        .from("adviseurs")
        .update({ user_id: newUserId })
        .eq("email", email)
        .is("user_id", null);
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId, invited: !!invite || !password }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
