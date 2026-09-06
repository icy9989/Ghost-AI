import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    // Expose the shared CRUD API; Accelerate's extra generic signatures otherwise
    // form an uncallable union with the direct client's read methods.
    return new PrismaClient({ accelerateUrl: databaseUrl }).$extends(
      withAccelerate(),
    ) as unknown as PrismaClient;
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}
