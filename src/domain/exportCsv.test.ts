import { describe, expect, it } from "vitest";
import { rupeesToPaise as r } from "@/lib/money";
import { daysCsv, entriesCsv } from "./exportCsv";
import type { ReportDay } from "./report";

const day = (date: string, status: ReportDay["status"], sales: number): ReportDay => ({
  date,
  status,
  sales: r(sales),
  cashSales: r(sales),
  upiSales: 0,
  expenses: r(200),
  fixedCost: r(750),
  cashOut: r(100),
});

describe("daysCsv", () => {
  it("has one row per day and a total row that matches", () => {
    const csv = daysCsv([day("2026-11-13", "closed", 5580), day("2026-11-14", "off", 0)]);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines).toEqual([
      "Date,Status,Sales,Cash sales,UPI sales,Expenses,Fixed costs,Profit,Cash taken out",
      "2026-11-13,Day closed,5580,5580,0,200,750,4630,100",
      "2026-11-14,Shop closed,0,0,0,200,750,-950,100",
      "Total,,5580,5580,0,400,1500,3680,200",
    ]);
  });
});

describe("entriesCsv", () => {
  it("writes entries with labels and keeps typed names safe", () => {
    const csv = entriesCsv([
      {
        date: "2026-11-13",
        time: new Date("2026-11-13T15:55:00Z"),
        type: "expense",
        amount: r(480),
        paymentMode: null,
        category: "raw_material",
        paidFrom: "drawer",
        material: "Paneer",
        quantity: 2,
        unit: "kg",
        supplier: "=Raju",
      },
    ]);
    expect(csv.split("\r\n")[1]).toBe(
      "2026-11-13,9:25 pm,Expense,480,,Raw material,Drawer,Paneer,2,kg,'=Raju,",
    );
  });

  it("adds the note of an Other expense", () => {
    const csv = entriesCsv([
      {
        date: "2026-11-13",
        time: new Date("2026-11-13T15:55:00Z"),
        type: "expense",
        amount: r(60),
        paymentMode: null,
        category: "other",
        paidFrom: "drawer",
        note: "Ice",
        material: null,
        quantity: null,
        unit: null,
        supplier: null,
      },
    ]);
    expect(csv.split("\r\n")[1]).toBe("2026-11-13,9:25 pm,Expense,60,,Other,Drawer,,,,,Ice");
  });
});
