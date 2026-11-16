import { translator } from "@/i18n/translate";
import { type Lang, formatTime } from "@/lib/dates";

/**
 * "Figures as of 9:41 pm": when the server worked these numbers out. A page opened
 * offline from the phone's stored copy shows its real age this way.
 */
export function AsOf({ lang = "en" }: { lang?: Lang }) {
  const t = translator(lang);
  return (
    <p className="-mt-1 text-xs text-muted">
      {t("Figures as of {time}", { time: formatTime(new Date().toISOString(), lang) })}
    </p>
  );
}
