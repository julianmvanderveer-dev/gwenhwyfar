import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { AlertTriangle, Download, FileText, TrendingUp, Users as UsersIcon } from "lucide-react";

type Row = {
  finding_id: string;
  controlepunt: string;
  onderdeel: string;
  toelichting: string | null;
  type_afwijking: string | null;
  goedgekeurd_op: string | null;
  created_at: string;
  project_id: string;
  projectnaam: string;
  audit_categorie: string | null;
  audit_soort: string | null;
  adviseur_id: string | null;
  adviseur_naam: string;
  adviseur_nummer: number | null;
};

const ALLE = "__alle__";

function fmt(n: number) {
  return new Intl.NumberFormat("nl-NL").format(n);
}

export default function FoutenAnalyse() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [van, setVan] = useState<string>("");
  const [tot, setTot] = useState<string>("");
  const [categorie, setCategorie] = useState<string>(ALLE);
  const [soort, setSoort] = useState<string>(ALLE);
  const [onderdeel, setOnderdeel] = useState<string>(ALLE);
  const [adviseurFilter, setAdviseurFilter] = useState<string>(ALLE);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("findings")
        .select(
          `id, controlepunt, onderdeel, toelichting, type_afwijking, goedgekeurd_op, created_at,
           concept_reactie, status, beoordeling,
           project:projects!inner(id, projectnaam, audit_categorie, audit_soort, adviseur_id,
             adviseur:adviseurs(id, naam, nummer))`,
        )
        .eq("beoordeling", "niet_goed")
        .in("status", ["reactie_goedgekeurd", "gesloten"]);
      if (!active) return;
      if (error) {
        setRows([]);
        setLoading(false);
        return;
      }
      const mapped: Row[] = (data ?? [])
        .filter((f: any) => {
          const t = f.concept_reactie?.type;
          // Blijvende afwijking = adviseur ging akkoord met de afwijking en die is goedgekeurd afgesloten.
          // Als er geen concept_reactie is (bv. NK zonder documentatie, auto-akkoord), telt hij ook mee.
          return !t || t === "akkoord";
        })
        .map((f: any) => ({
          finding_id: f.id,
          controlepunt: f.controlepunt,
          onderdeel: f.onderdeel,
          toelichting: f.toelichting ?? null,
          type_afwijking: f.type_afwijking,
          goedgekeurd_op: f.goedgekeurd_op,
          created_at: f.created_at,
          project_id: f.project?.id,
          projectnaam: f.project?.projectnaam ?? "—",
          audit_categorie: f.project?.audit_categorie ?? null,
          audit_soort: f.project?.audit_soort ?? null,
          adviseur_id: f.project?.adviseur?.id ?? null,
          adviseur_naam: f.project?.adviseur?.naam ?? "— onbekend —",
          adviseur_nummer: f.project?.adviseur?.nummer ?? null,
        }));
      setRows(mapped);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const datum = r.goedgekeurd_op ?? r.created_at;
      if (van && datum && datum.slice(0, 10) < van) return false;
      if (tot && datum && datum.slice(0, 10) > tot) return false;
      if (categorie !== ALLE && r.audit_categorie !== categorie) return false;
      if (soort !== ALLE && r.audit_soort !== soort) return false;
      if (onderdeel !== ALLE && r.onderdeel !== onderdeel) return false;
      if (adviseurFilter !== ALLE && r.adviseur_id !== adviseurFilter) return false;
      return true;
    });
  }, [rows, van, tot, categorie, soort, onderdeel, adviseurFilter]);

  const categorieen = useMemo(
    () => Array.from(new Set(rows.map((r) => r.audit_categorie).filter(Boolean))) as string[],
    [rows],
  );
  const soorten = useMemo(
    () => Array.from(new Set(rows.map((r) => r.audit_soort).filter(Boolean))) as string[],
    [rows],
  );
  const onderdelen = useMemo(
    () => Array.from(new Set(rows.map((r) => r.onderdeel))).sort(),
    [rows],
  );
  const adviseurs = useMemo(() => {
    const map = new Map<string, { id: string; naam: string; nummer: number | null }>();
    for (const r of rows) {
      if (!r.adviseur_id) continue;
      if (!map.has(r.adviseur_id))
        map.set(r.adviseur_id, { id: r.adviseur_id, naam: r.adviseur_naam, nummer: r.adviseur_nummer });
    }
    return Array.from(map.values()).sort((a, b) => a.naam.localeCompare(b.naam));
  }, [rows]);

  // Helper: verzamel unieke, niet-lege toelichtingen (max N)
  const collectToelichtingen = (items: { toelichting: string | null }[], max = 3): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const it of items) {
      const t = (it.toelichting ?? "").trim();
      if (!t) continue;
      const norm = t.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(t);
      if (out.length >= max) break;
    }
    return out;
  };

  // Globaal: top controlepunten
  const globaal = useMemo(() => {
    const m = new Map<
      string,
      { controlepunt: string; onderdeel: string; aantal: number; adviseurs: Set<string>; items: Row[] }
    >();
    for (const r of filtered) {
      const key = `${r.onderdeel}||${r.controlepunt}`;
      const cur =
        m.get(key) ??
        { controlepunt: r.controlepunt, onderdeel: r.onderdeel, aantal: 0, adviseurs: new Set<string>(), items: [] as Row[] };
      cur.aantal += 1;
      if (r.adviseur_id) cur.adviseurs.add(r.adviseur_id);
      cur.items.push(r);
      m.set(key, cur);
    }
    return Array.from(m.values())
      .map((g) => ({ ...g, toelichtingen: collectToelichtingen(g.items, 3) }))
      .sort((a, b) => b.aantal - a.aantal);
  }, [filtered]);

  // Per adviseur: top controlepunten
  const perAdviseur = useMemo(() => {
    const m = new Map<
      string,
      {
        adviseur_id: string;
        naam: string;
        nummer: number | null;
        totaal: number;
        punten: Map<string, { controlepunt: string; onderdeel: string; aantal: number; items: Row[] }>;
      }
    >();
    for (const r of filtered) {
      const id = r.adviseur_id ?? "__geen__";
      const bucket = m.get(id) ?? {
        adviseur_id: id,
        naam: r.adviseur_naam,
        nummer: r.adviseur_nummer,
        totaal: 0,
        punten: new Map(),
      };
      bucket.totaal += 1;
      const pkey = `${r.onderdeel}||${r.controlepunt}`;
      const p =
        bucket.punten.get(pkey) ??
        { controlepunt: r.controlepunt, onderdeel: r.onderdeel, aantal: 0, items: [] as Row[] };
      p.aantal += 1;
      p.items.push(r);
      bucket.punten.set(pkey, p);
      m.set(id, bucket);
    }
    return Array.from(m.values())
      .map((b) => ({
        ...b,
        top: Array.from(b.punten.values())
          .map((p) => ({ ...p, toelichtingen: collectToelichtingen(p.items, 2) }))
          .sort((a, c) => c.aantal - a.aantal),
      }))
      .sort((a, b) => b.totaal - a.totaal);
  }, [filtered]);

  const maxGlobaal = globaal[0]?.aantal ?? 1;

  const resetFilters = () => {
    setVan("");
    setTot("");
    setCategorie(ALLE);
    setSoort(ALLE);
    setOnderdeel(ALLE);
    setAdviseurFilter(ALLE);
  };

  const exportCsv = () => {
    const rowsCsv = filtered.map((r) => ({
      Datum: (r.goedgekeurd_op ?? r.created_at ?? "").slice(0, 10),
      Adviseur: r.adviseur_naam,
      Adviseurnummer: r.adviseur_nummer != null ? String(r.adviseur_nummer).padStart(3, "0") : "",
      Project: r.projectnaam,
      Audit_categorie: r.audit_categorie ?? "",
      Audit_soort: r.audit_soort ?? "",
      Onderdeel: r.onderdeel,
      Controlepunt: r.controlepunt,
      Aard_afwijking: (r.toelichting ?? "").replace(/\s+/g, " ").trim(),
      Type_afwijking: r.type_afwijking ?? "",
    }));
    downloadCsv(rowsCsv as any, `foutenanalyse_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPdf = () => {
    const esc = (s: unknown) =>
      String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const soortLabel = (s: string | null) =>
      s === "dossieraudit" ? "Dossieraudit" : s === "projectaudit" ? "Projectaudit" : s ?? "—";

    const filterBits: string[] = [];
    if (van) filterBits.push(`vanaf ${van}`);
    if (tot) filterBits.push(`t/m ${tot}`);
    if (categorie !== ALLE) filterBits.push(`categorie: ${categorie}`);
    if (soort !== ALLE) filterBits.push(`soort: ${soortLabel(soort)}`);
    if (onderdeel !== ALLE) filterBits.push(`onderdeel: ${onderdeel}`);
    if (adviseurFilter !== ALLE) {
      const a = adviseurs.find((x) => x.id === adviseurFilter);
      filterBits.push(`adviseur: ${a?.naam ?? adviseurFilter}`);
    }
    const filtersLine = filterBits.length ? filterBits.join(" · ") : "geen filters";

    const globaalRows = globaal
      .slice(0, 50)
      .map(
        (g, i) => {
          const aard = g.toelichtingen.length
            ? g.toelichtingen.map((t) => `<div class="aard-item">• ${esc(t)}</div>`).join("")
            : '<span class="aard-empty">—</span>';
          return `
        <tr>
          <td class="num">#${i + 1}</td>
          <td>
            <div class="cp">${esc(g.controlepunt)}</div>
            <div class="aard">${aard}</div>
          </td>
          <td>${esc(g.onderdeel)}</td>
          <td class="num">${g.aantal}</td>
          <td class="num">${g.adviseurs.size}</td>
        </tr>`;
        },
      )
      .join("");

    const adviseurBlocks = perAdviseur
      .map((a) => {
        const rowsHtml = a.top
          .slice(0, 15)
          .map(
            (p, i) => {
              const aard = p.toelichtingen.length
                ? p.toelichtingen.map((t) => `<div class="aard-item">• ${esc(t)}</div>`).join("")
                : '<span class="aard-empty">—</span>';
              return `
            <tr>
              <td class="num">#${i + 1}</td>
              <td>
                <div class="cp">${esc(p.controlepunt)}</div>
                <div class="aard">${aard}</div>
              </td>
              <td>${esc(p.onderdeel)}</td>
              <td class="num">${p.aantal}</td>
            </tr>`;
            },
          )
          .join("");
        const nr = a.nummer != null ? String(a.nummer).padStart(3, "0") : "—";
        return `
        <section class="adviseur">
          <h3><span class="nr">${nr}</span> ${esc(a.naam)} <span class="totaal">${a.totaal} blijvende afwijking${a.totaal === 1 ? "" : "en"}</span></h3>
          <table>
            <thead><tr><th>#</th><th>Controlepunt</th><th>Onderdeel</th><th class="num">Aantal</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </section>`;
      })
      .join("");

    const now = new Date();
    const datumStr = now.toLocaleDateString("nl-NL");
    const bestandsdatum = now.toISOString().slice(0, 10);
    const title = `Foutenanalyse ${bestandsdatum}`;

    const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1B2A4A; margin: 0; font-size: 11px; line-height: 1.4; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #1B2A4A; }
  h2 { font-size: 14px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #1B2A4A; }
  h3 { font-size: 12px; margin: 14px 0 6px; display: flex; align-items: baseline; gap: 8px; }
  h3 .nr { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #64748b; font-weight: 500; }
  h3 .totaal { margin-left: auto; font-weight: 500; color: #b91c1c; font-size: 10px; }
  .meta { color: #475569; font-size: 10px; margin-bottom: 4px; }
  .intro { background: #f1f5f9; border-left: 3px solid #7AB929; padding: 8px 12px; margin: 12px 0 18px; font-size: 10px; color: #334155; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { background: #f8fafc; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; width: 60px; }
  .cp { font-weight: 500; }
  .aard { margin-top: 3px; font-size: 10px; color: #475569; }
  .aard-item { margin-top: 1px; }
  .aard-empty { color: #94a3b8; font-style: italic; }
  .adviseur { page-break-inside: avoid; margin-bottom: 12px; }
  .empty { color: #64748b; font-style: italic; padding: 12px 0; }
  footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>Foutenanalyse</h1>
  <div class="meta">Gegenereerd op ${datumStr} · ${filtered.length} blijvende afwijking${filtered.length === 1 ? "" : "en"} in selectie</div>
  <div class="meta"><strong>Filters:</strong> ${esc(filtersLine)}</div>
  <div class="intro">
    Blijvende afwijkingen zijn afgeronde bevindingen waarbij de EP-adviseur de afwijking heeft geaccepteerd
    (dus niet succesvol heeft weerlegd).
  </div>

  <h2>Globale top — meest voorkomende blijvende fouten</h2>
  ${
    globaal.length === 0
      ? '<div class="empty">Geen blijvende afwijkingen in deze selectie.</div>'
      : `<table>
          <thead><tr><th>#</th><th>Controlepunt</th><th>Onderdeel</th><th class="num">Aantal</th><th class="num">Adviseurs</th></tr></thead>
          <tbody>${globaalRows}</tbody>
        </table>`
  }

  <h2>Per adviseur</h2>
  ${perAdviseur.length === 0 ? '<div class="empty">Geen adviseurs in deze selectie.</div>' : adviseurBlocks}

  <footer>Foutenanalyse · ${datumStr}</footer>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.document.title = title;
    // Wacht tot alles gerenderd is voor het printdialoog opent
    win.onload = () => {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 100);
    };
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Analyse laden…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Uitleg */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground flex gap-3">
        <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-foreground">Blijvende afwijkingen.</span>{" "}
          Dit overzicht toont alle afgeronde bevindingen waarbij de EP-adviseur de afwijking heeft geaccepteerd
          (dus niet succesvol heeft weerlegd). Zo zie je welke fouten structureel terugkomen — globaal en per adviseur.
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">Periode van</Label>
            <Input type="date" value={van} onChange={(e) => setVan(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Periode tot</Label>
            <Input type="date" value={tot} onChange={(e) => setTot(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Audit-categorie</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALLE}>Alle</SelectItem>
                {categorieen.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Audit-soort</Label>
            <Select value={soort} onValueChange={setSoort}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALLE}>Alle</SelectItem>
                {soorten.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "dossieraudit" ? "Dossieraudit" : s === "projectaudit" ? "Projectaudit" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Onderdeel</Label>
            <Select value={onderdeel} onValueChange={setOnderdeel}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALLE}>Alle</SelectItem>
                {onderdelen.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Adviseur</Label>
            <Select value={adviseurFilter} onValueChange={setAdviseurFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALLE}>Alle</SelectItem>
                {adviseurs.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nummer != null ? `${String(a.nummer).padStart(3, "0")} — ` : ""}{a.naam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {fmt(filtered.length)} blijvende afwijking{filtered.length === 1 ? "" : "en"} in selectie
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>Filters wissen</Button>
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="globaal">
        <TabsList>
          <TabsTrigger value="globaal" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Globale top
          </TabsTrigger>
          <TabsTrigger value="per-adviseur" className="gap-1.5">
            <UsersIcon className="h-3.5 w-3.5" />
            Per adviseur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="globaal" className="space-y-2">
          {globaal.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
              Geen blijvende afwijkingen in deze selectie.
            </div>
          ) : (
            <div className="rounded-lg border bg-card divide-y">
              {globaal.slice(0, 25).map((g, i) => {
                const pct = (g.aantal / maxGlobaal) * 100;
                return (
                  <div key={`${g.onderdeel}-${g.controlepunt}`} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{g.controlepunt}</div>
                          <div className="text-xs text-muted-foreground">
                            {g.onderdeel} · {g.adviseurs.size} adviseur{g.adviseurs.size === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 tabular-nums">{g.aantal}×</Badge>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="per-adviseur" className="space-y-3">
          {perAdviseur.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
              Geen blijvende afwijkingen in deze selectie.
            </div>
          ) : (
            perAdviseur.map((a) => {
              const max = a.top[0]?.aantal ?? 1;
              return (
                <div key={a.adviseur_id} className="rounded-lg border bg-card">
                  <div className="px-4 py-3 border-b bg-secondary/40 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {a.nummer != null && (
                          <span className="font-mono text-muted-foreground mr-2">
                            {String(a.nummer).padStart(3, "0")}
                          </span>
                        )}
                        {a.naam}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.top.length} unieke controlepunt{a.top.length === 1 ? "" : "en"}
                      </div>
                    </div>
                    <Badge variant="destructive" className="shrink-0 tabular-nums">{a.totaal} blijvend</Badge>
                  </div>
                  <div className="divide-y">
                    {a.top.slice(0, 10).map((p, i) => {
                      const pct = (p.aantal / max) * 100;
                      return (
                        <div key={`${p.onderdeel}-${p.controlepunt}`} className="px-4 py-2.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="flex items-baseline gap-3 min-w-0">
                              <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                              <div className="min-w-0">
                                <div className="text-sm truncate">{p.controlepunt}</div>
                                <div className="text-xs text-muted-foreground">{p.onderdeel}</div>
                              </div>
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground shrink-0">{p.aantal}×</span>
                          </div>
                          <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}