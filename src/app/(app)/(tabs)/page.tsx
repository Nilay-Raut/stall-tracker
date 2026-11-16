import { Suspense } from "react";
import { TodaySnapshot } from "@/components/feature/today/TodaySnapshot";
import { TodayView } from "@/components/feature/today/TodayView";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <>
      {/* Static: shows straight away from the phone's storage, also offline. */}
      <TodayView />
      {/* Dynamic: brings the server's latest data when online. */}
      <Suspense fallback={null}>
        <TodaySnapshot />
      </Suspense>
    </>
  );
}
