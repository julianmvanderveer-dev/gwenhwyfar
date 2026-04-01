import { useCallback, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
  resultIndex: number;
}

const MAX_DURATION_MS = 60_000;

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const intentionalStop = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopCleanup = useCallback(() => {
    setListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening && recognitionRef.current) {
      intentionalStop.current = true;
      recognitionRef.current.stop();
      stopCleanup();
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    intentionalStop.current = false;

    const recognition = new SR();
    recognition.lang = "nl-NL";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      if (intentionalStop.current) return;
      const transcript = e.results[e.resultIndex][0].transcript;
      onResultRef.current(transcript);
    };

    recognition.onend = () => {
      if (intentionalStop.current) {
        stopCleanup();
        return;
      }
      // Auto-restart: browser may silently stop after silence
      try {
        recognition.start();
      } catch {
        stopCleanup();
      }
    };

    recognition.onerror = (ev: any) => {
      if (ev.error === "no-speech") return; // ignore, auto-restart handles it
      intentionalStop.current = true;
      stopCleanup();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);

    // Safety timeout
    timeoutRef.current = setTimeout(() => {
      intentionalStop.current = true;
      recognition.stop();
      stopCleanup();
      toast({ title: "Spraakopname gestopt", description: "Maximale opnameduur bereikt (60s)." });
    }, MAX_DURATION_MS);
  }, [listening, stopCleanup]);

  return { listening, toggle, supported };
}
