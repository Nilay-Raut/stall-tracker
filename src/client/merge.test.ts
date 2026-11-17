import { describe, expect, it } from "vitest";
import type { Entry } from "@/domain/entry";
import { mergeDay } from "./merge";

const e = (
  id: string,
  amount = 100,
  updatedAt = "2026-11-13T10:00:00.000Z",
  deleted = false,
): Entry => ({
  id,
  businessDate: "2026-11-13",
  type: "sale",
  amount,
  paymentMode: "cash",
  category: null,
  paidFrom: null,
  purchase: null,
  lines: null,
  occurredAt: "2026-11-13T10:00:00.000Z",
  updatedAt,
  deleted,
});

const ids = (entries: Entry[]) => entries.map((x) => [x.id, x.amount, x.deleted]);

describe("mergeDay", () => {
  it("takes server entries the phone does not have, or has an older copy of", () => {
    const local = [e("a", 100, "2026-11-13T10:00:00.000Z")];
    const server = [e("a", 999, "2026-11-13T11:00:00.000Z"), e("b")];
    expect(ids(mergeDay(local, server, new Set()))).toEqual([
      ["a", 999, false],
      ["b", 100, false],
    ]);
  });

  it("keeps changes that are still waiting to be sent", () => {
    const result = mergeDay([e("a", 500)], [e("a", 100)], new Set(["a"]));
    expect(result).toEqual([]);
  });

  it("never drops an entry just because the server's list lacks it", () => {
    // The server read its list a moment before this entry arrived: nothing to do.
    expect(mergeDay([e("just-sent")], [], new Set())).toEqual([]);
  });

  it("applies deletions made on another phone", () => {
    const local = [e("gone", 100, "2026-11-13T10:00:00.000Z")];
    const server = [e("gone", 100, "2026-11-13T12:00:00.000Z", true)];
    expect(ids(mergeDay(local, server, new Set()))).toEqual([["gone", 100, true]]);
  });

  it("does not overwrite a newer copy on the phone with an older one", () => {
    const local = [e("a", 300, "2026-11-13T12:00:00.000Z")];
    const server = [e("a", 100, "2026-11-13T10:00:00.000Z")];
    expect(mergeDay(local, server, new Set())).toEqual([]);
  });
});
