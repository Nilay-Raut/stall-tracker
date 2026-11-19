"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { speechLang } from "@/domain/spoken";
import { useLang, useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** The browser's speech recogniser (Chrome on Android calls it webkitSpeechRecognition). */
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type RecognitionClass = new () => Recognition;

function recognitionClass(): RecognitionClass | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionClass;
    webkitSpeechRecognition?: RecognitionClass;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * "Say it" button: listens once in the shop's language and hands back what was
 * heard. Hidden on browsers without speech recognition. The phone's recogniser
 * usually needs internet; typing always works.
 */
export function VoiceButton({
  onHeard,
  example,
}: {
  onHeard: (text: string) => void;
  example: string;
}) {
  const t = useT();
  const lang = useLang();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);

  // Known only in the browser, after the first paint (the screen is prerendered).
  useEffect(() => {
    const id = requestAnimationFrame(() => setSupported(recognitionClass() !== null));
    return () => {
      cancelAnimationFrame(id);
      active.current?.abort();
    };
  }, []);

  if (!supported) return null;

  const listen = () => {
    const Ctor = recognitionClass();
    if (!Ctor) return;
    if (listening) return active.current?.abort();
    const rec = new Ctor();
    rec.lang = speechLang(lang);
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setHeard(text);
      if (text) onHeard(text);
    };
    rec.onerror = (event) =>
      setProblem(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? t("Allow the microphone for this app to speak entries.")
          : event.error === "network"
            ? t("Speaking needs internet. Type it instead.")
            : t("Did not catch that. Try again."),
      );
    rec.onend = () => setListening(false);
    active.current = rec;
    setProblem(null);
    setHeard(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={listen}
        aria-pressed={listening}
        className={cn(
          "flex min-h-10 press items-center gap-2 rounded-full border px-4 text-[13px] font-bold",
          listening
            ? "animate-pulse border-accent bg-accent text-accent-ink"
            : "border-accent/30 bg-accent-soft text-ink",
        )}
      >
        <Mic size={16} aria-hidden />
        {listening ? t("Listening… tap to stop") : t("Say it")}
      </button>
      <p aria-live="polite" className="text-center text-xs text-muted">
        {problem ??
          (heard
            ? t("Heard: “{text}”", { text: heard })
            : listening
              ? t("For example: {example}", { example })
              : null)}
      </p>
    </div>
  );
}
