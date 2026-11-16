import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PHRASES } from "./phrases";
import { english, translator } from "./translate";

/** Every t("...") and msg("...") key used in the source code (comments skipped). */
function usedKeys(): Set<string> {
  const keys = new Set<string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
        const source = readFileSync(full, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        // Prettier single-quotes strings that contain double quotes, so accept both.
        for (const match of source.matchAll(/\b(?:t|msg)\(\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
          keys.add(match[2].replace(/\\(.)/g, "$1"));
        }
      }
    }
  };
  walk(path.join(process.cwd(), "src"));
  return keys;
}

const names = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join();

describe("translations", () => {
  const keys = usedKeys();
  const all = new Map<string, { hi: string; mr: string }>();
  const conflicts: string[] = [];
  for (const group of PHRASES) {
    for (const [en, translated] of Object.entries(group)) {
      const seen = all.get(en);
      if (seen && (seen.hi !== translated.hi || seen.mr !== translated.mr)) conflicts.push(en);
      all.set(en, translated);
    }
  }

  it("has a Hindi and Marathi translation for every sentence in the app", () => {
    expect(keys.size).toBeGreaterThan(0);
    expect([...keys].filter((key) => !all.has(key))).toEqual([]);
  });

  it("keeps the same {values} in every translation", () => {
    const wrong = [...all].filter(
      ([en, { hi, mr }]) => names(hi) !== names(en) || names(mr) !== names(en),
    );
    expect(wrong.map(([en]) => en)).toEqual([]);
  });

  it("translates a sentence the same way everywhere", () => {
    expect(conflicts).toEqual([]);
  });

  it("has no leftover translations nobody uses", () => {
    expect([...all.keys()].filter((key) => !keys.has(key))).toEqual([]);
  });

  it("fills in values and falls back to English", () => {
    expect(english("{amount} to go", { amount: "₹570" })).toBe("₹570 to go");
    expect(translator("hi")("Today")).toBe("आज");
    expect(translator("mr")("A sentence nobody translated")).toBe("A sentence nobody translated");
  });
});
