import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOORT: Record<string, string> = {
  algemeen: "Algemeen", intervisie: "Intervisie", bengcert_dag: "BengCert-dag", persoonlijk: "Persoonlijk",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Niet ingelogd" }, 401);
    const { data: rol } = await admin.from("user_roles").select("id").eq("user_id", u.user.id).eq("role", "beheer").maybeSingle();
    if (!rol) return json({ error: "Geen toegang" }, 403);

    const { bericht_id } = await req.json();
    if (typeof bericht_id !== "string") return json({ error: "bericht_id vereist" }, 400);

    const { data: b } = await admin.from("adviseur_berichten").select("*").eq("id", bericht_id).maybeSingle();
    if (!b) return json({ error: "Niet gevonden" }, 404);

    let q = admin.from("adviseurs").select("id, naam, email").eq("actief", true).not("email", "is", null);
    if (b.adviseur_id) q = q.eq("id", b.adviseur_id);
    const { data: ontvangers } = await q;

    const evenementDelen: string[] = [];
    if (b.evenement_datum) evenementDelen.push(new Date(b.evenement_datum).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    if (b.evenement_locatie) evenementDelen.push(b.evenement_locatie);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let verzonden = 0;
    const mislukt: string[] = [];
    for (const a of ontvangers ?? []) {
      if (!a.email) continue;
      const body = JSON.stringify({
        templateName: "bericht-van-bengcert",
        recipientEmail: a.email,
        idempotencyKey: `bericht-${b.id}-${a.id}`,
        templateData: {
          naam: a.naam, titel: b.titel, inhoud: b.inhoud,
          soortLabel: SOORT[b.soort] ?? "Bericht",
          evenement: evenementDelen.join(", ") || undefined,
          url: "https://www.bengaudit.nl/inbox",
        },
      });
      let ok = false;
      for (let poging = 0; poging < 5 && !ok; poging++) {
        try {
          const r = await fetch(`${url}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body,
          });
          if (r.ok) ok = true;
          else { console.error("mail fout", a.email, await r.text()); break; }
        } catch (e: any) {
          const wacht = typeof e?.retryAfterMs === "number" ? e.retryAfterMs + 250 : 3000;
          console.warn("rate limit, wacht", wacht, "ms voor", a.email);
          await sleep(wacht);
        }
      }
      if (ok) verzonden++; else mislukt.push(a.email);
      await sleep(300);
    }
    return json({ success: true, verzonden, mislukt });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "fout" }, 500);
  }
});
