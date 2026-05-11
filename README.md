# assure-demo

DXC Assure mock portal for Pharmacists Mutual (PMUW) — US healthcare professional liability, 5 product lines (Pharmacy, Dental, Veterinary, Home Health, Senior Living).

## Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind → deployed to Vercel
- Backend: Node.js + Express + TypeScript + Prisma → deployed to Railway
- Database: PostgreSQL on Railway
- Auth: JWT (custom, bcryptjs)

## Local Setup

```bash
npm install
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env: set DATABASE_URL to a local Postgres instance
# and JWT_SECRET to a random string (e.g. openssl rand -hex 32)
npm run db:migrate      # creates DB schema
npm run db:seed         # seeds demo data + users
npm run dev:backend     # terminal 1 — listens on :8080
npm run dev:frontend    # terminal 2 — listens on :5173
```

### Demo Credentials

| Username | Password | Role |
|---|---|---|
| mwalters | Demo123! | Agency Admin |
| dchen | Demo123! | Underwriter |
| lpark | Demo123! | Adjuster |
| riverside | Demo123! | Policyholder |
| treyes | Demo123! | Producer |
| sklein | Demo123! | CSR |
| bholt | Demo123! | Producer (Locked) |
| klopez | Demo123! | Read-Only |

## Deploy

Push to `main`. Vercel auto-deploys the frontend; Railway auto-deploys the backend and runs `prisma migrate deploy` on start.

### First-time Railway env vars

Set on the Railway backend service:

```
DATABASE_URL   = ${{Postgres.DATABASE_URL}}
JWT_SECRET     = <openssl rand -hex 32>
JWT_EXPIRES_IN = 7d
CORS_ORIGIN    = https://<your-vercel-url>.vercel.app
NODE_ENV       = production
PORT           = (auto-set by Railway — do not override)
```

After seeding: `railway run npm run db:seed -w backend`

## Project Structure

```
assure-demo/
├── apps/
│   ├── frontend/   React + Vite + TypeScript + Tailwind
│   └── backend/    Express + Prisma + JWT
├── .github/workflows/ci.yml
├── vercel.json
├── railway.json
└── README.md
```

## TODOs for next workers

- [ ] Port all 20 .aspx.html mocks → React pages (see apps/frontend/src/pages/)
- [ ] Style Chrome.tsx sidebar/header using site.css classes
- [ ] Wire up PolicyDetail, ClaimWorkflow dynamic routes with real API data
- [ ] Add search/filter functionality to PolicySearch, ClaimSearch
