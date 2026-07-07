# Contributing to ShortLink

Thank you for your interest in contributing to ShortLink! We welcome community contributions to make this URL shortener even more reliable, secure, and performant.

## Code of Conduct

Please maintain professional, respectful, and inclusive communication in issues, pull requests, and discussions.

## Getting Started

1. **Fork the Repository** and clone it locally.
2. **Setup Dependencies**:
   ```bash
   pnpm install
   ```
3. **Database Setup**:
   Copy `.env.example` to `.env` and start the database:
   ```bash
   pnpm --filter api db:generate
   pnpm --filter api db:migrate
   ```
4. **Development server**:
   Start both api and web services:
   ```bash
   pnpm dev
   ```

## Development Guidelines

- **TypeScript**: Always write clean, strictly typed TypeScript. Do not bypass compiler type checking.
- **Linting**: Ensure code conforms to lint rules by running oxlint/eslint checks.
- **Tests**: Include unit and integration tests under `tests/` and verify they pass using `pnpm test`.

## Pull Request Process

1. Create a descriptive feature branch (e.g. `feat/custom-alias`).
2. Commit your changes with clear, structured commit messages.
3. Run compiler check `pnpm build` and verify tests pass.
4. Open a Pull Request referencing the corresponding issue and wait for review.
