import type { Entry } from "@/domain/entry";

/**
 * Combines one day's entries from the server with what the phone has.
 *
 * The server sends deleted entries too (marked deleted), so an entry missing
 * from its list only means "not on the server yet" (for example, sent a moment
 * after the server read its list). Missing entries are therefore never removed.
 *
 * Rules: a change still waiting to be sent always wins (it is newer);
 * otherwise the newer version wins, by the time it was last changed.
 */
export function mergeDay(
  local: ReadonlyArray<Entry>,
  server: ReadonlyArray<Entry>,
  pendingIds: ReadonlySet<string>,
): Entry[] {
  const localById = new Map(local.map((e) => [e.id, e]));
  return server.filter((incoming) => {
    if (pendingIds.has(incoming.id)) return false;
    const mine = localById.get(incoming.id);
    return !mine || incoming.updatedAt >= mine.updatedAt;
  });
}
