import type { ReactNode } from "react";

/** Yellow notice box: "₹50 more cash than you recorded", "Oil is up ₹9 a litre" ... */
export function Notice({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-0.5 rounded-control border border-warn-ink/15 bg-warn-bg px-3 py-2.5 text-warn-ink"
    >
      <span className="text-sm font-bold">{title}</span>
      {children && <span className="text-xs">{children}</span>}
    </div>
  );
}
