# Familee

A premium household management web app for the whole family, with Parent Mode (full access) and Kids Mode (simplified, child-appropriate view).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/familee run dev` — run the frontend (Vite, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Wouter, TanStack Query, shadcn/ui, Framer Motion, Tailwind CSS v4
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Plus Jakarta Sans (body), Fraunces (serif/headings)
- Theme: Deep Indigo primary (`hsl(245 45% 35%)`), Warm Amber secondary (`hsl(30 87% 65%)`)

## Where things live

- `lib/db/src/schema/` — all DB table definitions (one file per domain)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/familee/src/pages/` — All page components
- `artifacts/familee/src/index.css` — Theme variables (HSL CSS custom properties)
- `artifacts/familee/src/context/AppContext.tsx` — Auth state + user mode

## Architecture decisions

- **Dual-mode auth**: single `parent` account with session; "Kids Mode" switches `session.mode` to "kids" and optionally scopes to a `memberId`. Parent Mode requires password re-entry.
- **Session-based auth**: `express-session` with `SESSION_SECRET` env var; no JWT needed.
- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas. Never hand-write API fetch calls in the frontend.
- **Numeric DB columns**: `amount`, `cost`, `targetAmount`, `currentAmount` stored as Postgres `numeric` type; routes convert to `Number()` on output.
- **Avatar as JSON string**: `avatarConfig` stored as a JSON string in the `members` table; parsed client-side for SVG rendering.

## Product

- **Parent Dashboard**: Command center with events, chores, groceries, maintenance alerts, announcements
- **Kids Dashboard**: Simplified view with today's events, my chores, school tasks, family goals
- **Calendar**: Monthly calendar with color-coded events by category
- **Chores**: Assign chores with points, priority, recurring schedule; mark complete
- **Routines**: Morning/bedtime/afterschool routines with step-by-step instructions
- **School Hub**: Track homework, tests, projects by kid; overdue/due-soon highlighting
- **Announcements**: Post family news; pin important items; parent-only option
- **Goals**: Track family goals with progress bar; visible-to-kids toggle
- **Finances**: Expenses, budgets with spend tracking, bills with pay toggle, savings goals
- **Groceries**: Shopping list grouped by category; urgent priority flag
- **Maintenance**: Home/vehicle maintenance tracker with status (upcoming/overdue/completed)
- **Parent Notes**: Private sticky notes for parents only, color-coded, pinnable
- **Members**: Family member profiles with SVG avatar builder (face, hair, skin tone, accessories)
- **Settings**: Mode switching between Parent ↔ Kids

## Demo Credentials

- Username: `parent`, Password: `family123`
- Parent Mode Password (for mode switch): `family123`
- Demo family: Sarah, Mike (parents), Emma (12), Liam (9), Zoe (6)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Always run `pnpm --filter @workspace/db run push` after schema changes** before starting the API server
- **Always run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI changes** to regenerate hooks
- Routes are mounted at `/api/*` — frontend uses relative URLs through the Vite proxy
- `express-session` requires `credentials: true` in the frontend fetch config (handled by `customFetch` in api-client-react)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
