# Changelog

All notable changes to the ShortLink project will be documented in this file.

## [1.0.0] - 2026-07-07

### Added
- **Phase 1: Core Foundation**
  - Standardized clean architecture backend using Express + TypeScript + Prisma ORM.
  - Deterministic Base62 URL shortener encoder.
  - Vitest + Supertest integration suite.
- **Phase 2: Cache & Security**
  - Redis cache integration with ioredis.
  - Security middlewares (Helmet, Cors, Compression).
  - Sliding window rate limiting.
- **Phase 3: Analytics Engine**
  - Click tracking table database storing IP hashes, browser type, OS, device profile, and geoip details.
  - Non-blocking asynchronous click logger.
- **Phase 4: SaaS Dashboard**
  - React 19 + TypeScript + Vite + Tailwind CSS v4 frontend layout.
  - Live charts detailing clicks over time, country and browser distributions, and device profiles.
- **Phase 5: Production Readiness**
  - Custom aliases (short link choice) with reserved keyword blocking.
  - Link expiration with auto-disappearing cache entries and `410 Gone` redirects.
  - Automated PNG QR code generation endpoints and frontend modal preview/downloads.
  - Swagger UI OpenAPI documentation on `/docs`.
  - Docker & Docker Compose container files.
  - GitHub Actions CI/CD workflows.
  - Structured health check endpoint on `/health`.
