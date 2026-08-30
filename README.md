# MOIL Manganese Reserve Intelligence Platform

This repository contains the phase-ordered MRIP implementation described in
`CODING_AGENT_SPEC.md`, plus a Replit-native TypeScript preview under
`artifacts/` for safe demonstration without external science credentials.

## Repository layout

The scientific pipeline follows the specification:

- `ingestion/` — Google Earth Engine, Bhukosh, and ERA5 input adapters
- `module1_reserve_mapping/` — spectral, structural, fusion, and validation work
- `module2_production_forecast/` — provenance-labelled operations and forecasting
- `module3_recommendations/` — deterministic actions and optional Ollama phrasing
- `db/` — PostGIS schema and mine seeding script
- `api/` — FastAPI reference service matching the specification endpoints
- `frontend/` — pointer to the React implementation used by the Replit preview
- `tests/` — Python unit and integration checks
- `artifacts/moil-mrip/` and `artifacts/api-server/` — runnable Replit preview

## Replit preview

The preview is intentionally synthetic and fail-closed:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
pnpm run dev
pnpm run smoke:mrip
```

It does not claim that its deterministic reserve cells or illustrative
operations are scientific outputs. See `DATA_SOURCES.md`, `LIVE_DATA_SETUP.md`,
and `DEMO_SCRIPT.md`.

## Scientific pipeline

Install the pinned Python dependencies, then run the phase-0 acceptance check:

```bash
python -m ingestion.config
```

This prints unresolved mine coordinates instead of inventing them. Live
ingestion requires the credentials and manually downloaded datasets documented
in `LIVE_DATA_SETUP.md`; no live request is made during import.

The Python/PostGIS service and the Replit preview are deliberately separate
execution surfaces until the scientific data adapters have been validated.