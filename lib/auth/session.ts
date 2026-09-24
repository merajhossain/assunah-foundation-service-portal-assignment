import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { parseAccessActor, type AccessActor } from "./access";

/** Resolves the session once per server request, shared by layouts and pages. */
export const getSession = cache(async () => auth());

export const getActor = cache(async (): Promise<AccessActor | null> => {
  const session = await getSession();
  return session?.user ? parseAccessActor(session.user) : null;
});

export async function requireActor(locale: string): Promise<AccessActor> {
  const actor = await getActor();
  if (!actor) {
    redirect({ href: "/login", locale });
    throw new Error("Unauthenticated");
  }
  return actor;
}
