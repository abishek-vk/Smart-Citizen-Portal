---
name: Smart City Portal stack
description: Full-stack architecture and wiring for the Smart City Digital Citizen Portal.
---

## Stack
- Frontend: React + Vite at `artifacts/citizen-portal`, served at `/` (root preview path)
- Backend: Express 5 API at `artifacts/api-server`, port 8080, prefix `/api`
- DB: PostgreSQL + Drizzle ORM, schema in `lib/db/src/schema/`
- Auth: Clerk (Replit-managed), proxy middleware in `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`
- API types: Orval codegen — hooks in `lib/api-client-react`, Zod schemas in `lib/api-zod`
- AI: Rule-based fallback in `/api/ai/chat` (Gemini not wired yet — no key needed via Replit AI Integrations)

## Routes registered in api-server
- `src/routes/auth.ts` — profile GET/PATCH
- `src/routes/dashboard.ts` — citizen + admin dashboards, complaint trends, department performance
- `src/routes/complaints.ts` — CRUD + AI analysis
- `src/routes/taxes.ts` — property + water tax list/get/pay
- `src/routes/certificates.ts` — apply + admin approve/reject
- `src/routes/garbage.ts` — schedule + list
- `src/routes/parking.ts` — lots + reservations
- `src/routes/services.ts` — transport, parks, libraries, payments, notifications, feedback, admin endpoints
- `src/routes/ai.ts` — chat send/history/clear

## Seed data
Run: `pnpm add -w tsx && pnpm exec tsx artifacts/api-server/src/seed.ts`
Seeds: 5 departments, 3 parking lots, 3 transport routes, 2 libraries + 5 books.

**Why:** tsx must be installed at workspace root before running seed scripts.
