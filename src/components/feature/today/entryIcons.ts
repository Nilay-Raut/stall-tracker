import type { EntryType } from "@/domain/entry";

/*
 * Entry-list icons as CSS masks (data-URI SVG), so each row costs no SVG elements.
 * An inline <svg> per row added ~20 DOM nodes per entry (most of them Chrome-internal),
 * which a long day's list of entries pays for on cheap phones (e2e/memory.spec.ts).
 *
 * Shapes from Lucide (ISC licence, https://lucide.dev): receipt-indian-rupee,
 * arrow-up-right, hand-coins, landmark, calendar-check. Regenerate from node_modules/lucide-react if they change.
 */
export const ENTRY_ICON_MASKS: Record<EntryType, string> = {
  sale: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z'/%3E%3Cpath d='M8 11h8'/%3E%3Cpath d='M8 7h8'/%3E%3Cpath d='M9 7a4 4 0 0 1 0 8H8l3 2'/%3E%3C/svg%3E\")",
  expense:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7 7h10v10'/%3E%3Cpath d='M7 17 17 7'/%3E%3C/svg%3E\")",
  cash_out:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17'/%3E%3Cpath d='m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9'/%3E%3Cpath d='m2 16 6 6'/%3E%3Ccircle cx='16' cy='9' r='2.9'/%3E%3Ccircle cx='6' cy='5' r='3'/%3E%3C/svg%3E\")",
  deposit:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 18v-7'/%3E%3Cpath d='M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z'/%3E%3Cpath d='M14 18v-7'/%3E%3Cpath d='M18 18v-7'/%3E%3Cpath d='M3 22h18'/%3E%3Cpath d='M6 18v-7'/%3E%3C/svg%3E\")",
  fixed_paid:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 2v3'/%3E%3Cpath d='M16 2v3'/%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 9h18'/%3E%3Cpath d='m9 15 2 2 4-4'/%3E%3C/svg%3E\")",
};
