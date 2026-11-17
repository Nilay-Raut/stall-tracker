/**
 * Shop brand colour (docs/PLAN-v2.md, Phase 2).
 *
 * The accent fills buttons (white text on it) and colours text and bars on the
 * light background. A colour is accepted only if it reads well in both roles:
 * at least 4.5:1 against the light page background. White on it is then always
 * above 4.5:1 too, since white is lighter than that background.
 */

export const DEFAULT_ACCENT = "#0f7b5a";

/** The light page background (--color-canvas in globals.css). */
const LIGHT_CANVAS = "#eef1f4";
const MIN_CONTRAST = 4.5;

/** Ready-made colours, all passing the check below (see brand.test.ts). */
export const ACCENT_PRESETS = [
  { hex: "#0f7b5a", name: "Green" },
  { hex: "#0f766e", name: "Teal" },
  { hex: "#1d4ed8", name: "Blue" },
  { hex: "#4f46e5", name: "Indigo" },
  { hex: "#7c3aed", name: "Purple" },
  { hex: "#be185d", name: "Pink" },
  { hex: "#b91c1c", name: "Red" },
  { hex: "#9a3412", name: "Orange" },
] as const;

const HEX = /^#[0-9a-f]{6}$/;

/** "#0F7B5A" / "0f7b5a" -> "#0f7b5a"; null if it is not a 6-digit hex colour. */
export function normalizeHex(input: string): string | null {
  const value = input.trim().toLowerCase();
  const hex = value.startsWith("#") ? value : `#${value}`;
  return HEX.test(hex) ? hex : null;
}

/** WCAG relative luminance of "#rrggbb". */
export function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two "#rrggbb" colours (1 to 21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Why a colour cannot be the accent, or null if it is fine. */
export function accentProblem(hex: string): "invalid" | "too-light" | null {
  const value = normalizeHex(hex);
  if (!value) return "invalid";
  return contrast(value, LIGHT_CANVAS) < MIN_CONTRAST ? "too-light" : null;
}
