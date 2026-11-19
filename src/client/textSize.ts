"use client";

import { useSyncExternalStore } from "react";
import { TEXT_KEY } from "@/lib/themeScript";

/**
 * Text size, chosen per phone for reading in bright sun: normal, large or extra
 * large. Kept in localStorage and put on <html data-text> before the first paint
 * by THEME_SCRIPT; globals.css scales the whole screen from it.
 */
export type TextSize = "normal" | "large" | "xl";

const listeners = new Set<() => void>();

function read(): TextSize {
  try {
    const saved = localStorage.getItem(TEXT_KEY);
    return saved === "large" || saved === "xl" ? saved : "normal";
  } catch {
    return "normal";
  }
}

export function setTextSize(size: TextSize) {
  try {
    if (size === "normal") localStorage.removeItem(TEXT_KEY);
    else localStorage.setItem(TEXT_KEY, size);
  } catch {
    // Storage blocked: lasts until the page is reloaded.
  }
  const root = document.documentElement;
  if (size === "normal") delete root.dataset.text;
  else root.dataset.text = size;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTextSize(): TextSize | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
