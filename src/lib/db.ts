import "server-only";
import { PrismaClient } from "@prisma/client";
import { appDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** App database client. Connects through the pooler on Vercel (see appDatabaseUrl). */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: appDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
