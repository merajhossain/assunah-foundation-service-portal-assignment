import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { hashPasswordForStorage } from "./password";

const globalForPrisma = globalThis as unknown as {
  assunnahPrisma?: PrismaClient;
  assunnahDatabaseUrl?: string;
};

async function hashPasswordField(
  value: string | Prisma.StringFieldUpdateOperationsInput,
) {
  if (typeof value === "string") {
    return hashPasswordForStorage(value);
  }

  if (typeof value.set === "string") {
    return { ...value, set: await hashPasswordForStorage(value.set) };
  }

  return value;
}

function createClient(databaseUrl: string) {
  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  }).$extends({
    query: {
      user: {
        async create({ args, query }) {
          args.data.passwordHash = await hashPasswordForStorage(
            args.data.passwordHash,
          );
          return query(args);
        },
        async createMany({ args, query }) {
          const rows = Array.isArray(args.data) ? args.data : [args.data];
          args.data = await Promise.all(
            rows.map(async (row) => ({
              ...row,
              passwordHash: await hashPasswordForStorage(row.passwordHash),
            })),
          );
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.passwordHash != null) {
            args.data.passwordHash = await hashPasswordField(
              args.data.passwordHash,
            );
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (args.data.passwordHash != null) {
            args.data.passwordHash = await hashPasswordField(
              args.data.passwordHash,
            );
          }
          return query(args);
        },
        async upsert({ args, query }) {
          args.create.passwordHash = await hashPasswordForStorage(
            args.create.passwordHash,
          );
          if (args.update.passwordHash != null) {
            args.update.passwordHash = await hashPasswordField(
              args.update.passwordHash,
            );
          }
          return query(args);
        },
      },
    },
  });
}

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Recreate client when DATABASE_URL changes (HMR / .env reload)
  if (
    !globalForPrisma.assunnahPrisma ||
    globalForPrisma.assunnahDatabaseUrl !== databaseUrl
  ) {
    globalForPrisma.assunnahPrisma = createClient(databaseUrl) as PrismaClient;
    globalForPrisma.assunnahDatabaseUrl = databaseUrl;
  }

  return globalForPrisma.assunnahPrisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

const DB_UNREACHABLE = "Unable to reach MySQL. Check DATABASE_URL.";

export async function checkDbConnection() {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const query = getClient()
    .$queryRaw`SELECT 1`
    .then(
      () => "ok" as const,
      (error: unknown) => {
        const detail = error instanceof Error ? error.message : "connection failed";
        console.warn(`[db] Connection check failed: ${detail}`);
        return "failed" as const;
      },
    );

  try {
    const result = await Promise.race([
      query,
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), 3000);
      }),
    ]);

    if (result === "ok") {
      return { ok: true as const, message: null };
    }

    if (result === "timeout") {
      console.warn("[db] Connection check timed out.");
    }

    return { ok: false as const, message: DB_UNREACHABLE };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
