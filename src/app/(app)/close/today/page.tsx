import { CloseTodayScreen } from "@/components/feature/close/CloseTodayScreen";

export const metadata = { title: "Close day" };

/** Close day for today: static, works from the phone's own data, also offline. */
export default function CloseTodayPage() {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-6">
      <CloseTodayScreen />
    </main>
  );
}
