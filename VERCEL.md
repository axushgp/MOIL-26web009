# Vercel deployment

This repository deploys the Replit-native MRIP preview as a Vite static site
with the Express API exposed as a Vercel function.

## Vercel project settings

Create the Vercel project from the repository root. The checked-in
`vercel.json` supplies the settings:

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @workspace/moil-mrip run build`
- Output directory: `artifacts/moil-mrip/dist/public`
- API route: `/api/*`

The root `api/index.ts` exports the existing Express app without calling
`listen()`, which is required for Vercel's serverless runtime.

## Required environment variable

The API reads `DATABASE_URL` at runtime. Add a PostgreSQL connection string to
the Vercel project's Environment Variables for Preview and Production. The
Replit development database is not automatically copied into Vercel, so use a
PostgreSQL database that the Vercel function can reach and apply the schema with
the project's normal Drizzle setup before using the dashboard.

The preview intentionally defaults to synthetic mode. Do not set
`MRIP_DATA_MODE=live` until the live source artifacts and provenance checks in
`LIVE_DATA_SETUP.md` are complete.