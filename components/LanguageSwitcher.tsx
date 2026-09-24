"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className={
        className ??
        "absolute right-4 top-4 flex gap-1 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-sm"
      }
    >
      {routing.locales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => router.replace(pathname, { locale: item })}
          aria-pressed={locale === item}
          lang={item}
          className={`rounded px-2.5 py-1 font-medium ${
            locale === item
              ? "bg-brand text-white"
              : "text-ink hover:bg-gray-100"
          }`}
        >
          {item === "en" ? t("english") : t("bangla")}
        </button>
      ))}
    </div>
  );
}
