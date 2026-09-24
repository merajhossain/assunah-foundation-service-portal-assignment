"use client";

import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";

export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
      className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-gray-100"
    >
      {label}
    </button>
  );
}
