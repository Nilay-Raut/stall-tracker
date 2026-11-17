"use client";

import { useBrand } from "@/client/brand";
import { useShopSnapshot } from "@/client/localStore";
import { ThemeToggle } from "./ThemeSwitch";

/**
 * Sticky glass bar on the tab screens: shop logo and name, theme toggle.
 * Reads the shop from the phone's storage, so it shows offline too.
 */
export function AppBar() {
  const snapshot = useShopSnapshot();
  const name = snapshot?.shopName ?? "";

  return (
    <div className="sticky top-0 z-30 px-3 pt-[max(8px,env(safe-area-inset-top))]">
      <div className="flex h-14 items-center justify-between gap-3 rounded-pill glass pr-2 pl-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ShopMark name={name} />
          <span className="truncate font-display text-[17px] font-bold">
            {name || (
              <span className="inline-block h-4 w-28 rounded-full bg-surface align-middle" />
            )}
          </span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

/** The shop's logo, or its first letter on the brand colour. */
export function ShopMark({ name, size = 40 }: { name: string; size?: number }) {
  const { logo } = useBrand();
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  if (logo) {
    return (
      // A data: URL from this phone's storage; next/image adds nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full bg-field object-cover ring-1 ring-glass-edge"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-bold text-accent-ink shadow-lift"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}
