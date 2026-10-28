import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

loadEnv({ path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")] });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@hbba.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: UserRole.ADMIN, name: process.env.ADMIN_NAME ?? "Администратор HBBA" },
    create: {
      email,
      name: process.env.ADMIN_NAME ?? "Администратор HBBA",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Administrator is ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
