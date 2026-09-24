import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface p-4">
      <LanguageSwitcher />
      {children}
    </div>
  );
}
