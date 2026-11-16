import type { ReactNode } from "react";

/** Yellow notice box: "₹50 more cash than you recorded", "Oil is up ₹9 a litre" ... */
export function Notice({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-0.5 rounded-control bg-warn-bg px-2.5 py-2 text-warn-ink"
    >
      <span className="text-sm font-bold">{title}</span>
      {children && <span className="text-xs">{children}</span>}
    </div>
  );
}
