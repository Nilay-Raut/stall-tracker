"use client";

import { AppLink } from "@/components/ui/AppLink";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { msg } from "@/i18n/translate";
import { useT } from "@/i18n/client";

const tabs = [
  { href: "/", label: msg("Today") },
  { href: "/calendar", label: msg("Calendar") },
  { href: "/reports", label: msg("Reports") },
  { href: "/target", label: msg("Target") },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      aria-label={t("Main")}
      className="sticky bottom-0 grid grid-cols-4 border-t-[1.5px] border-ink bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <AppLink
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-16 items-center justify-center border-t-[3px] text-[13px]",
              active
                ? "border-accent font-bold text-ink"
                : "border-transparent font-medium text-muted",
            )}
          >
            {t(tab.label)}
          </AppLink>
        );
      })}
    </nav>
  );
}
