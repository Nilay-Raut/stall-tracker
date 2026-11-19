import { type ReactNode, Suspense } from "react";
import { SyncRunner } from "@/components/feature/SyncRunner";
import { UndoToast } from "@/components/feature/UndoToast";

/** Every screen of the logged-in app. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SyncRunner />
      {children}
      {/* Reads the address (the bar shows only on its own screen): needs a boundary. */}
      <Suspense fallback={null}>
        <UndoToast />
      </Suspense>
    </>
  );
}
