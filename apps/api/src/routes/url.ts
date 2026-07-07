import { Router } from 'express';
import { UrlController } from '../controllers/url.js';
import { UrlService } from '../services/url.js';
import { CacheService } from '../services/cache.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
const cacheService = new CacheService();
const urlService = new UrlService(cacheService);
const urlController = new UrlController(urlService, cacheService);

router.post('/api/shorten', asyncHandler(urlController.shorten));
router.get('/api/analytics/:shortCode', asyncHandler(urlController.getAnalytics));
router.get('/api/urls/:shortCode', asyncHandler(urlController.getUrlMetadata));
router.get('/api/qr/:shortCode', asyncHandler(urlController.qrCode));
router.get('/:shortCode', asyncHandler(urlController.redirect));

export default router;
