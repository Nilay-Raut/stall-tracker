"use client";

import { Check, ImageUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  keepLogo,
  previewAccent,
  setLocalAccent,
  setLocalLogo,
  syncLogo,
  useBrand,
} from "@/client/brand";
import { prepareLogo } from "@/client/logoImage";
import { ShopMark } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormError";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { ACCENT_PRESETS, DEFAULT_ACCENT, accentProblem, normalizeHex } from "@/domain/brand";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { saveAccent } from "@/server/actions/appearance";

const PRESET_LABELS: Record<string, string> = {
  Green: msg("Green"),
  Teal: msg("Teal"),
  Blue: msg("Blue"),
  Indigo: msg("Indigo"),
  Purple: msg("Purple"),
  Pink: msg("Pink"),
  Red: msg("Red"),
  Orange: msg("Orange"),
};

const LOGO_ERRORS: Record<string, string> = {
  "too-big": msg("That picture is too detailed to shrink. Try a simpler one."),
  "not-an-image": msg("Pick a PNG, JPG or WebP picture."),
  unauthenticated: msg("Logged out. Log in again to change the logo."),
};

type Props = { shopName: string; savedAccent: string | null; logoVersion: number | null };

/** Settings > Appearance: brand colour, logo, light / dark. */
export function AppearanceForm({ shopName, savedAccent, logoVersion }: Props) {
  const t = useT();
  const router = useRouter();
  const brand = useBrand();
  const saved = savedAccent ?? DEFAULT_ACCENT;
  const [picked, setPicked] = useState(saved);
  const [colourError, setColourError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savingColour, startColour] = useTransition();
  const [savingLogo, startLogo] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const problem = accentProblem(picked);
  const changed = picked !== saved;

  // Show the picked colour everywhere while choosing; put the saved one back on leaving.
  useEffect(() => {
    previewAccent(problem ? null : picked);
  }, [picked, problem]);
  useEffect(() => () => previewAccent(null), []);
  // A phone that has not seen the logo yet (or an old one) fetches it now.
  useEffect(() => {
    syncLogo(logoVersion).catch(() => {});
  }, [logoVersion]);

  const choose = (hex: string) => {
    setNotice(null);
    setColourError(null);
    setPicked(normalizeHex(hex) ?? picked);
  };

  const saveColour = () =>
    startColour(async () => {
      const result = await saveAccent(picked === DEFAULT_ACCENT ? null : picked);
      if (!result.ok) return setColourError(result.error);
      setLocalAccent(result.accent);
      setNotice(t("Colour saved."));
      router.refresh();
    });

  const uploadLogo = (file: File) =>
    startLogo(async () => {
      setLogoError(null);
      setNotice(null);
      const prepared = await prepareLogo(file);
      if (!prepared.ok) return setLogoError(prepared.error);
      try {
        const response = await fetch("/api/logo", {
          method: "PUT",
          headers: { "Content-Type": prepared.blob.type },
          body: prepared.blob,
        });
        const body = (await response.json()) as { version?: number; error?: string };
        if (!response.ok || typeof body.version !== "number") {
          return setLogoError(
            LOGO_ERRORS[body.error ?? ""] ?? msg("The logo could not be saved. Try again."),
          );
        }
        await keepLogo(body.version, prepared.blob);
        setNotice(t("Logo saved."));
        router.refresh();
      } catch {
        setLogoError(msg("No internet. Connect and try again."));
      }
    });

  const removeLogo = () =>
    startLogo(async () => {
      setLogoError(null);
      try {
        const response = await fetch("/api/logo", { method: "DELETE" });
        if (!response.ok) return setLogoError(msg("The logo could not be saved. Try again."));
        setLocalLogo(null);
        setNotice(t("Logo removed."));
        router.refresh();
      } catch {
        setLogoError(msg("No internet. Connect and try again."));
      }
    });

  const showsLogo = brand.logo !== null || logoVersion !== null;

  return (
    <>
      {/* Live preview with the picked colour. */}
      <Card tone="muted" className="gap-3 px-5 py-4" aria-label={t("Preview")}>
        <div className="flex items-center gap-3">
          <ShopMark name={shopName} size={44} />
          <span className="truncate font-display text-lg font-bold">{shopName}</span>
        </div>
        <ProgressBar value={0.62} label={t("Preview")} />
        <div className="grid grid-cols-2 gap-2">
          <span className="flex min-h-11 items-center justify-center rounded-cta bg-accent text-sm font-bold text-accent-ink">
            {t("+ Sale")}
          </span>
          <span className="flex min-h-11 items-center justify-center rounded-cta bg-accent-soft text-sm font-bold text-ink">
            {t("Today")}
          </span>
        </div>
      </Card>

      <Card className="gap-3">
        <h2 className="text-sm font-bold">{t("Brand colour")}</h2>
        <div role="radiogroup" aria-label={t("Brand colour")} className="grid grid-cols-4 gap-3">
          {ACCENT_PRESETS.map((preset) => {
            const on = picked === preset.hex;
            return (
              <button
                key={preset.hex}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={t(PRESET_LABELS[preset.name])}
                onClick={() => choose(preset.hex)}
                className={cn(
                  "flex aspect-square press items-center justify-center rounded-full text-white",
                  on && "ring-[3px] ring-ink ring-offset-2 ring-offset-canvas",
                )}
                style={{ background: preset.hex }}
              >
                {on && <Check size={22} strokeWidth={3} aria-hidden />}
              </button>
            );
          })}
        </div>
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-control border border-edge bg-field px-3">
          <span className="text-sm font-semibold">{t("Own colour")}</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            {picked.toUpperCase()}
            <input
              type="color"
              value={picked}
              onChange={(e) => choose(e.target.value)}
              aria-label={t("Own colour")}
              className="size-9 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
          </span>
        </label>
        {problem === "too-light" && (
          <p className="text-xs font-semibold text-danger" role="alert">
            {t("This colour is too light to read. Pick a darker one.")}
          </p>
        )}
        <FormError message={colourError ?? undefined} />
        <Button disabled={!changed || !!problem || savingColour} onClick={saveColour}>
          {savingColour ? t("Saving…") : t("Save colour")}
        </Button>
      </Card>

      <Card className="gap-3">
        <h2 className="text-sm font-bold">{t("Logo")}</h2>
        <div className="flex items-center gap-4">
          <ShopMark name={shopName} size={72} />
          <p className="text-xs text-muted">
            {t("PNG, JPG or WebP, up to 2 MB. It is cut to a square and made small.")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label
            className={cn(
              "flex min-h-12 press cursor-pointer items-center justify-center gap-2 rounded-control glass-soft text-[15px] font-semibold",
              savingLogo && "pointer-events-none opacity-40",
            )}
          >
            <ImageUp size={18} aria-hidden />
            {showsLogo ? t("Change logo") : t("Add logo")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={savingLogo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ""; // picking the same file again still works
                if (file) uploadLogo(file);
              }}
            />
          </label>
          <Button variant="outline" disabled={!showsLogo || savingLogo} onClick={removeLogo}>
            <Trash2 size={18} aria-hidden />
            {t("Remove")}
          </Button>
        </div>
        {savingLogo && (
          <p className="text-xs text-muted" aria-live="polite">
            {t("Saving…")}
          </p>
        )}
        <FormError message={logoError ?? undefined} />
      </Card>

      <Card>
        <h2 className="text-sm font-bold">{t("Light or dark")}</h2>
        <ThemeSwitch />
      </Card>

      {notice && (
        <p role="status" className="text-center text-sm font-semibold text-accent-fg">
          {notice}
        </p>
      )}
    </>
  );
}
