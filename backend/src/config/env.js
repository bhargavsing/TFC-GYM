import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(8080),
  MONGODB_URI: z
    .string()
    .min(1)
    .default('mongodb://localhost:27017/gymflow'),
  APP_CORS_ALLOWED_ORIGIN: z.url().default('http://localhost:5173'),
  CLIENT_URL: z.url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16).default('dev-admin-secret-change-before-prod'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-before-prod'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-before-prod'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  SUPER_ADMIN_EMAIL: z.email().default('superadmin@tfc.local'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('TFCAdmin123'),
  SUPER_ADMIN_NAME: z.string().default('TFC Super Admin'),
  ADMIN_SEED_NAME: z.string().default('TFC Administrator'),
  ADMIN_SEED_USERNAME: z.string().default('admin'),
  ADMIN_SEED_PASSWORD: z.string().min(8).default('TFCAdmin123'),
  ADMIN_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RENEWAL_REMINDER_DAYS: z.coerce.number().int().positive().default(7),
})

export const env = envSchema.parse(process.env)
