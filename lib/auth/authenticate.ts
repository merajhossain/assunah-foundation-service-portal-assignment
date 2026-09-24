import { throwIfAborted } from "@/lib/api";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function authenticateUser(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<AuthenticatedUser | null> {
  throwIfAborted(signal);

  const user = await db.user.findUnique({
    where: { email },
    include: { role: true },
  });

  throwIfAborted(signal);

  if (!user) {
    // Keep timing closer to a real password check.
    await verifyPassword(
      password,
      "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    );
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  throwIfAborted(signal);

  if (!valid) {
    return null;
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role.name,
  };
}
