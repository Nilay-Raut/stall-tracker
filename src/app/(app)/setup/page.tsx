import { Suspense } from "react";
import { SetupForm, type SetupValues } from "@/components/feature/setup/SetupForm";
import { LogoutButton } from "@/components/feature/LogoutButton";
import { ReminderToggle } from "@/components/feature/ReminderToggle";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { translator } from "@/i18n/translate";
import { businessDate, daysInMonth } from "@/lib/dates";
import { listItems } from "@/server/items";
import { reminderPublicKey } from "@/server/reminders";
import { getFixedCosts, getOwnShop } from "@/server/queries/shop";

export const metadata = { title: "Settings" };

/** First-run setup, and later the Settings screen (same form). */
export default function SetupPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-3.5 pb-8">
      <Suspense fallback={<p className="pt-8 text-center text-muted">…</p>}>
        <SetupContent />
      </Suspense>
    </main>
  );
}

const paiseToInput = (paise: number) => (paise ? String(paise / 100) : "");

async function SetupContent() {
  const shop = await getOwnShop(); // also sends logged-out visitors to /login
  const t = translator(shop?.language ?? "en");
  const [costs, items] = shop
    ? await Promise.all([getFixedCosts(shop.id), listItems(shop.id)])
    : [[], null];

  const initial: SetupValues = shop
    ? {
        name: shop.name,
        language: shop.language,
        closingTime: shop.closingTime.slice(0, 5), // "22:00:00" -> "22:00"
        openingCash: paiseToInput(shop.defaultOpeningCash),
        salesMode: shop.salesMode,
        costs: costs.map((c) => ({ name: c.name, amount: paiseToInput(c.monthlyAmount) })),
      }
    : {
        name: "",
        language: "en",
        closingTime: "22:00",
        openingCash: "",
        salesMode: "totals_items",
        costs: [],
      };

  return (
    <>
      {shop ? (
        <ScreenHeader title={t("Settings")} back={{ href: "/", label: t("Today") }} />
      ) : (
        <header className="flex flex-col gap-1 pt-2">
          <h1 className="font-display text-2xl font-bold">{t("Set up your shop")}</h1>
          <p className="text-sm text-muted">{t("One time only. You can change it later.")}</p>
        </header>
      )}

      {/* Next keeps a visited page mounted (hidden) and React resets a form after
          its action runs. Keying on the last save remounts the form with fresh
          values whenever the shop changes, so it never shows stale or blank fields. */}
      <SetupForm
        key={shop?.updatedAt.toISOString() ?? "new"}
        initial={initial}
        isFirstSetup={!shop}
        daysInMonth={daysInMonth(businessDate())}
        itemCount={items ? items.length : null}
      />

      {shop && (
        <ReminderToggle
          publicKey={reminderPublicKey()}
          closingTime={formatClosing(shop.closingTime)}
        />
      )}

      <LogoutButton />
    </>
  );
}

/** "22:00:00" -> "10:00 pm" */
function formatClosing(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
