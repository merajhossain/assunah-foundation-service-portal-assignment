import bcrypt from "bcryptjs";

/** Laravel's default bcrypt cost (`BCRYPT_ROUNDS`). */
const BCRYPT_ROUNDS = 12;

/** Laravel `Hash::make()` stores a 60-character `$2y$` bcrypt hash. */
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isPasswordHash(value: string) {
  return BCRYPT_HASH.test(value);
}

/**
 * Hash a plain password the way Laravel's `Hash::make()` does.
 * The value written to `password_hash` looks like `$2y$12$...`.
 */
export async function hashPassword(plain: string) {
  const hash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
  return hash.replace(/^\$2[ab]\$/, "$2y$");
}

/** Check a plain password against a hash stored by this app or by Laravel. */
export async function verifyPassword(plain: string, stored: string) {
  if (!stored) {
    return false;
  }

  return bcrypt.compare(plain, stored);
}

/** Leave an existing bcrypt hash unchanged. Hash plain text before it is stored. */
export async function hashPasswordForStorage(value: string) {
  if (isPasswordHash(value)) {
    return value.replace(/^\$2[ab]\$/, "$2y$");
  }

  return hashPassword(value);
}
