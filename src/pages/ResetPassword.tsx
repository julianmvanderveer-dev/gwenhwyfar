import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Fout", description: "Wachtwoorden komen niet overeen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succes", description: "Wachtwoord is gewijzigd." });
      navigate("/inbox");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-4 text-center">
        <p className="text-muted-foreground">Wachten op hersteltoken… Heb je de link uit je e-mail gebruikt?</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-4">
      <h1 className="text-xl font-bold mb-4">Nieuw wachtwoord instellen</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">Nieuw wachtwoord</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
          <Input id="confirmPassword" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Laden..." : "Wachtwoord opslaan"}
        </Button>
      </form>
    </div>
  );
}
