import type { ReactNode } from "react";
import { SyncRunner } from "@/components/feature/SyncRunner";

/** Every screen of the logged-in app. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SyncRunner />
      {children}
    </>
  );
}
