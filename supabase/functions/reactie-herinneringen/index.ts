import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Tier = {
  flag: "reminder_overdue_3w_sent" | "reminder_overdue_2w_sent" | "reminder_overdue_1w_sent" | "reminder_pre_sent";
  template: string;
  match: (deadline: Date, now: Date) => boolean;
};

// Volgorde: zwaarste eerst, max 1 mail per project per cyclus
const TIERS: Tier[] = [
  {
    flag: "reminder_overdue_3w_sent",
    template: "reactie-herinnering-eindwaarschuwing",
    match: (d, n) => n.getTime() >= d.getTime() + 21 * 86400000,
  },
  {
    flag: "reminder_overdue_2w_sent",
    template: "reactie-herinnering-waarschuwing",
    match: (d, n) => n.getTime() >= d.getTime() + 14 * 86400000,
  },
  {
    flag: "reminder_overdue_1w_sent",
    template: "reactie-herinnering-overdue",
    match: (d, n) => n.getTime() >= d.getTime() + 7 * 86400000,
  },
  {
    flag: "reminder_pre_sent",
    template: "reactie-herinnering-pre",
    match: (d, n) => n.getTime() < d.getTime() && d.getTime() - n.getTime() <= 24 * 3600000,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    // Haal alle projecten op die wachten op een reactie en een deadline hebben
    const { data: projects, error: projErr } = await admin
      .from("projects")
      .select("id, projectnaam, adviseur_id, reactie_deadline, reminder_pre_sent, reminder_overdue_1w_sent, reminder_overdue_2w_sent, reminder_overdue_3w_sent")
      .eq("status", "wacht_op_reactie")
      .not("reactie_deadline", "is", null)
      .not("adviseur_id", "is", null);

    if (projErr) {
      console.error("Project fetch error:", projErr);
      return new Response(JSON.stringify({ error: projErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const p of projects ?? []) {
      // Check of er nog open EP-adviseur-bevindingen zijn
      const { count, error: cntErr } = await admin
        .from("findings")
        .select("id", { count: "exact", head: true })
        .eq("project_id", p.id)
        .eq("zichtbaar_voor_adviseur", true)
        .not("status", "in", "(reactie_ontvangen,reactie_goedgekeurd,gesloten)");

      if (cntErr) {
        console.error("Findings count error:", cntErr);
        continue;
      }
      if (!count || count === 0) continue;

      const deadline = new Date(p.reactie_deadline as string);

      // Bepaal hoogste tier waar (a) de tijd voorbij is en (b) de vlag nog niet gezet is
      let tier: Tier | null = null;
      for (const t of TIERS) {
        if (!(p as any)[t.flag] && t.match(deadline, now)) {
          tier = t;
          break;
        }
      }
      if (!tier) continue;

      // Haal adviseurgegevens op
      const { data: adviseur } = await admin
        .from("adviseurs")
        .select("email, naam")
        .eq("id", p.adviseur_id as string)
        .maybeSingle();

      if (!adviseur?.email) {
        console.warn("Adviseur zonder email voor project", p.id);
        continue;
      }

      const idempotencyKey = `${tier.template}-${p.id}-${deadline.toISOString().slice(0, 10)}`;

      const emailResp = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            templateName: tier.template,
            recipientEmail: adviseur.email,
            cc: "julian@borgch.nl",
            idempotencyKey,
            templateData: {
              adviseurNaam: adviseur.naam,
              projectnaam: p.projectnaam,
              projectId: p.id,
            },
          }),
        }
      );

      if (!emailResp.ok) {
        const txt = await emailResp.text();
        console.error("Email send failed", p.id, tier.template, txt);
        continue;
      }

      // Vlag zetten zodat dezelfde herinnering niet opnieuw uitgaat
      await admin
        .from("projects")
        .update({ [tier.flag]: true })
        .eq("id", p.id);

      results.push({ project_id: p.id, tier: tier.template });
    }

    return new Response(JSON.stringify({ success: true, sent: results.length, details: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in reactie-herinneringen:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});