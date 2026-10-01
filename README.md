# Trim

A link shortener with click tracking. Live at `go.busayolawumi.dev`.

- Sign up, paste a long URL, and choose a short name (or get a random one)
- The short name is checked for availability as you type
- Every click is logged (time, referrer, country, device, browser) before redirecting
- Link previews and bots (WhatsApp, Slack, crawlers…) are tracked separately so they don't inflate counts
- No IP addresses are stored

## Stack

Next.js (App Router) · Neon Postgres · Drizzle ORM · Tailwind. Auth is hand-rolled:
scrypt password hashing + a signed JWT session cookie (`jose`). Runs on Vercel's free Hobby plan.

## Local setup

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its connection string.
2. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `DATABASE_URL` and set `SESSION_SECRET` to the output of `openssl rand -base64 32`.
3. Install and create the tables:
   ```bash
   npm install
   npm run db:push
   ```
4. Run it: `npm run dev` → http://localhost:3000

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the environment variables in **Project → Settings → Environment Variables**:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `RESEND_API_KEY` and `EMAIL_FROM` (password reset emails; the sending domain must be verified in Resend)
   - `NEXT_PUBLIC_SHORT_BASE_URL=https://go.busayolawumi.dev`
3. In **Project → Settings → Domains**, add `go.busayolawumi.dev`. Since the domain's DNS is on
   Vercel, the record is created automatically.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run db:push` | Sync the schema in `src/db/schema.ts` to the database |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run typecheck` | Type-check the project |
| `npm run lint` | Lint |

## How it fits together

| Path | Purpose |
|---|---|
| `src/app/[slug]/route.ts` | The redirect: looks up the slug, sends a 302, logs the click after responding |
| `src/app/actions/` | Server actions for auth and creating/deleting links |
| `src/app/api/slug-available` | Live availability check used by the create form |
| `src/app/dashboard/` | Link list, create form, and per-link stats |
| `src/lib/slug.ts` | Slug rules and reserved words |
| `src/db/schema.ts` | `users`, `links`, `clicks` tables |
