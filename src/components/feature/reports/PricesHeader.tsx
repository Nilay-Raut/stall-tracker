import { msg } from "@/i18n/translate";
import { SubHeader } from "./SubHeader";

/** Header of Supplier prices. */
export function PricesHeader() {
  return <SubHeader title={msg("Supplier prices")} />;
}
