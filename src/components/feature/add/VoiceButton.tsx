"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { speechLang } from "@/domain/spoken";
import { useLang, useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** The browser's speech recogniser (Chrome calls it SpeechRecognition or webkitSpeechRecognition). */
type Alternative = { transcript: string };
type Result = ArrayLike<Alternative> & { isFinal: boolean };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: { resultIndex?: number; results: ArrayLike<Result> }) => void) | null;
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

/** A session that ends this fast, having heard nothing, is a phone hiccup: start again once. */
const HICCUP_MS = 1200;

/** Only ever called from tap and recogniser events, never while rendering. */
const clock = () => Date.now();

/**
 * "Say it" button: listens once in the shop's language. Words show while the owner
 * speaks; at the end every guess the phone made is handed over (best first), and
 * the screen says whether it understood. Hidden on browsers without speech
 * recognition. The phone's recogniser usually needs internet; typing always works.
 */
export function VoiceButton({
  onHeard,
  example,
}: {
  /** Every guess, best first. Returns the guess it could use, or null if none made sense. */
  onHeard: (guesses: string[]) => string | null;
  example: string;
}) {
  const t = useT();
  const lang = useLang();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState("");
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const active = useRef<Recognition | null>(null);
  const stoppedByUser = useRef(false);

  // Known only in the browser, after the first paint (the screen is prerendered).
  useEffect(() => {
    const id = requestAnimationFrame(() => setSupported(recognitionClass() !== null));
    return () => {
      cancelAnimationFrame(id);
      const rec = active.current;
      active.current = null;
      rec?.abort();
    };
  }, []);

  if (!supported) return null;

  const finish = (guesses: string[]) => {
    const used = guesses.length > 0 ? onHeard(guesses) : null;
    if (used) setMessage({ text: t("Heard: “{text}”", { text: used }) });
    else if (guesses[0]) {
      setMessage({
        text: t("Heard “{text}” but found no amount or item. Try again, or type it.", {
          text: guesses[0],
        }),
        bad: true,
      });
    } else {
      setMessage({
        text: t("Did not hear anything. Tap, wait a moment, then speak clearly."),
        bad: true,
      });
    }
  };

  const start = (retry: boolean) => {
    const Ctor = recognitionClass();
    if (!Ctor) return;
    active.current?.abort(); // never two at once
    const rec = new Ctor();
    const startedAt = clock();
    let finals: string[] | null = null; // every guess of the final result
    let interim = "";
    let failed = false;
    rec.lang = speechLang(lang);
    rec.interimResults = true; // words show while speaking
    rec.continuous = false;
    rec.maxAlternatives = 5;

    rec.onresult = (event) => {
      if (active.current !== rec) return;
      const results = Array.from(event.results);
      const last = results[results.length - 1];
      if (!last) return;
      if (last.isFinal) {
        finals = Array.from(last)
          .map((a) => a.transcript.trim())
          .filter(Boolean);
      } else {
        interim = results
          .map((r) => r[0]?.transcript ?? "")
          .join(" ")
          .trim();
        setLive(interim);
      }
    };
    rec.onerror = (event) => {
      if (active.current !== rec) return;
      if (event.error === "aborted" || event.error === "no-speech") return; // onend explains
      failed = true;
      setMessage({
        text:
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? t("Allow the microphone for this app to speak entries.")
            : event.error === "network"
              ? t("Speaking needs internet. Type it instead.")
              : event.error === "audio-capture"
                ? t("The microphone is busy or missing. Close other apps using it.")
                : t("Did not catch that. Try again."),
        bad: true,
      });
    };
    rec.onend = () => {
      if (active.current !== rec) return; // an older session ending: ignore
      active.current = null;
      setLive("");
      if (failed) return setListening(false);
      // Chrome on Android sometimes ends at once without listening: try once more.
      const quick = clock() - startedAt < HICCUP_MS;
      if (!finals && !interim && !retry && quick && !stoppedByUser.current) {
        return start(true);
      }
      setListening(false);
      // Phones sometimes end with words heard but never marked final: use them.
      finish(finals ?? (interim ? [interim] : []));
    };

    active.current = rec;
    try {
      rec.start();
    } catch {
      active.current = null;
      setListening(false);
      setMessage({ text: t("Did not catch that. Try again."), bad: true });
    }
  };

  const toggle = () => {
    if (listening) {
      // Stop: what was heard so far still counts (onend runs).
      const rec = active.current;
      if (rec) {
        stoppedByUser.current = true;
        rec.abort();
      } else {
        setListening(false);
      }
      return;
    }
    stoppedByUser.current = false;
    setMessage(null);
    setLive("");
    setListening(true);
    start(false);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={toggle}
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
      <p
        aria-live="polite"
        className={cn(
          "min-h-4 text-center text-xs",
          message?.bad ? "font-semibold text-danger" : "text-muted",
        )}
      >
        {listening
          ? live
            ? `“${live}”`
            : t("Speak now. For example: {example}", { example })
          : message?.text}
      </p>
    </div>
  );
}
