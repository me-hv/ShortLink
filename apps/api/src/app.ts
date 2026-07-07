import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import urlRouter from './routes/url.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { HealthController } from './controllers/health.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import swaggerUi from 'swagger-ui-express';
import openapiDoc from './config/openapi.json';

const app = express();
const healthController = new HealthController();

// 1. Trust Proxy
app.set('trust proxy', true);

// 2. Hide Express fingerprint
app.disable('x-powered-by');

// 3. Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP so Swagger UI loads correctly in production
}));

// 4. Cross-Origin Resource Sharing (CORS)
app.use(cors());

// 5. Gzip Compression
app.use(compression());

// 6. Limit request body size
app.use(express.json({ limit: '10kb' }));

// 7. Morgan Request Logging (HTTP Method, Status, Response Time, IP Address)
app.use(morgan(':method :status :response-time ms - :remote-addr'));

// 8. Sliding Window Rate Limiter (bypass for Swagger Docs and Health check)
app.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/docs')) {
    return next();
  }
  return rateLimiter(req, res, next);
});

// 9. Health Monitoring Endpoint
app.get('/health', asyncHandler(healthController.check));

// 10. Swagger API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

// 11. Register URL and redirection routes
app.use('/', urlRouter);

// 12. Global Error Handler Middleware
app.use(errorHandler);

export default app;
