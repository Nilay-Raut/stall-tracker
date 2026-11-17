/**
 * Shop logo limits (docs/PLAN-v2.md, Phase 2).
 * The phone checks the picked file, squares it and shrinks it to LOGO_SIZE;
 * the server checks the result again and stores at most MAX_STORED_BYTES.
 */

export type LogoMime = "image/webp" | "image/png" | "image/jpeg";

/** Formats the picker accepts. No SVG: it can carry scripts. */
export const ACCEPTED_LOGO_TYPES: readonly LogoMime[] = ["image/png", "image/jpeg", "image/webp"];
/** Biggest file the owner may pick (before shrinking). */
export const MAX_PICKED_BYTES = 2 * 1024 * 1024;
/** Smallest picked image side, in pixels: smaller ones look blurry. */
export const MIN_LOGO_SIDE = 64;
/** Side of the stored square logo, in pixels. */
export const LOGO_SIZE = 256;
/** Biggest stored logo (same limit as the database check). */
export const MAX_STORED_BYTES = 100 * 1024;

/** The image format, read from the file's first bytes (never trust the stated type). */
export function sniffLogoMime(bytes: Uint8Array): LogoMime | null {
  const starts = (sig: number[], at = 0) => sig.every((b, i) => bytes[at + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  // "RIFF" <size> "WEBP"
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/** Why the server refuses a logo upload, or null if it is fine. */
export function logoProblem(bytes: Uint8Array): "empty" | "too-big" | "not-an-image" | null {
  if (bytes.length === 0) return "empty";
  if (bytes.length > MAX_STORED_BYTES) return "too-big";
  return sniffLogoMime(bytes) ? null : "not-an-image";
}
