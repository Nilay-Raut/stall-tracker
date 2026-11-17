import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { getCurrentUser } from "@/server/auth/currentUser";

/** Login, register and forgot password. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col gap-5 px-5 pt-10 pb-8">
      <span className="font-display text-lg font-bold text-accent-fg">Stall Tracker</span>
      {children}
      {/* The forms render straight away; this check streams in after. */}
      <Suspense fallback={null}>
        <RedirectIfLoggedIn />
      </Suspense>
    </main>
  );
}

async function RedirectIfLoggedIn() {
  if (await getCurrentUser()) redirect("/");
  return null;
}
