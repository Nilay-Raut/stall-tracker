import { AddScreen } from "@/components/feature/add/AddScreen";

export const metadata = { title: "Add expense" };

export default function Page() {
  return <AddScreen type="expense" />;
}
