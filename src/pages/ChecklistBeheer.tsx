import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type TemplateRow = {
  id: string;
  audit_categorie: string;
  code: string;
  onderdeel: string;
  controlepunt: string;
  deel: number;
};

export default function ChecklistBeheer() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("checklist_templates")
      .select("*")
      .order("code")
      .then(({ data }) => {
        setItems((data as TemplateRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (!hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  const updateField = (id: string, field: keyof TemplateRow, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setChanged((prev) => new Set(prev).add(id));
  };

  const toggleDeel = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) updateField(id, "deel", item.deel === 1 ? 2 : 1);
  };

  const handleSave = async () => {
    if (changed.size === 0) return;
    setSaving(true);

    const updates = items.filter((i) => changed.has(i.id));
    const promises = updates.map((u) =>
      supabase.from("checklist_templates").update({ deel: u.deel, code: u.code, onderdeel: u.onderdeel, controlepunt: u.controlepunt }).eq("id", u.id)
    );
    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      toast({ title: "Fout", description: "Niet alle wijzigingen konden worden opgeslagen.", variant: "destructive" });
    } else {
      toast({ title: "Opgeslagen", description: `${updates.length} item(s) bijgewerkt.` });
      setChanged(new Set());
    }
    setSaving(false);
  };

  const renderTable = (categorie: string) => {
    const filtered = items.filter((i) => i.audit_categorie === categorie);
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Code</TableHead>
            <TableHead>Onderdeel</TableHead>
            <TableHead>Controlepunt</TableHead>
            <TableHead className="w-24 text-center">Deel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow key={item.id} className={changed.has(item.id) ? "bg-accent/40" : ""}>
              <TableCell>
                <Input className="font-mono h-8" value={item.code} onChange={(e) => updateField(item.id, "code", e.target.value)} />
              </TableCell>
              <TableCell>
                <Input className="text-xs h-8" value={item.onderdeel} onChange={(e) => updateField(item.id, "onderdeel", e.target.value)} />
              </TableCell>
              <TableCell>
                <Input className="text-sm h-8" value={item.controlepunt} onChange={(e) => updateField(item.id, "controlepunt", e.target.value)} />
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant={item.deel === 1 ? "default" : "secondary"}
                  size="sm"
                  className="w-12"
                  onClick={() => toggleDeel(item.id)}
                >
                  {item.deel}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (loading) return <div className="p-4">Laden...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Checklist beheer</h1>
        <Button onClick={handleSave} disabled={saving || changed.size === 0}>
          {saving ? "Opslaan..." : `Opslaan (${changed.size})`}
        </Button>
      </div>
      <Tabs defaultValue="EPW-B">
        <TabsList>
          <TabsTrigger value="EPW-B">EPW-B</TabsTrigger>
          <TabsTrigger value="EPW-D">EPW-D</TabsTrigger>
        </TabsList>
        <TabsContent value="EPW-B">{renderTable("EPW-B")}</TabsContent>
        <TabsContent value="EPW-D">{renderTable("EPW-D")}</TabsContent>
      </Tabs>
    </div>
  );
}
