import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === true) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Laden...</p>
            </>
          )}
          {status === "valid" && (
            <>
              <h1 className="text-xl font-semibold">Uitschrijven</h1>
              <p className="text-muted-foreground">Wilt u zich uitschrijven van e-mailnotificaties?</p>
              <Button onClick={handleUnsubscribe} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Bevestig uitschrijving
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
              <h1 className="text-xl font-semibold">Uitgeschreven</h1>
              <p className="text-muted-foreground">U ontvangt geen e-mailnotificaties meer.</p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="text-xl font-semibold">Al uitgeschreven</h1>
              <p className="text-muted-foreground">U bent al uitgeschreven van e-mailnotificaties.</p>
            </>
          )}
          {status === "invalid" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="text-xl font-semibold">Ongeldige link</h1>
              <p className="text-muted-foreground">Deze uitschrijflink is ongeldig of verlopen.</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="text-xl font-semibold">Fout</h1>
              <p className="text-muted-foreground">Er is iets misgegaan. Probeer het later opnieuw.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
