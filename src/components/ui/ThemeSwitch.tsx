"use client";

import { Moon, Sun } from "lucide-react";
import { type TextSize, setTextSize, useTextSize } from "@/client/textSize";
import { type ThemeChoice, setTheme, useTheme } from "@/client/theme";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { ChoiceGroup } from "./ChoiceGroup";

const CHOICES = [
  { value: "system", label: msg("Same as phone") },
  { value: "light", label: msg("Light") },
  { value: "dark", label: msg("Dark") },
] as const;

/** Settings: System / Light / Dark. Saved on this phone only. */
export function ThemeSwitch() {
  const t = useT();
  const theme = useTheme();
  return (
    <ChoiceGroup<ThemeChoice>
      label={t("Theme (this phone)")}
      choices={CHOICES.map((c) => ({ value: c.value, label: t(c.label) }))}
      value={theme?.choice ?? "system"}
      onChange={setTheme}
    />
  );
}

const SIZES = [
  { value: "normal", label: msg("Normal") },
  { value: "large", label: msg("Large") },
  { value: "xl", label: msg("Extra large") },
] as const;

/** Settings: Normal / Large / Extra large text, for reading in bright sun. This phone only. */
export function TextSizeSwitch() {
  const t = useT();
  const size = useTextSize();
  return (
    <ChoiceGroup<TextSize>
      label={t("Text size (this phone)")}
      choices={SIZES.map((c) => ({ value: c.value, label: t(c.label) }))}
      value={size ?? "normal"}
      onChange={setTextSize}
    />
  );
}

/** App bar: one tap flips between light and dark. */
export function ThemeToggle() {
  const t = useT();
  const theme = useTheme();
  const dark = theme?.resolved === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? t("Switch to light theme") : t("Switch to dark theme")}
      className="flex size-10 press items-center justify-center rounded-full glass-soft text-ink"
    >
      {/* Before the browser says which theme is showing, draw nothing (no wrong icon flash). */}
      {theme && (dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />)}
    </button>
  );
}
