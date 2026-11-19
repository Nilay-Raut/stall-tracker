import { describe, expect, it } from "vitest";
import { commonAmounts } from "./quickAmounts";

describe("commonAmounts", () => {
  it("offers the most typed amounts, smallest first", () => {
    const typed = [4000, 2000, 4000, 6000, 2000, 4000, 6000, 15000];
    expect(commonAmounts(typed)).toEqual([2000, 4000, 6000]); // 150 was typed once only
  });

  it("keeps the most used when there are too many", () => {
    const typed = [1000, 1000, 1000, 2000, 2000, 2000, 3000, 3000];
    expect(commonAmounts(typed, 2)).toEqual([1000, 2000]);
  });

  it("skips amounts with paise", () => {
    expect(commonAmounts([2050, 2050, 2050])).toEqual([]);
  });
});
