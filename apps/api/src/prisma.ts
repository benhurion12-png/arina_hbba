import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { config } from "./config.js";

declare global {
  // eslint-disable-next-line no-var
  var hbbaPrisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });

export const prisma = global.hbbaPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") global.hbbaPrisma = prisma;
