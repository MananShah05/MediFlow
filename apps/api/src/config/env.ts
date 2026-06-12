import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.coerce.number().int().default(12),
  PORT: z.coerce.number().int().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_ORIGIN: optionalNonEmptyString,
  COOKIE_DOMAIN: optionalNonEmptyString,
  COOKIE_SAME_SITE: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["strict", "lax", "none"]).optional()
  ),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().default("careos-files"),
  S3_ACCESS_KEY: z.string().default("test"),
  S3_SECRET_KEY: z.string().default("test"),
  S3_REGION: z.string().default("us-east-1"),
  CLAMAV_HOST: z.string().default("localhost"),
  CLAMAV_PORT: z.coerce.number().int().default(3310),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
