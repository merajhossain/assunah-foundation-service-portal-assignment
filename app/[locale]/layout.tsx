import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { notFound } from "next/navigation";
import { DbConnectionToast } from "@/components/DbConnectionToast";
import { checkDbConnection } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { Providers } from "@/providers/Providers";
import "../globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Assunnah Foundation",
    template: "%s | Assunnah Foundation",
  },
  description:
    "Assunnah Foundation service portal — community services, support, and resources.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const dbStatus = await checkDbConnection();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${sourceSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <DbConnectionToast error={dbStatus.message} />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
