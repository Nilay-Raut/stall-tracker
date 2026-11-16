import { describe, expect, it } from "vitest";
import { rupeesCell, toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header and rows, quoting where needed", () => {
    const csv = toCsv(
      ["Date", "Note"],
      [
        ["2026-11-13", 'Raju, "big" order'],
        ["2026-11-14", null],
      ],
    );
    expect(csv).toBe('\uFEFFDate,Note\r\n2026-11-13,"Raju, ""big"" order"\r\n2026-11-14,\r\n');
  });

  it("stops text from running as a spreadsheet formula, but keeps numbers", () => {
    const csv = toCsv(["A", "B", "C"], [["=HYPERLINK(1)", "-5", -5]]);
    expect(csv.split("\r\n")[1]).toBe("'=HYPERLINK(1),'-5,-5");
  });

  it("writes rupees from paise", () => {
    expect(rupeesCell(12550)).toBe(125.5);
  });
});
