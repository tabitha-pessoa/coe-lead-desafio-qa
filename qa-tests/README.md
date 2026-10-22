# QA automation — Playwright + TypeScript

The suite uses Playwright Test for API requests and browser UI journeys. It deliberately targets the supplied local system and does not modify production source code.

## Setup

1. Start the application from the repository root: `docker compose up --build -d`.
2. Install Node.js 22+.
3. From this directory run `npm ci` and `npx playwright install chromium`.
4. Run `npm test`, or `npm run test:api` / `npm run test:ui`.

Environment overrides: `ORDER_URL`, `CATALOG_URL`, `FRONTEND_URL`. The default local URLs are ports 8080, 8081 and 4200.

## Evidence

HTML report: `playwright-report/`; JUnit: `test-results/junit.xml`; traces and screenshots are retained on failure. Confirm actual results before describing the system as passing; see `docs/qa/02-quality-summary-template.md` for the recorded local execution and its scope.

## Test-data notes

Tests rely on the seed IDs documented in `docker/mongo-init.js`. Order creation tests create database records, so use a dedicated local test environment. For repeated runs, the test checks invariants rather than assuming an empty order database.
