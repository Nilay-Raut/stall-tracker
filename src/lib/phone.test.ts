import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("accepts common ways of writing a number", () => {
    expect(normalizePhone("9876543210")).toBe("9876543210");
    expect(normalizePhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizePhone("919876543210")).toBe("9876543210");
    expect(normalizePhone("098765-43210")).toBe("9876543210");
  });

  it("rejects numbers that are not Indian mobiles", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("5876543210")).toBeNull(); // mobiles start with 6-9
    expect(normalizePhone("98765432101")).toBeNull();
    expect(normalizePhone("98765abc10")).toBeNull();
  });
});
