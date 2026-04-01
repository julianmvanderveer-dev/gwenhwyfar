import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

const MAX_DURATION_MS = 60_000;

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const intentionalStop = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // Audio context refs for visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const stopCleanup = useCallback(() => {
    setListening(false);
    setInterimText("");
    cleanupAudio();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [cleanupAudio]);

  const toggle = useCallback(async () => {
    if (listening && recognitionRef.current) {
      intentionalStop.current = true;
      recognitionRef.current.stop();
      stopCleanup();
      return;
    }

    if (!supported) {
      toast.error("Spraakherkenning niet ondersteund", {
        description: "Gebruik een Chromium-browser (Chrome, Edge) voor spraak invoer.",
      });
      return;
    }

    // Request microphone permission and set up audio context for visualizer
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microfoon geweigerd", {
          description: "Sta microfoontoegang toe in je browser-instellingen.",
        });
      } else {
        toast.error("Microfoon niet beschikbaar", {
          description: "Controleer of een microfoon is aangesloten.",
        });
      }
      return;
    }

    streamRef.current = stream;

    // Set up AudioContext + AnalyserNode for visualization
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      // Visualizer won't work, but speech recognition can still proceed
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    intentionalStop.current = false;

    const recognition = new SR();
    recognition.lang = "nl-NL";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      if (intentionalStop.current) return;

      let finalTranscript = "";
      let interim = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        onResultRef.current(finalTranscript);
        setInterimText("");
      } else {
        setInterimText(interim);
      }
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
      if (ev.error === "no-speech") return;
      if (ev.error === "not-allowed") {
        toast.error("Microfoon geweigerd", {
          description: "Sta microfoontoegang toe in je browser-instellingen.",
        });
      } else if (ev.error === "network") {
        toast.error("Geen internetverbinding", {
          description: "Spraakherkenning vereist een actieve internetverbinding.",
        });
      }
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
      toast.info("Spraakopname gestopt", {
        description: "Maximale opnameduur bereikt (60s).",
      });
    }, MAX_DURATION_MS);
  }, [listening, supported, stopCleanup]);

  return { listening, toggle, supported, analyserNode: analyserRef.current, interimText };
}
