/** Fixed zone so server-rendered and hydrated output always match. */
const DISPLAY_TIME_ZONE = "Asia/Dhaka";

export function intlLocale(locale: string) {
  return locale === "bn" ? "bn-BD" : "en-GB";
}

export function formatDateTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}
