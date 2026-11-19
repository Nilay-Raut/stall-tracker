import {
  ChevronRight,
  type LucideIcon,
  Palette,
  Smartphone,
  Store,
  Target,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { InstallHint } from "@/components/feature/InstallHint";
import { LogoutButton } from "@/components/feature/LogoutButton";
import { ReminderToggle } from "@/components/feature/ReminderToggle";
import { SoundToggle } from "@/components/feature/SoundToggle";
import { ShopMark } from "@/components/ui/AppBar";
import { type Translate, translator } from "@/i18n/translate";
import { leftToPay } from "@/domain/fixedPaid";
import { businessDate, formatClock } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { getFixedCostsMonth } from "@/server/fixedPaid";
import { providerName } from "@/lib/paymentProviders";
import { listItems } from "@/server/items";
import { isConnected, listConnections } from "@/server/payments/connections";
import { paymentsAvailable } from "@/server/payments/secretBox";
import { requireShop } from "@/server/queries/shop";
import { reminderPublicKey } from "@/server/reminders";

export const metadata = { title: "Settings" };

/** Settings hub (docs/PLAN-v2.md, Phase 2): shop, items, target, appearance, reminder, log out. */
export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="pt-8 text-center text-muted">…</p>}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const shop = await requireShop();
  const t = translator(shop.language);
  const [items, connections, fixedMonth] = await Promise.all([
    listItems(shop.id),
    paymentsAvailable() ? listConnections(shop.id) : [],
    getFixedCostsMonth(shop.id, businessDate()),
  ]);
  const connectedNames = connections.filter(isConnected).map((c) => providerName(c.provider));
  const activeItems = items.filter((item) => item.active).length;

  return (
    <>
      <header className="flex min-h-12 items-center px-1">
        <h1 className="font-display text-[26px] font-bold">{t("Settings")}</h1>
      </header>

      <Link href="/setup" className="flex press items-center gap-3.5 rounded-card glass px-4 py-4">
        <ShopMark name={shop.name} size={56} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-xl font-bold">{shop.name}</span>
          <span className="text-[13px] text-muted">
            {t("Closes at {time}", { time: formatClock(shop.closingTime) })}
          </span>
        </span>
        <ChevronRight size={20} aria-hidden className="text-muted" />
      </Link>

      <Group title={t("Shop")}>
        <Row
          href="/setup"
          icon={Store}
          title={t("Shop details")}
          note={t("Name, language, closing time, fixed costs")}
        />
        <Row
          href="/settings/items"
          icon={UtensilsCrossed}
          title={t("Items and margins")}
          note={itemsNote(activeItems, t)}
        />
        <Row
          href="/settings/payments"
          icon={Smartphone}
          title={t("UPI payments")}
          note={
            connectedNames.length
              ? t("{names} connected", { names: connectedNames.join(", ") })
              : t("Add UPI payments as sales by themselves")
          }
        />
        <Row
          href="/settings/target"
          icon={Target}
          title={t("Monthly target")}
          note={t("Set a profit goal and track it")}
        />
      </Group>

      {fixedMonth.length > 0 && (
        <Group title={t("Fixed costs this month")}>
          {fixedMonth.map((row) => {
            const left = leftToPay(row);
            return (
              <div
                key={row.name}
                className="flex min-h-14 items-center justify-between gap-3 border-t border-line px-4 py-2 first:border-t-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-bold">{row.name}</span>
                  <span className="text-xs text-muted">
                    {t("{paid} paid of {monthly}", {
                      paid: formatRupees(row.paid),
                      monthly: formatRupees(row.monthly),
                    })}
                  </span>
                </span>
                <span
                  className={
                    left === 0
                      ? "shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-fg"
                      : "shrink-0 rounded-full bg-warn-bg px-3 py-1 text-xs font-bold text-warn-ink"
                  }
                >
                  {left === 0 ? t("Paid") : t("{amount} left", { amount: formatRupees(left) })}
                </span>
              </div>
            );
          })}
          <Link
            href="/add/fixed-cost"
            className="flex min-h-12 press items-center justify-center border-t border-line text-sm font-bold underline"
          >
            {t("Pay a fixed cost")}
          </Link>
        </Group>
      )}

      <Group title={t("App")}>
        <Row
          href="/settings/appearance"
          icon={Palette}
          title={t("Appearance")}
          note={t("Colour, logo and dark mode")}
        />
      </Group>

      <ReminderToggle publicKey={reminderPublicKey()} closingTime={formatClock(shop.closingTime)} />
      <SoundToggle />
      <InstallHint />
      <LogoutButton />
    </>
  );
}

function itemsNote(count: number, t: Translate): string {
  if (count === 0) return t("No items yet");
  return count === 1 ? t("1 item") : t("{n} items", { n: count });
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-1 text-xs font-bold tracking-wide text-muted uppercase">{title}</h2>
      <div className="flex flex-col overflow-hidden rounded-card glass-soft">{children}</div>
    </section>
  );
}

function Row({
  href,
  icon: Icon,
  title,
  note,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 press items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
        <Icon size={20} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-bold">{title}</span>
        <span className="truncate text-xs text-muted">{note}</span>
      </span>
      <ChevronRight size={20} aria-hidden className="text-muted" />
    </Link>
  );
}
