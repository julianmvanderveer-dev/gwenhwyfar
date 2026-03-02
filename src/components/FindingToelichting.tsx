import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface Props {
  findingId: string;
  initialValue: string | null;
  editable: boolean;
}

export default function FindingToelichting({ findingId, initialValue, editable }: Props) {
  const [value, setValue] = useState(initialValue ?? "");

  const handleSpeech = useCallback(
    (transcript: string) => {
      setValue((prev) => {
        const next = prev ? prev + " " + transcript : transcript;
        // save immediately after speech
        supabase.from("findings").update({ toelichting: next } as any).eq("id", findingId).then();
        return next;
      });
    },
    [findingId]
  );

  const { listening, toggle, supported } = useSpeechRecognition(handleSpeech);

  const handleBlur = () => {
    supabase.from("findings").update({ toelichting: value } as any).eq("id", findingId).then();
  };

  if (!editable && !value) return null;

  return (
    <div className="flex items-start gap-1 mt-1">
      <Textarea
        className="text-xs min-h-[40px] resize-none"
        placeholder="Toelichting afwijking…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={!editable}
        rows={2}
      />
      {editable && supported && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`shrink-0 ${listening ? "text-red-500 animate-pulse" : ""}`}
          onClick={toggle}
          title={listening ? "Stop opname" : "Spraak invoer"}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
