import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaymentSetup } from "@/components/feature/payments/PaymentSetup";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { translator } from "@/i18n/translate";
import { callbackPath, getConnection, isConnected } from "@/server/payments/connections";
import { PROVIDERS, getProvider } from "@/server/payments/providers";
import { open, paymentsAvailable } from "@/server/payments/secretBox";
import { requireShop } from "@/server/queries/shop";
import { publicOrigin } from "@/server/requestOrigin";

export const metadata = { title: "UPI payments" };

/** One page per known provider, made at build time (unknown ones: notFound below). */
export function generateStaticParams() {
  return PROVIDERS.map((provider) => ({ provider: provider.id }));
}

/** Settings > UPI payments > one provider (Phase 12). */
export default function ProviderPage({ params }: PageProps<"/settings/payments/[provider]">) {
  return (
    <Suspense fallback={<p className="pt-8 text-center text-muted">…</p>}>
      <ProviderContent params={params} />
    </Suspense>
  );
}

async function ProviderContent({
  params,
}: Pick<PageProps<"/settings/payments/[provider]">, "params">) {
  const provider = getProvider((await params).provider);
  if (!provider) notFound();
  const shop = await requireShop();
  const t = translator(shop.language);
  const available = paymentsAvailable();
  const connection = available ? await getConnection(shop.id, provider.id) : null;
  const connected = isConnected(connection);
  // Non-secret saved values go back into the form; secrets never leave the server.
  const saved: Record<string, string> = {};
  if (connection && connected) {
    saved[provider.fields[0].key] = connection.accountId;
    const secrets = JSON.parse(open(connection.secrets)) as Record<string, string>;
    for (const field of provider.fields) {
      if (!field.secret && secrets[field.key] !== undefined) saved[field.key] = secrets[field.key];
    }
  }

  return (
    <>
      <ScreenHeader
        title={provider.name}
        back={{ href: "/settings/payments", label: t("UPI payments") }}
      />
      <PaymentSetup
        provider={{
          id: provider.id,
          name: provider.name,
          askMessage: provider.askMessage,
          fields: provider.fields.map(({ key, label, secret, inputMode }) => ({
            key,
            label,
            secret,
            inputMode,
          })),
        }}
        state={!connection ? "none" : connected ? "connected" : "waiting"}
        callbackUrl={connection ? `${await publicOrigin()}${callbackPath(connection)}` : null}
        saved={saved}
        lastEventAt={connection?.lastEventAt?.toISOString() ?? null}
        lastTestAt={connection?.lastTestAt?.toISOString() ?? null}
        available={available}
      />
    </>
  );
}
