import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import NotificatieBel from "@/components/NotificatieBel";
import FeedbackKnop from "@/components/FeedbackKnop";
import AppLogo from "@/components/AppLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AppLayout() {
  const { user, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      toast({ title: "Wachtwoord moet minimaal 6 tekens zijn", variant: "destructive" });
      return;
    }
    if (pw !== pw2) {
      toast({ title: "Wachtwoorden komen niet overeen", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwLoading(false);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Wachtwoord gewijzigd" });
    setPw("");
    setPw2("");
    setPwOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-[hsl(220,42%,20%)] text-white px-6 py-3 flex items-center gap-6 text-sm shadow-md">
        <Link to="/inbox" className="flex items-center mr-4">
          <AppLogo variant="light" size={28} />
        </Link>

        <Link
          to="/inbox"
          className="font-medium hover:text-primary transition-colors"
        >
          Projecten
        </Link>

        {hasRole("beheer") && (
          <Link
            to="/beheer"
            className="font-medium hover:text-primary transition-colors"
          >
            Beheer
          </Link>
        )}
        {hasRole("beheer") && (
          <Link
            to="/checklist-beheer"
            className="font-medium hover:text-primary transition-colors"
          >
            Checklists
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          <NotificatieBel />
          <span className="text-white/70 text-xs">{user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPwOpen(true)}
            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Wachtwoord wijzigen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Uitloggen
          </Button>
        </div>
      </nav>
      <Outlet />
      <FeedbackKnop />

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wachtwoord wijzigen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="new-pw">Nieuw wachtwoord</Label>
              <Input id="new-pw" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new-pw2">Bevestig nieuw wachtwoord</Label>
              <Input id="new-pw2" type="password" minLength={6} required value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwOpen(false)}>Annuleren</Button>
              <Button type="submit" disabled={pwLoading}>{pwLoading ? "Opslaan..." : "Opslaan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
