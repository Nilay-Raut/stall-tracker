import { AddScreen } from "@/components/feature/add/AddScreen";

export const metadata = { title: "Pay a fixed cost" };

export default function Page() {
  return <AddScreen type="fixed_paid" />;
}
