# HCMIS Frontend

## Environment Setup

Create a local env file before running the app:

```bash
cp .env.example .env
```

The frontend talks to the backend through Next.js server routes. Those routes use
`HCMIS_BACKEND_URL`, which defaults to `http://localhost:8000` when the variable
is not set.

## Getting Started

1. Make sure the backend is running.
2. Install dependencies:

```bash
pnpm install
```

3. Start the frontend:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
