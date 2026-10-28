import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

loadEnv({ path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")] });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("postgresql://hbba:hbba_dev_password@localhost:5433/hbba?schema=public"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32).default("hbba-development-secret-change-me-32chars"),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

const parsed = schema.parse(process.env);

export const config = {
  ...parsed,
  COOKIE_SECURE: parsed.COOKIE_SECURE ? parsed.COOKIE_SECURE === "true" : parsed.NODE_ENV === "production",
};
