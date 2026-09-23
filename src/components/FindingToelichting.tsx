import { useState, useCallback, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import AudioVisualizer from "@/components/AudioVisualizer";

interface Props {
  findingId: string;
  initialValue: string | null;
  editable: boolean;
  /** Indien true wordt elke opslag-actie ook als systeembericht gelogd (correctie van al-verstuurde bevinding) */
  logCorrectie?: boolean;
  onCorrectieGelogd?: () => void;
  /** Meldt de opgeslagen tekst terug aan het bovenliggende scherm */
  onSaved?: (findingId: string, toelichting: string) => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function FindingToelichting({
  findingId,
  initialValue,
  editable,
  logCorrectie,
  onCorrectieGelogd,
  onSaved,
}: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");

  const savedRef = useRef(initialValue ?? "");
  const valueRef = useRef(initialValue ?? "");
  const correctieGelogdRef = useRef(false);
  const propsRef = useRef({ logCorrectie, onCorrectieGelogd, onSaved });
  propsRef.current = { logCorrectie, onCorrectieGelogd, onSaved };

  const save = useCallback(async () => {
    const next = valueRef.current;
    if (next === savedRef.current) return;
    savedRef.current = next;
    setStatus("saving");

    const { error } = await supabase
      .from("findings")
      .update({ toelichting: next } as any)
      .eq("id", findingId);

    if (error) {
      savedRef.current = "\u0000niet-opgeslagen";
      setStatus("error");
      toast.error("Toelichting kon niet worden opgeslagen. Probeer het opnieuw.");
      return;
    }

    setStatus("saved");
    propsRef.current.onSaved?.(findingId, next);

    if (propsRef.current.logCorrectie && !correctieGelogdRef.current) {
      correctieGelogdRef.current = true;
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        await supabase.from("messages").insert({
          finding_id: findingId,
          afzender_id: auth.user.id,
          bericht: `[Correctie] Toelichting aangepast.`,
        } as any);
        propsRef.current.onCorrectieGelogd?.();
      }
    }
  }, [findingId]);

  // Debounced autosave tijdens typen
  useEffect(() => {
    valueRef.current = value;
    if (value === savedRef.current) return;
    setStatus((s) => (s === "saving" ? s : "idle"));
    const t = setTimeout(() => {
      void save();
    }, 1000);
    return () => clearTimeout(t);
  }, [value, save]);

  // Opslaan bij verlaten van het tabblad / scherm
  useEffect(() => {
    return () => {
      void save();
    };
  }, [save]);

  const handleSpeech = useCallback((transcript: string) => {
    setValue((prev) => (prev ? prev + " " + transcript : transcript));
  }, []);

  const { listening, toggle, supported, analyserNode, interimText } = useSpeechRecognition(handleSpeech);

  if (!editable && !value) return null;

  return (
    <div className="space-y-1 mt-1">
      <div className="flex items-start gap-1">
        <Textarea
          className="text-xs min-h-[40px] resize-none"
          placeholder="Toelichting afwijking…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void save()}
          disabled={!editable}
          rows={2}
        />
        {editable && supported && (
          <div className="flex items-center gap-1 shrink-0">
            <AudioVisualizer analyserNode={analyserNode} active={listening} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`shrink-0 ${listening ? "text-destructive animate-pulse" : ""}`}
              onClick={toggle}
              title={listening ? "Stop opname" : "Spraak invoer"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
      {editable && status !== "idle" && (
        <p
          className={`text-[10px] px-1 ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {status === "saving" ? "Opslaan…" : status === "saved" ? "Opgeslagen" : "Niet opgeslagen"}
        </p>
      )}
      {listening && interimText && (
        <p className="text-xs text-muted-foreground italic px-1">{interimText}…</p>
      )}
    </div>
  );
}
