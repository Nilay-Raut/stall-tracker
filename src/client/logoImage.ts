"use client";

import {
  ACCEPTED_LOGO_TYPES,
  LOGO_SIZE,
  type LogoMime,
  MAX_PICKED_BYTES,
  MAX_STORED_BYTES,
  MIN_LOGO_SIDE,
} from "@/domain/logo";
import { msg } from "@/i18n/translate";

export type PreparedLogo = { ok: true; blob: Blob } | { ok: false; error: string };

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  // Older Safari: decode through an <img>.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Checks the picked file and turns it into a small square logo: the middle
 * square of the image, LOGO_SIZE pixels, WebP (JPEG where the browser cannot
 * make WebP), at most MAX_STORED_BYTES.
 */
export async function prepareLogo(file: File): Promise<PreparedLogo> {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type as LogoMime)) {
    return { ok: false, error: msg("Pick a PNG, JPG or WebP picture.") };
  }
  if (file.size > MAX_PICKED_BYTES) {
    return { ok: false, error: msg("That picture is bigger than 2 MB. Pick a smaller one.") };
  }

  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await decode(file);
  } catch {
    return { ok: false, error: msg("This picture could not be opened. Try another one.") };
  }
  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (Math.min(width, height) < MIN_LOGO_SIDE) {
    return { ok: false, error: msg("That picture is too small. Use one at least 64 × 64.") };
  }

  // Middle square, scaled to LOGO_SIZE.
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = LOGO_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, error: msg("This picture could not be opened. Try another one.") };
  ctx.imageSmoothingQuality = "high";
  const draw = () =>
    ctx.drawImage(
      image,
      (width - side) / 2,
      (height - side) / 2,
      side,
      side,
      0,
      0,
      LOGO_SIZE,
      LOGO_SIZE,
    );
  draw();
  if ("close" in image) image.close?.();

  for (const quality of [0.86, 0.72, 0.58]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      // No WebP encoder (older iPhones): JPEG has no see-through parts, so paint white behind.
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, LOGO_SIZE, LOGO_SIZE);
      ctx.globalCompositeOperation = "source-over";
      blob = await toBlob(canvas, "image/jpeg", quality);
    }
    if (blob && blob.size <= MAX_STORED_BYTES) return { ok: true, blob };
  }
  return { ok: false, error: msg("That picture is too detailed to shrink. Try a simpler one.") };
}
