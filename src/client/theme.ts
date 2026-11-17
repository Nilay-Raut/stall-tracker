"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/themeScript";

/**
 * Light / dark theme, chosen per phone. "system" follows the phone's own setting.
 * The choice is kept in localStorage and put on <html data-theme> before the
 * first paint by THEME_SCRIPT, so the page never flashes the wrong colours.
 */
export type ThemeChoice = "system" | "light" | "dark";

/** Browser-bar colours, matching --color-canvas in globals.css. */
const BAR_COLOUR = { light: "#eef1f4", dark: "#0b0e12" } as const;

const listeners = new Set<() => void>();
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system"; // storage blocked: follow the phone
  }
}

function systemIsDark(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia(DARK_QUERY).matches;
}

function resolve(choice: ThemeChoice): "light" | "dark" {
  return choice === "system" ? (systemIsDark() ? "dark" : "light") : choice;
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  // Next renders one theme-color tag per scheme. "system" restores each to its own
  // colour; a manual choice paints both with the chosen one.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const own = meta.media.includes("dark") ? "dark" : "light";
    meta.content = BAR_COLOUR[choice === "system" ? own : choice];
  }
}

export function setTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage blocked: the change lasts until the page is reloaded.
  }
  apply(choice);
  current = choice;
  for (const listener of listeners) listener();
}

let current: ThemeChoice | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = matchMedia(DARK_QUERY);
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

/** Snapshot as "choice:resolved", so a change of the phone's setting re-renders too. */
function snapshot(): string {
  current ??= readChoice();
  return `${current}:${resolve(current)}`;
}

/** The saved choice and the theme actually showing. Null on the server. */
export function useTheme(): { choice: ThemeChoice; resolved: "light" | "dark" } | null {
  const value = useSyncExternalStore(subscribe, snapshot, () => null);
  if (!value) return null;
  const [choice, resolved] = value.split(":") as [ThemeChoice, "light" | "dark"];
  return { choice, resolved };
}
