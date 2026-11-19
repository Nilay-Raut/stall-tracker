import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { moneyAtClose, moneyNow, upiStartFrom } from "./stallMoney";

// Opening ₹1,000; cash sales 500, UPI sales 1,200; expenses: 260 from the drawer,
// 265 by UPI, 90 from the owner's pocket; 100 taken out of the drawer.
const day = {
  cashSales: r(500),
  upiSales: r(1200),
  drawerExpenses: r(260),
  upiExpenses: r(265),
  pocketExpenses: r(90),
  drawerCashOut: r(100),
  upiCashOut: 0,
  deposits: 0,
  drawerFixedPaid: 0,
  upiFixedPaid: 0,
  pocketFixedPaid: 0,
};

describe("moneyNow", () => {
  it("adds the drawer and the day's UPI, and keeps own-pocket spending apart", () => {
    expect(moneyNow(r(1000), day)).toEqual({
      cash: r(1140), // 1,000 + 500 − 260 − 100
      upi: r(935), // 1,200 − 265
      upiIsBalance: false,
      total: r(2075),
      pocket: r(90),
    });
  });

  it("can show UPI below zero when more went out by UPI than came in", () => {
    expect(moneyNow(0, { ...day, upiSales: 0 }).upi).toBe(r(-265));
  });

  it("adds the account balance at the start of the day when it is known", () => {
    const money = moneyNow(r(1000), day, r(5000));
    expect(money).toMatchObject({ upi: r(5935), upiIsBalance: true, total: r(7075) });
  });

  it("moves cash put in the bank from the drawer to UPI, leaving the total the same", () => {
    const before = moneyNow(r(1000), day, r(5000));
    const after = moneyNow(r(1000), { ...day, deposits: r(800) }, r(5000));
    expect(after.cash).toBe(before.cash - r(800));
    expect(after.upi).toBe(before.upi + r(800));
    expect(after.total).toBe(before.total);
  });

  it("takes a cash out from the account it came from", () => {
    const money = moneyNow(r(1000), { ...day, upiCashOut: r(300) }, r(5000));
    expect(money.cash).toBe(r(1140)); // drawer untouched
    expect(money.upi).toBe(r(5635));
  });
});

describe("moneyAtClose", () => {
  it("uses the counted cash and the UPI total typed at close", () => {
    expect(moneyAtClose(r(1150), r(1250), day)).toEqual({
      cash: r(1150),
      upi: r(985), // 1,250 − 265
      upiIsBalance: false,
      total: r(2135),
      pocket: r(90),
    });
  });
});

describe("upiStartFrom", () => {
  it("works back from today's balance to the start of today", () => {
    // The app shows ₹5,935 now; today added 935: the day started with 5,000.
    expect(upiStartFrom(r(5935), r(935))).toBe(r(5000));
  });
});
