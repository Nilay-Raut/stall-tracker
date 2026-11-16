import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  /** Shown on the right: a date, "November", a button. */
  aside?: ReactNode;
  /** Back link for screens outside the tabs: "‹ Today", "‹ Items". */
  back?: { href: string; label: string };
};

export function ScreenHeader({ title, aside, back }: Props) {
  return (
    <header className="flex min-h-12 items-center justify-between gap-3">
      {back && (
        <Link href={back.href} className="flex min-h-11 items-center text-[15px] font-semibold">
          ‹ {back.label}
        </Link>
      )}
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {aside && <div className="text-[13px] text-muted">{aside}</div>}
    </header>
  );
}
