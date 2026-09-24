import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

type StatusScreenProps = {
  code?: string;
  title: string;
  description: string;
  leading?: React.ReactNode;
  children?: React.ReactNode;
};

export function StatusScreen({
  code,
  title,
  description,
  leading,
  children,
}: StatusScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface p-4">
      <LanguageSwitcher />
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm md:px-10">
        <Logo className="mx-auto mb-5 h-12 w-auto" />
        {leading}
        {code ? (
          <p className="font-display text-5xl font-semibold tracking-tight text-brand">
            {code}
          </p>
        ) : null}
        <h1
          className={`text-2xl font-bold ${code ? "mt-2 text-ink" : "text-brand"}`}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted">{description}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </div>
  );
}
