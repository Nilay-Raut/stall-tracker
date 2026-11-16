import { type ReactNode, Suspense } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { requireShop } from "@/server/queries/shop";

/** Screens with the bottom tab bar: Today, Calendar, Reports, Target. */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-5">{children}</main>
      <BottomNav />
      {/* Sends logged-out users to /login and new users to /setup.
          Pages that load shop data also call requireShop() themselves. */}
      <Suspense fallback={null}>
        <RequireShop />
      </Suspense>
    </>
  );
}

async function RequireShop() {
  await requireShop();
  return null;
}
