import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().min(1, 'PORT must be a valid number'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_TOKEN: z.string().min(1, 'REDIS_TOKEN is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ CRITICAL STARTUP ERROR: Invalid Environment Configuration\n');
  parsed.error.errors.forEach((err) => {
    console.error(`   - Missing or invalid field [${err.path.join('.')}]: ${err.message}`);
  });
  console.error('\nPlease verify your .env file and restart the application.\n');
  process.exit(1);
}

export const env = parsed.data;
