import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import BengCertLogo from "@/components/BengCertLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [naam, setNaam] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Succes", description: "Controleer je e-mail voor de herstellink." });
      }
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { naam: naam || email },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Succes", description: "Controleer je e-mail om je account te bevestigen." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        navigate("/inbox");
      }
    }
    setLoading(false);
  };

  const title = mode === "signup" ? "Registreren" : mode === "forgot" ? "Wachtwoord vergeten" : "Inloggen";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,42%,20%)] via-[hsl(212,65%,30%)] to-[hsl(212,65%,49%)]">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <BengCertLogo variant="dark" size={36} />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="naam">Naam</Label>
                <Input id="naam" value={naam} onChange={(e) => setNaam(e.target.value)} />
              </div>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password">Wachtwoord</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Laden..." : mode === "signup" ? "Registreren" : mode === "forgot" ? "Verstuur herstelmail" : "Inloggen"}
            </Button>
          </form>
          <div className="mt-4 space-y-1 text-center">
            {mode === "login" && (
              <>
                <button className="text-sm text-muted-foreground underline block mx-auto" onClick={() => setMode("forgot")}>Wachtwoord vergeten?</button>
                <button className="text-sm text-muted-foreground underline block mx-auto" onClick={() => setMode("signup")}>Geen account? Registreren</button>
              </>
            )}
            {mode === "signup" && (
              <button className="text-sm text-muted-foreground underline" onClick={() => setMode("login")}>Al een account? Inloggen</button>
            )}
            {mode === "forgot" && (
              <button className="text-sm text-muted-foreground underline" onClick={() => setMode("login")}>Terug naar inloggen</button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
