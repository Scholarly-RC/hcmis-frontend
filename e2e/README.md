# Playwright QA Suite

## Prerequisites

1. Backend is up on `http://localhost:8000`.
2. Frontend dependencies are installed (`pnpm install`).
3. Test data is reset and seeded from backend root:

```bash
make reset-and-seed
```

## Run

From `hcmis-frontend/`:

```bash
pnpm test:e2e
```

Optional:

```bash
pnpm test:e2e:headed
pnpm test:e2e:ui
```

## Default Test Accounts

- HR: `hr@example.com`
- Employee: `employee@example.com`
- Password: `TestPass123!`

Override via env vars:

- `PLAYWRIGHT_HR_EMAIL`
- `PLAYWRIGHT_EMPLOYEE_EMAIL`
- `PLAYWRIGHT_TEST_PASSWORD`
- `PLAYWRIGHT_BASE_URL`
