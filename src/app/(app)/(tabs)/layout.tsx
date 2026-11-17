import { type ReactNode, Suspense } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { requireShop } from "@/server/queries/shop";

/** Screens with the app bar and the bottom tab bar: Today, Calendar, Reports, Target. */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar />
      <main className="flex flex-1 flex-col gap-3.5 px-4 pt-3 pb-4">{children}</main>
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
