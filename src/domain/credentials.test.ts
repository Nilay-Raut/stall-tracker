import { describe, expect, it } from "vitest";
import { isWeakPin } from "./credentials";

describe("isWeakPin", () => {
  it("refuses easy-to-guess PINs", () => {
    for (const pin of ["000000", "999999", "123456", "654321", "890123", "121212"]) {
      expect(isWeakPin(pin), pin).toBe(true);
    }
  });

  it("allows ordinary PINs", () => {
    for (const pin of ["482915", "730264", "102938"]) {
      expect(isWeakPin(pin), pin).toBe(false);
    }
  });
});
