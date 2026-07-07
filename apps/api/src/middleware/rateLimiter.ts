import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import rateLimit from 'express-rate-limit';

const WINDOW_MS = 60 * 1000;
const LIMIT = 100;

// Fallback in-memory rate limiter if Redis is offline
const fallbackLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many requests, please try again later.',
    });
  },
});

export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  const clearBefore = now - WINDOW_MS;

  try {
    const pipeline = redis.multi();
    
    // 1. Remove expired timestamps
    pipeline.zremrangebyscore(key, 0, clearBefore);
    
    // 2. Insert current timestamp with unique member to support sub-millisecond request counting
    const member = `${now}:${Math.random()}`;
    pipeline.zadd(key, now, member);
    
    // 3. Count requests
    pipeline.zcard(key);
    
    // Ensure key expires automatically when inactive
    pipeline.pexpire(key, WINDOW_MS);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Pipeline execution failed');
    }

    const zcardResult = results[2];
    const count = Array.isArray(zcardResult) ? (zcardResult[1] as number) : (zcardResult as number);

    // 4. Reject if above limit
    if (count > LIMIT) {
      res.status(429).json({
        status: 'fail',
        message: 'Too many requests, please try again later.',
      });
      return;
    }

    next();
  } catch (error) {
    console.warn('⚠️ Redis rate limiter failed, falling back to in-memory limiter:', error);
    fallbackLimiter(req, res, next);
  }
}
