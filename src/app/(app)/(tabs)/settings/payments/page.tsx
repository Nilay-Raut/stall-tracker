import { ChevronRight, Smartphone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { translator } from "@/i18n/translate";
import { isConnected, listConnections } from "@/server/payments/connections";
import { PROVIDERS } from "@/server/payments/providers";
import { paymentsAvailable } from "@/server/payments/secretBox";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "UPI payments" };

/** Settings > UPI payments: every provider the app can connect (Phase 12). */
export default function PaymentsPage() {
  return (
    <Suspense fallback={<p className="pt-8 text-center text-muted">…</p>}>
      <PaymentsContent />
    </Suspense>
  );
}

async function PaymentsContent() {
  const shop = await requireShop();
  const t = translator(shop.language);
  const connections = paymentsAvailable() ? await listConnections(shop.id) : [];

  return (
    <>
      <ScreenHeader title={t("UPI payments")} back={{ href: "/settings", label: t("Settings") }} />
      <p className="px-1 text-sm text-muted">
        {t(
          "Connect your payment app and each UPI payment to your shop's QR is added as a sale by itself.",
        )}
      </p>
      <ul className="flex flex-col overflow-hidden rounded-card glass-soft">
        {PROVIDERS.map((provider) => {
          const connection = connections.find((c) => c.provider === provider.id) ?? null;
          const status = isConnected(connection)
            ? t("Connected")
            : connection
              ? t("Waiting for your details")
              : t("Not connected");
          return (
            <li key={provider.id} className="border-t border-line first:border-t-0">
              <Link
                href={`/settings/payments/${provider.id}`}
                className="flex min-h-16 press items-center gap-3 px-4 py-2.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
                  <Smartphone size={20} aria-hidden />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-bold">{provider.name}</span>
                  <span className="text-xs text-muted">{status}</span>
                </span>
                <ChevronRight size={20} aria-hidden className="text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="px-1 text-xs text-muted">{t("More payment apps can be added later.")}</p>
    </>
  );
}
