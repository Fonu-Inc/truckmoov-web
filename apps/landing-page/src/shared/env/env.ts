import { z } from "zod";
import { validateEnv } from "type-envgen";

export const envSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.url(),
  NEXT_PUBLIC_MAIN_APP_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export const env = validateEnv(envSchema, {
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_MAIN_APP_URL: process.env.NEXT_PUBLIC_MAIN_APP_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
export type Env = z.infer<typeof envSchema>;
