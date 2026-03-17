import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const TYPES = [
  { value: "probleem", label: "🐛 Probleem" },
  { value: "tip", label: "💡 Tip / suggestie" },
  { value: "opmerking", label: "💬 Opmerking" },
];

export default function FeedbackKnop() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("opmerking");
  const [bericht, setBericht] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!bericht.trim()) {
      toast({ title: "Voer een bericht in", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback" as any).insert({
      user_id: user.id,
      pagina: location.pathname,
      type,
      bericht: bericht.trim(),
    } as any);
    setSending(false);
    if (error) {
      toast({ title: "Fout bij verzenden", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bedankt voor je feedback!" });
    setBericht("");
    setType("opmerking");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="fixed bottom-4 right-4 z-50 shadow-lg gap-1.5 rounded-full px-4"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-80">
        <div className="space-y-3">
          <p className="font-semibold text-sm">Feedback geven</p>
          <RadioGroup value={type} onValueChange={setType} className="flex gap-3">
            {TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-1.5">
                <RadioGroupItem value={t.value} id={`fb-${t.value}`} />
                <Label htmlFor={`fb-${t.value}`} className="text-xs cursor-pointer">{t.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <Textarea
            placeholder="Beschrijf je feedback..."
            value={bericht}
            onChange={(e) => setBericht(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Pagina: {location.pathname}</p>
          <Button size="sm" onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? "Verzenden..." : "Verstuur"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
