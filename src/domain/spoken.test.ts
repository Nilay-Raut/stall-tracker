import { describe, expect, it } from "vitest";
import { parseSpoken, pickSpoken } from "./spoken";

describe("pickSpoken", () => {
  it("uses the first guess with an amount, not just the phone's top guess", () => {
    const found = pickSpoken(["sixty UPI", "60 UPI", "60 you pee"], [], (s) => s.amount !== null);
    expect(found?.text).toBe("60 UPI");
    expect(found?.spoken).toMatchObject({ amount: 6000, payment: "upi" });
  });

  it("gives null when no guess makes sense", () => {
    expect(pickSpoken(["hello", "yellow"], [], (s) => s.amount !== null)).toBeNull();
  });
});

const items = [
  { id: "c", name: "Chai", price: 2000 },
  { id: "s", name: "Samosa", price: 1500 },
  { id: "v", name: "Veg Momos", price: 8000 },
  { id: "m", name: "Momos", price: 7000 },
];

describe("parseSpoken", () => {
  it("reads a quick sale: amount and how it was paid", () => {
    expect(parseSpoken("chai 40 cash")).toMatchObject({ amount: 4000, payment: "cash" });
    expect(parseSpoken("₹1,200 google pay")).toMatchObject({ amount: 120000, payment: "upi" });
    expect(parseSpoken("चालीस रुपये नकद 40")).toMatchObject({ amount: 4000, payment: "cash" });
    expect(parseSpoken("६० यूपीआई")).toMatchObject({ amount: 6000, payment: "upi" });
  });

  it("finds saved items with the number said before each", () => {
    const spoken = parseSpoken("2 chai 1 samosa UPI", items);
    expect(spoken.lines).toEqual([
      { itemId: "c", name: "Chai", unitPrice: 2000, quantity: 2 },
      { itemId: "s", name: "Samosa", unitPrice: 1500, quantity: 1 },
    ]);
    expect(spoken.payment).toBe("upi");
    expect(spoken.amount).toBeNull(); // the 2 and the 1 were quantities
  });

  it("prefers the longer item name and accepts a plural", () => {
    const spoken = parseSpoken("three veg momo and momos", items);
    expect(spoken.lines.map((l) => [l.itemId, l.quantity])).toEqual([
      ["v", 3],
      ["m", 1],
    ]);
  });

  it("reads an expense: category, amount and who paid", () => {
    expect(parseSpoken("gas 900 from pocket")).toMatchObject({
      amount: 90000,
      category: "gas",
      paidFrom: "own_pocket",
    });
    expect(parseSpoken("तेल 450 यूपीआई")).toMatchObject({
      amount: 45000,
      category: "raw_material",
      paidFrom: "upi",
    });
  });

  it("keeps unknown words as the note of an Other expense", () => {
    expect(parseSpoken("ice 60 cash")).toMatchObject({
      amount: 6000,
      category: "other",
      note: "ice",
      paidFrom: "drawer",
    });
    expect(parseSpoken("gas 900").note).toBeNull();
  });
});
