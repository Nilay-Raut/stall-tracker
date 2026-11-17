import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, DEFAULT_ACCENT, accentProblem, contrast, normalizeHex } from "./brand";

describe("brand colour", () => {
  it("normalises hex input", () => {
    expect(normalizeHex("#0F7B5A")).toBe("#0f7b5a");
    expect(normalizeHex(" 0f7b5a ")).toBe("#0f7b5a");
    expect(normalizeHex("#fff")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("#0f7b5a;}body{")).toBeNull();
  });

  it("measures contrast like WCAG", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#777777")).toBe(1);
  });

  it("accepts the default and every preset", () => {
    expect(accentProblem(DEFAULT_ACCENT)).toBeNull();
    for (const preset of ACCENT_PRESETS) {
      expect(accentProblem(preset.hex), preset.name).toBeNull();
      // White button text on the accent stays readable.
      expect(contrast(preset.hex, "#ffffff"), preset.name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("refuses colours too light to read, and junk", () => {
    expect(accentProblem("#facc15")).toBe("too-light"); // yellow
    expect(accentProblem("#22c55e")).toBe("too-light"); // bright green
    expect(accentProblem("#ffffff")).toBe("too-light");
    expect(accentProblem("blue")).toBe("invalid");
  });
});
