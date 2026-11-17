"use client";

import { useSyncExternalStore } from "react";
import { normalizeHex } from "@/domain/brand";
import { BRAND_KEY, LOGO_KEY } from "@/lib/themeScript";

/**
 * The shop's brand colour and logo, kept on the phone (localStorage) so they
 * show offline and from the first paint. The server's copy arrives with the
 * Today snapshot (syncBrand) or straight from Settings after a change.
 */

export type StoredLogo = { v: number; url: string };
type Brand = { accent: string | null; logo: StoredLogo | null };

const listeners = new Set<() => void>();
let cached: Brand | null = null;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the brand still shows until the page reloads.
  }
}

function parseLogo(raw: string | null): StoredLogo | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as StoredLogo;
    return typeof value.v === "number" && value.url?.startsWith("data:image/") ? value : null;
  } catch {
    return null;
  }
}

function notify() {
  cached = null;
  for (const listener of listeners) listener();
}

function applyAccent(hex: string | null) {
  const root = document.documentElement;
  if (hex) root.style.setProperty("--brand", hex);
  else root.style.removeProperty("--brand");
}

/** Shows and keeps a brand colour on this phone. Null = the app's green. */
export function setLocalAccent(hex: string | null) {
  const value = hex ? normalizeHex(hex) : null;
  write(BRAND_KEY, value);
  applyAccent(value);
  notify();
}

/** Shows a colour without keeping it (live preview in Settings). */
export function previewAccent(hex: string | null) {
  applyAccent(hex ? normalizeHex(hex) : read(BRAND_KEY));
}

export function setLocalLogo(logo: StoredLogo | null) {
  write(LOGO_KEY, logo ? JSON.stringify(logo) : null);
  notify();
}

/** At logout: the next person on this phone must not see this shop's brand. */
export function clearBrand() {
  write(BRAND_KEY, null);
  write(LOGO_KEY, null);
  applyAccent(null);
  notify();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Stores a logo blob under its version. */
export async function keepLogo(version: number, blob: Blob) {
  setLocalLogo({ v: version, url: await blobToDataUrl(blob) });
}

/** Brings this phone in line with the server's brand (from the Today snapshot). */
export async function syncBrand(accent: string | null, logoVersion: number | null) {
  if (accent !== read(BRAND_KEY)) setLocalAccent(accent);
  await syncLogo(logoVersion);
}

/** Fetches the server's logo if this phone has another version (or none). */
export async function syncLogo(logoVersion: number | null) {
  const stored = parseLogo(read(LOGO_KEY));
  if (logoVersion === null) {
    if (stored) setLocalLogo(null);
    return;
  }
  if (stored?.v === logoVersion) return;
  const response = await fetch(`/api/logo?v=${logoVersion}`, { credentials: "same-origin" });
  if (response.ok) await keepLogo(logoVersion, await response.blob());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === BRAND_KEY || e.key === LOGO_KEY) {
      applyAccent(read(BRAND_KEY));
      notify();
    }
  };
  window.addEventListener("storage", onStorage); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Read once, then reused until something changes (notify clears it). */
function snapshot(): Brand {
  cached ??= { accent: read(BRAND_KEY), logo: parseLogo(read(LOGO_KEY)) };
  return cached;
}

const NONE: Brand = { accent: null, logo: null };

/** The brand stored on this phone. Empty on the server and before hydration. */
export function useBrand(): Brand {
  return useSyncExternalStore(subscribe, snapshot, () => NONE);
}
