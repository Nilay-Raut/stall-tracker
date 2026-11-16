import { describe, expect, it } from "vitest";
import { formatRupees, formatSignedRupees, parseRupeeInput, rupeesToPaise } from "./money";

describe("rupeesToPaise", () => {
  it("rounds to whole paise", () => {
    expect(rupeesToPaise(155)).toBe(15500);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });
});

describe("formatRupees", () => {
  it("uses Indian digit grouping", () => {
    expect(formatRupees(rupeesToPaise(5630))).toBe("₹5,630");
    expect(formatRupees(rupeesToPaise(123456))).toBe("₹1,23,456");
  });

  it("shows paise only when there are any", () => {
    expect(formatRupees(1250)).toBe("₹12.5");
    expect(formatRupees(1205)).toBe("₹12.05");
  });

  it("puts a minus sign before the rupee symbol", () => {
    expect(formatRupees(-50000)).toBe("−₹500");
  });
});

describe("formatSignedRupees", () => {
  it("matches the entries list in the wireframe", () => {
    expect(formatSignedRupees(133000)).toBe("+ ₹1,330");
    expect(formatSignedRupees(-50000)).toBe("− ₹500");
  });
});

describe("parseRupeeInput", () => {
  it("accepts what people type", () => {
    expect(parseRupeeInput("₹1,250")).toBe(125000);
    expect(parseRupeeInput(" 900 ")).toBe(90000);
    expect(parseRupeeInput("12.5")).toBe(1250);
  });

  it("rejects anything that is not an amount", () => {
    expect(parseRupeeInput("")).toBeNull();
    expect(parseRupeeInput("-5")).toBeNull();
    expect(parseRupeeInput("1.234")).toBeNull();
    expect(parseRupeeInput("abc")).toBeNull();
  });
});
