import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notificatie = {
  id: string;
  bericht: string;
  gelezen: boolean;
  created_at: string;
};

export default function NotificatieBel() {
  const { user } = useAuth();
  const [notificaties, setNotificaties] = useState<Notificatie[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadNotificaties();

    const channel = supabase
      .channel("notificaties")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaties", filter: `user_id=eq.${user.id}` },
        () => loadNotificaties()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadNotificaties = async () => {
    const { data } = await supabase
      .from("notificaties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotificaties((data as Notificatie[]) ?? []);
  };

  const markeerGelezen = async () => {
    const ongelezen = notificaties.filter((n) => !n.gelezen).map((n) => n.id);
    if (ongelezen.length === 0) return;
    await supabase.from("notificaties").update({ gelezen: true }).in("id", ongelezen);
    loadNotificaties();
  };

  const ongelezen = notificaties.filter((n) => !n.gelezen).length;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markeerGelezen(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {ongelezen > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
              {ongelezen > 9 ? "9+" : ongelezen}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Meldingen</h3>
        </div>
        <ScrollArea className="max-h-64">
          {notificaties.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Geen meldingen.</p>
          ) : (
            <div className="divide-y">
              {notificaties.map((n) => (
                <div key={n.id} className={`px-4 py-3 text-sm ${n.gelezen ? "text-muted-foreground" : "font-medium"}`}>
                  <p>{n.bericht}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString("nl-NL")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
