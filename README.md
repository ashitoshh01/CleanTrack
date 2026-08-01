# 🌿 CleanCity

Waste-reporting web app where citizens report waste locations with photos + GPS, and municipal admins triage and resolve those reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend | NestJS (modular monolith), TypeScript, REST, Swagger |
| Database | PostgreSQL via Prisma ORM |
| Images | Cloudinary |
| Maps | Google Maps JavaScript API + Geocoding API |
| Auth | JWT + Refresh Tokens |
| Email | Resend |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start local PostgreSQL
docker-compose up -d

# 3. Copy env files
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Generate Prisma client & push schema
pnpm db:generate
pnpm db:push

# 5. Start all apps in dev mode
pnpm dev
```

### URLs

- **Web app:** http://localhost:3000
- **API:** http://localhost:4000
- **Swagger docs:** http://localhost:4000/api/docs

## Project Structure

```
cleancity/
├── apps/
│   ├── web/                # Next.js 15 frontend
│   └── api/                # NestJS backend
├── packages/
│   ├── database/           # Prisma schema + generated client
│   ├── ui/                 # Shared shadcn components
│   └── types/              # Shared TS types + Zod schemas
├── docker-compose.yml      # Local PostgreSQL
├── turbo.json              # Turborepo pipeline
└── pnpm-workspace.yaml     # Workspace config
```

## MVP Roadmap

1. ✅ Repo scaffold
2. ⬜ Auth (register/login, JWT, role guards)
3. ⬜ Citizen: report waste
4. ⬜ Citizen: my complaints
5. ⬜ Admin: complaints table
6. ⬜ Admin: complaint detail
7. ⬜ Notifications (email via Resend)
8. ⬜ Dashboard stats
