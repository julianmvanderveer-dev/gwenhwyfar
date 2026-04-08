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
      return new Response(JSON.stringify({ error: "Alleen beheerders mogen teamleden toevoegen" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { naam, email, password, roles, invite } = await req.json();

    if (!naam || !email) {
      return new Response(JSON.stringify({ error: "Naam en e-mail zijn verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for creating user
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let newUserId: string;

    if (invite || !password) {
      // Invite mode: send invitation email
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
    } else {
      // Password mode: create user directly
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
