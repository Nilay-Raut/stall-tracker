"use client";

import { CalendarDays, ChartColumn, House, type LucideIcon, Plus, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { AddSheet } from "@/components/feature/AddSheet";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { AppLink } from "./AppLink";

type Tab = { href: string; label: string; icon: LucideIcon; also?: string[] };

const LEFT: Tab[] = [
  { href: "/", label: msg("Today"), icon: House },
  { href: "/calendar", label: msg("Calendar"), icon: CalendarDays },
];
const RIGHT: Tab[] = [
  { href: "/reports", label: msg("Reports"), icon: ChartColumn },
  // Shop details (/setup) and the Items screens belong to Settings too.
  { href: "/settings", label: msg("Settings"), icon: Settings, also: ["/setup"] },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.href === "/") return pathname === "/";
  return [tab.href, ...(tab.also ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/** Floating glass tab bar with the big + in the middle (opens Sale / Expense / Cash out). */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const sheet = useRef<HTMLDialogElement>(null);

  const link = (tab: Tab) => {
    const active = isActive(pathname, tab);
    const Icon = tab.icon;
    return (
      <AppLink
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-14 press flex-col items-center justify-center gap-0.5 rounded-full text-[11px]",
          active ? "font-bold text-accent-fg" : "font-medium text-muted",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
            active && "bg-accent-soft",
          )}
        >
          <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
        </span>
        {t(tab.label)}
      </AppLink>
    );
  };

  return (
    <>
      <nav
        aria-label={t("Main")}
        className="sticky bottom-0 z-30 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] print:hidden"
      >
        <div className="grid grid-cols-5 items-center rounded-pill glass px-1.5 py-1">
          {LEFT.map(link)}
          <div className="flex justify-center">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={t("Add an entry")}
              onClick={() => sheet.current?.showModal()}
              className="-mt-7 flex size-15 press items-center justify-center rounded-full bg-accent bg-[linear-gradient(160deg,rgb(255_255_255/0.28),transparent_60%)] text-accent-ink shadow-lift ring-4 ring-canvas"
            >
              <Plus size={28} strokeWidth={2.6} aria-hidden />
            </button>
          </div>
          {RIGHT.map(link)}
        </div>
      </nav>
      <AddSheet ref={sheet} />
    </>
  );
}
