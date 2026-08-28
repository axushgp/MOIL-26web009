# MOIL Reserve Intelligence Platform

An operations console for exploring manganese reserve signals, mine-level production risk, and auditable planning recommendations across the Sausar Group belt.

## Run & Operate

- `pnpm install --frozen-lockfile` — install the workspace dependencies
- `pnpm run dev` — start the combined Replit workflow (frontend + API)
- `pnpm run typecheck` — full typecheck across all packages
- `PORT=26001 BASE_PATH=/ pnpm --filter @workspace/moil-mrip run dev` — run the frontend alone
- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run the API alone
- `pnpm run smoke:mrip` — check the API contract while the API is running
- The dashboard currently uses the API's in-memory synthetic demo dataset; no credentials are required to preview it.
- The API listens on port 8080 and the Vite frontend listens on port 26001 in development. Vite proxies `/api` requests to the API.

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Recharts
- API: Express 5 with generated Zod contracts
- Shared API contracts: OpenAPI + Orval

## Where things live

- `artifacts/moil-mrip/` — dashboard frontend and Vite configuration
- `artifacts/api-server/` — Express API and MOIL demo routes
- `lib/api-spec/openapi.yaml` — API contract source
- `lib/api-client-react/` — generated React Query client
- `lib/api-zod/` — generated server-side validation schemas
- `attached_assets/` — the supplied MOIL MRIP build specification and guide
- `DATA_SOURCES.md` — current connected-data posture and scientific-run checklist
- `DEMO_SCRIPT.md` — the recommended evaluation narrative and honest status line

## Architecture decisions

- Keep the imported pnpm workspace structure; do not migrate the project to a different stack.
- Use a combined development workflow because the frontend and API are separate workspace packages but are needed together for the dashboard preview.
- Keep `/api` as the stable browser-facing API prefix; Vite proxies it to the local API service during development.

## Product

The current MVP dashboard provides a reserve-surface view, mine watchlist and filters, validation evidence, production history and forecast panels, and deterministic recommendation output with provenance labels.

## User preferences

No project-specific preferences recorded yet.

## Gotchas

- Vite requires both `PORT` and `BASE_PATH`; the Replit workflow supplies `PORT=26001` and `BASE_PATH=/`.
- The API requires `PORT`; the combined workflow supplies `PORT=8080`.
- The project specification requires real external datasets and credentials for the full science pipeline; those are not present in this imported preview setup. See `DATA_SOURCES.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
