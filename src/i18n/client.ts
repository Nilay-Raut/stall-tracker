"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/dates";
import { type Translate, isLang, translator } from "./translate";

/**
 * The app's language on this phone. Comes from the shop's Setup choice (saved here
 * when Today loads), so screens that work offline also show the right language.
 */
const KEY = "stall:lang";
const listeners = new Set<() => void>();

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    return isLang(stored) ? stored : "en";
  } catch {
    return "en"; // storage blocked
  }
}

export function setLang(lang: Lang): void {
  try {
    if (localStorage.getItem(KEY) === lang) return;
    localStorage.setItem(KEY, lang);
  } catch {
    // Storage blocked: the language just is not remembered.
  }
  document.documentElement.lang = lang;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current language (English while rendering on the server). */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => "en");
}

/** The translate function for the current language. */
export function useT(): Translate {
  return translator(useLang());
}
