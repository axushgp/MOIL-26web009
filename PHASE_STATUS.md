# Coding specification phase status

This status is intentionally separate from the runnable Replit preview.

## Phase 0 — environment and data acquisition

**Implemented:** the required directories, pinned `requirements.txt`,
`.env.example` credential checklist, AOI/mine configuration, lazy GEE adapter,
Bhukosh loader, ERA5 adapter, PostGIS schema, and coordinate-safe seed script.

**Acceptance status:** the coordinate warning passes. Live ingestion is not
executed because no GEE key, Bhukosh download, ERA5 key, or verified MOIL
production extract is present.

## Phase 1 — spectral layer

**Implemented:** ASTER band loading, candidate SWIR ratios, mine/background
separation scoring, and a CLI that writes the best candidate raster.

**Blocked acceptance:** no ASTER GeoTIFF exists, so no empirical separation score
can honestly be reported.

## Phase 2 — structural layer, fusion, and validation

**Implemented:** common-grid alignment, SAR Canny lineaments, lineament and
Bhukosh distance features, positive-unlabeled Random Forest fusion, downsampled
PostGIS output, and leave-one-out validation.

**Blocked acceptance:** this requires aligned Sentinel/ASTER rasters, a selected
Bhukosh layer, and authoritative mine coordinates. The code refuses to
substitute empty or synthetic scientific inputs.

## Phase 3 — production forecasting

**Implemented:** provenance-labelled operations generation around real ERA5
rainfall, a reserve-grid SQL query used by feature construction, XGBoost
training, and SHAP driver selection.

**Blocked acceptance:** the query cannot return `local_reserve_confidence`
until Phase 2 has populated `reserve_grid`; production figures and mine-specific
weather also need verification.

## Phase 4 — recommendations and dashboard

**Implemented:** deterministic Python rules, Ollama-only explanation phrasing,
FastAPI endpoint surface, Docker Compose deployment files, and the existing
Replit React dashboard with visible synthetic/live provenance.

**Acceptance status:** deterministic recommendation tests and the Replit API
smoke check pass. Live scientific endpoint acceptance remains blocked by Phases
0–3 inputs.

## Phase 5 — integration and demo

**Implemented:** opt-in Python contract/E2E guards and the existing Replit
smoke check/demo script.

**Blocked acceptance:** a scientific end-to-end run cannot be claimed until the
external datasets, coordinates, model outputs, and PostGIS stack are actually
prepared. The current preview remains explicitly synthetic.