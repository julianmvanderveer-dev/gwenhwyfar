import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { project_id, bestand_pad, uitdraai_id } = await req.json();
    if (!project_id || !bestand_pad || !uitdraai_id) {
      return new Response(JSON.stringify({ error: "Missing project_id, bestand_pad, or uitdraai_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to extracting
    await supabase.from("project_uitdraai").update({ status: "extracting" }).eq("id", uitdraai_id);

    // Get project audit_categorie
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("audit_categorie")
      .eq("id", project_id)
      .single();
    if (projErr || !project) throw new Error("Project not found");

    // Get checklist templates for this category
    const { data: templates } = await supabase
      .from("checklist_templates")
      .select("code, onderdeel, controlepunt, deel")
      .eq("audit_categorie", project.audit_categorie)
      .order("code");

    if (!templates || templates.length === 0) throw new Error("No templates found");

    // Download file via signed URL
    const { data: signedData, error: signErr } = await supabase.storage
      .from("project-documents")
      .createSignedUrl(bestand_pad, 600);
    if (signErr || !signedData?.signedUrl) throw new Error("Could not create signed URL");

    // Download file as base64
    const fileResp = await fetch(signedData.signedUrl);
    if (!fileResp.ok) throw new Error("Could not download file");
    const fileBuffer = await fileResp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Determine mime type from extension
    const ext = bestand_pad.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    const mimeType = mimeMap[ext] ?? "application/pdf";

    // Build template list for prompt
    const templateList = templates.map((t) => `${t.code} | ${t.controlepunt} (deel ${t.deel})`).join("\n");

    const systemPrompt = `Je bent een expert in het analyseren van EP-berekeningen en energieprestatie-documenten voor de Nederlandse bouwsector. 
Je ontvangt een projectuitdraai (document) en een lijst met controlepunten uit een auditchecklist.
Je taak: extraheer per controlepuntcode de relevante waarde of informatie uit het document.

Regels:
- Geef per code de exacte waarde of korte samenvatting uit het document
- Als een waarde niet in het document staat, geef dan een lege string ""
- Antwoord UITSLUITEND via de tool/functie, geen extra tekst`;

    const userPrompt = `Hier zijn de controlepunten waarvoor ik waarden nodig heb:

${templateList}

Analyseer het bijgevoegde document en extraheer per code de relevante waarde.`;

    // Build tool schema for structured output
    const codeProperties: Record<string, { type: string; description: string }> = {};
    for (const t of templates) {
      codeProperties[t.code] = {
        type: "string",
        description: `Waarde voor: ${t.controlepunt} (deel ${t.deel})`,
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_values",
              description: "Extraheer waarden per controlepuntcode uit het document",
              parameters: {
                type: "object",
                properties: codeProperties,
                required: Object.keys(codeProperties),
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_values" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);

      if (response.status === 429) {
        await supabase.from("project_uitdraai").update({ status: "fout" }).eq("id", uitdraai_id);
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        await supabase.from("project_uitdraai").update({ status: "fout" }).eq("id", uitdraai_id);
        return new Response(JSON.stringify({ error: "Onvoldoende tegoed voor AI-verwerking." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("project_uitdraai").update({ status: "fout" }).eq("id", uitdraai_id);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let extractedData: Record<string, string> = {};

    if (toolCall?.function?.arguments) {
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Save extracted data
    await supabase
      .from("project_uitdraai")
      .update({ extracted_data: extractedData, status: "klaar" })
      .eq("id", uitdraai_id);

    return new Response(JSON.stringify({ success: true, extracted_data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-uitdraai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
