import { Suspense } from "react";
import { AppearanceForm } from "@/components/feature/settings/AppearanceForm";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { translator } from "@/i18n/translate";
import { logoVersion } from "@/server/brand";
import { requireShop } from "@/server/queries/shop";

export const metadata = { title: "Appearance" };

/** Settings > Appearance (docs/PLAN-v2.md, Phase 2). */
export default function AppearancePage() {
  return (
    <Suspense fallback={<p className="pt-8 text-center text-muted">…</p>}>
      <AppearanceContent />
    </Suspense>
  );
}

async function AppearanceContent() {
  const shop = await requireShop();
  const t = translator(shop.language);
  const version = await logoVersion(shop.id);
  return (
    <>
      <ScreenHeader title={t("Appearance")} back={{ href: "/settings", label: t("Settings") }} />
      <AppearanceForm shopName={shop.name} savedAccent={shop.accentColor} logoVersion={version} />
    </>
  );
}
