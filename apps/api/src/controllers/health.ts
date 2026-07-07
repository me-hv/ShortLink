import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { redis } from '../config/redis.js';

export class HealthController {
  check = async (req: Request, res: Response): Promise<void> => {
    let databaseStatus = 'UP';
    let redisStatus = 'UP';
    let isHealthy = true;

    // Check PostgreSQL
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error('💥 Database health check failed:', error);
      databaseStatus = 'DOWN';
      isHealthy = false;
    }

    // Check Redis
    try {
      const pingResponse = await redis.ping();
      if (pingResponse !== 'PONG') {
        redisStatus = 'DOWN';
        isHealthy = false;
      }
    } catch (error) {
      console.error('💥 Redis health check failed:', error);
      redisStatus = 'DOWN';
      isHealthy = false;
    }

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: databaseStatus,
      redis: redisStatus,
      uptime: Math.floor(process.uptime()),
    });
  };
}
