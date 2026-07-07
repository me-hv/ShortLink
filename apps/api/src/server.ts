import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { validateRedisConnection } from './config/redis.js';

async function startServer() {
  try {
    // 1. Validate Redis connection
    await validateRedisConnection();

    // 2. Test database connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
