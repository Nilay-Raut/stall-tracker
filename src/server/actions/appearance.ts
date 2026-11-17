"use server";

import { accentProblem, normalizeHex } from "@/domain/brand";
import { msg } from "@/i18n/translate";
import { setAccent } from "@/server/brand";
import { requireShop } from "@/server/queries/shop";

export type AccentResult = { ok: true; accent: string | null } | { ok: false; error: string };

/** Saves the shop's brand colour. Null (or the default) means the app's own green. */
export async function saveAccent(input: string | null): Promise<AccentResult> {
  const shop = await requireShop();
  if (input === null) {
    await setAccent(shop.id, null);
    return { ok: true, accent: null };
  }
  const problem = accentProblem(input);
  if (problem === "invalid") return { ok: false, error: msg("Pick a colour.") };
  if (problem === "too-light") {
    return { ok: false, error: msg("This colour is too light to read. Pick a darker one.") };
  }
  const hex = normalizeHex(input)!;
  await setAccent(shop.id, hex);
  return { ok: true, accent: hex };
}
