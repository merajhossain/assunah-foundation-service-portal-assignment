import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { requireActor } from "@/lib/auth/session";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireActor(locale);
  const t = await getTranslations("Dashboard");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-8xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Logo className="h-8 w-auto sm:h-10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="flex gap-1 rounded-md border border-gray-200 bg-white p-1 text-sm" />
            <SignOutButton label={t("signOut")} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-8xl px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
