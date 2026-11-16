import type { Lang } from "@/lib/dates";
import { PHRASES } from "./phrases";

/**
 * Translates an English sentence. The English text itself is the key, so English needs
 * no dictionary and the code stays readable. {name} marks a value, filled from `values`.
 * Keys must be plain double-quoted strings so the completeness test can find them.
 */
export type Translate = (text: string, values?: Record<string, string | number>) => string;

/** Translations, grouped by screen in src/i18n/phrases: English -> Hindi and Marathi. */
export type Phrases = Record<string, { hi: string; mr: string }>;

/**
 * Marks a fixed English label (in a lookup table) for translation. Returns it unchanged;
 * the screen passes it through t() when showing it.
 */
export const msg = (text: string): string => text;

function fill(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

function dictionary(lang: "hi" | "mr"): Map<string, string> {
  const words = new Map<string, string>();
  for (const group of PHRASES) {
    for (const [english, translated] of Object.entries(group)) words.set(english, translated[lang]);
  }
  return words;
}

const cache = new Map<Lang, Translate>();

/** The translate function for a language. Anything without a translation stays English. */
export function translator(lang: Lang): Translate {
  let t = cache.get(lang);
  if (!t) {
    const words = lang === "en" ? null : dictionary(lang);
    t = (text, values) => fill(words?.get(text) ?? text, values);
    cache.set(lang, t);
  }
  return t;
}

/** English, the default for code that is given no language (and for tests). */
export const english: Translate = translator("en");

export const isLang = (value: unknown): value is Lang =>
  value === "en" || value === "hi" || value === "mr";
