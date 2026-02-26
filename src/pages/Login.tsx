import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [naam, setNaam] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
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

  return (
    <div className="max-w-sm mx-auto mt-20 p-4">
      <h1 className="text-xl font-bold mb-4">{isSignUp ? "Registreren" : "Inloggen"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <Label htmlFor="naam">Naam</Label>
            <Input id="naam" value={naam} onChange={(e) => setNaam(e.target.value)} />
          </div>
        )}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Wachtwoord</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Laden..." : isSignUp ? "Registreren" : "Inloggen"}
        </Button>
      </form>
      <button className="mt-4 text-sm underline" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Al een account? Inloggen" : "Geen account? Registreren"}
      </button>
    </div>
  );
}
