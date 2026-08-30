# BUILD SPECIFICATION FOR CODING AGENTS
# Project: MOIL Manganese Reserve Intelligence Platform (MRIP)
# PS: SIH26009 — AI/ML + Space Technology for Manganese Reserve Identification

**This document is written to be handed directly to a coding agent (Claude Code or equivalent) as the primary build reference. It contains architecture, exact file structure, phase-by-phase prompts, starter code for the hardest components, database schema, API contracts, and an explicit list of what the agent must ask the human team rather than assume.**

---

## 0. READ THIS FIRST — RULES FOR THE CODING AGENT

1. **Do not invent MOIL production data, mine shaft coordinates, or geological survey results.** Everywhere this document says "ask the user," stop and ask before hardcoding a value. A wrong assumption here isn't a bug — it's a credibility failure in front of a government evaluator who knows the domain.
2. **Build in the phase order given.** Each phase has an acceptance test. Do not start Phase N+1 until Phase N's acceptance test passes.
3. **Every synthetic data source must be labeled as synthetic in the code (variable names, docstrings, and UI) and in the final demo.** Never let real and synthetic data look visually identical in the dashboard — this system will be judged partly on scientific honesty.
4. **Keep the LLM layer (Ollama/Llama-3) confined to text generation only.** No business logic, risk scoring, or classification decision may live inside an LLM prompt. If you find yourself asking an LLM to "decide" something, stop and implement it as a rule or a trained model instead.
5. **Commit after every phase.** Each phase should be a working, demoable state even if later phases haven't started.

---

## 1. WHAT WE ARE BUILDING — ONE PARAGRAPH

A web platform that ingests free satellite imagery (Sentinel-1, Sentinel-2, ASTER) over MOIL's manganese belt in Central India, combines it with real published geological structure (the Sausar Group formation boundaries from GSI's open data), and produces a probability-ranked map of where unexplored manganese reserves are likely to be found — validated against MOIL's own known mine locations. This feeds into a production-forecasting module that predicts shortfall risk per mine using real weather history plus calibrated synthetic operational data, and a recommendation engine that turns both into plain-language corrective actions for MOIL planning staff. Three modules, one integrated system, one dashboard.

---

## 2. QUESTIONS TO ASK THE HUMAN TEAM BEFORE OR DURING BUILD — DO NOT GUESS THESE

Ask these explicitly. Do not proceed past the relevant phase until answered.

| # | Question | Why it matters | Safe default if no answer given |
|---|---|---|---|
| 1 | Do you have a Google Earth Engine account approved and a service-account JSON key, or should the agent walk you through creating one? | GEE requires account approval (can take days) — this blocks all of Module 1 | Ask immediately, before anything else, since approval lag is the biggest schedule risk |
| 2 | Do you have the GSI Bhukosh lithology shapefiles for the Balaghat–Bhandara–Nagpur corridor downloaded already, or should we build the download/parsing step? | Bhukosh requires manual portal navigation, not a clean API | Assume not downloaded; agent builds a documented manual-download step with exact search terms, and a placeholder loader that clearly errors if the file is missing |
| 3 | Which exact mine coordinates should we treat as validated ground truth? We have publicly sourced approximate coordinates (see Section 4) but these should be confirmed against MOIL's own mining lease documents if the team has access. | False precision here undermines the whole validation methodology | Use the publicly sourced coordinates listed in Section 4, clearly flagged in code comments as "public-source approximate, confirm before final submission" |
| 4 | Do you want the LLM recommendation layer to run locally via Ollama (no API key, no internet dependency, slower) or via a cloud API (Anthropic/OpenAI, needs an API key, faster, requires internet during demo)? | Changes a config file and a dependency, and changes your demo risk profile (cloud API can fail if venue wifi is bad) | Default to local Ollama + Llama-3-8B-Instruct for demo-day reliability; ask if the team has and wants to use a cloud API key instead |
| 5 | What's the deployment target for the finale demo — a laptop running Docker Compose locally, or a cloud VM the team controls? | Changes whether we need to worry about internet dependency at all | Default to fully local Docker Compose, zero internet dependency at demo time except the one-time data pull done in advance |
| 6 | Does anyone on the team have real MOIL production figures beyond what's in public annual reports (e.g., from an internship, a contact, or a published thesis)? | This would upgrade Module 2 from "calibrated synthetic" to "real," which is a meaningfully stronger claim | Default to public annual report figures only, clearly labeled |
| 7 | Should the frontend carry MOIL/Ministry of Steel branding (logo, color scheme), or stay neutral? | Affects perceived production-readiness in the demo | Ask; default to a clean neutral blue/grey palette with a placeholder logo slot if no asset is provided |
| 8 | Team's comfort level with React — should the frontend be React, or would a simpler Streamlit dashboard reduce build risk given the time budget? | This is a real tradeoff between "looks more professional" (React) and "ships faster and more reliably" (Streamlit) | Ask this explicitly in Phase 0 — the answer changes Section 9 entirely |

---

## 3. SYSTEM ARCHITECTURE

```
                        ┌───────────────────────────┐
                        │   DATA INGESTION LAYER     │
                        │  (run once, pre-finale)    │
                        │                             │
                        │  GEE Python API             │
                        │   → Sentinel-1 SAR          │
                        │   → Sentinel-2 MSI          │
                        │   → ASTER L1T               │
                        │  GSI Bhukosh shapefiles     │
                        │   → lithology boundaries    │
                        │  ERA5 CDS API               │
                        │   → rainfall history         │
                        └──────────────┬──────────────┘
                                       │ writes to
                        ┌──────────────▼──────────────┐
                        │   /data/raw  (GeoTIFF, SHP)  │
                        └──────────────┬──────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                               │                               │
┌───────▼────────┐          ┌───────────▼───────────┐        ┌─────────▼─────────┐
│ MODULE 1        │          │  MODULE 2               │        │ (shared)           │
│ Reserve Mapping │          │  Production Forecasting │        │ PostgreSQL+PostGIS │
│                  │          │                          │        │                    │
│ spectral.py      │          │  synth_ops_generator.py  │◄───────┤ stores:            │
│ structural.py     │──────►  │  weather_loader.py        │        │  reserve_grid       │
│ fusion_model.py    │ feature │  forecast_model.py         │        │  mines               │
│ → reserve_grid tbl  │        │  → shortfall_forecast tbl   │        │  production_history  │
└───────┬─────────────┘        └───────────┬─────────────────┘        │  forecasts            │
        │                                    │                          │  recommendations       │
        │                                    │                          └─────────┬──────────────┘
        └────────────────┬───────────────────┘                                    │
                          │  both write predictions to shared DB                   │
                ┌─────────▼─────────────────────────────────────────┐             │
                │  MODULE 3: Recommendation Engine                    │◄────────────┘
                │  rules_engine.py (deterministic)                     │
                │  llm_explainer.py (Ollama — text phrasing only)       │
                └─────────┬─────────────────────────────────────────┘
                          │
                ┌─────────▼─────────────────────────────────────────┐
                │  FastAPI backend (api/main.py)                      │
                │  serves REST endpoints — see Section 8               │
                └─────────┬─────────────────────────────────────────┘
                          │
                ┌─────────▼─────────────────────────────────────────┐
                │  Frontend (React + Leaflet, or Streamlit)            │
                │  Map view · Mine drill-down · Forecast charts ·      │
                │  Recommendation panel                                 │
                └─────────────────────────────────────────────────────┘
```

**The one integration rule that makes this "one system" and not three demos stapled together:** `forecast_model.py` in Module 2 must query `reserve_grid` (Module 1's output table) for a feature — specifically, the reserve-confidence trend at each mine's current working face — and include it as a model input. This is implemented in Section 6, Phase 3. If a coding agent builds Module 2 without this query, the integration requirement is not met and must be fixed before Phase 4.

---

## 4. VERIFIED GROUND-TRUTH DATA (cite these, do not alter without checking sources)

**MOIL operates 10 mines** across Nagpur/Bhandara districts (Maharashtra) and Balaghat district (Madhya Pradesh). The preview now carries source-backed screening points for all ten mines. These are not lease-boundary surveys: each coordinate must retain its evidence source and confidence label, and any final scientific run should replace screening points with MOIL lease or GSI Bhukosh geometry where available.

| Mine | District | Type | Approx. coordinates | Source |
|---|---|---|---|---|
| Balaghat (Bharveli) | Balaghat, MP | Underground, largest, ~383m depth | 21.80000°N, 80.18000°E | Public Mindat locality record; public-source approximate |
| Ukwa | Balaghat, MP | Opencast | 21.97000°N, 80.47000°E | Public Mindat locality record; public-source approximate |
| Tirodi | Balaghat, MP | Opencast | 21.68333°N, 79.73333°E | South Tirodi Mine locality record; public mine locality |
| Chikla | Bhandara, Maharashtra | Underground | 21.54333°N, 79.75389°E | Mindat Chikla locality point, corroborated by a government Chikla mine report at 21°31'N, 79°45'E; government-corroborated locality |
| Kandri | Nagpur, Maharashtra | Underground | 21.40000°N, 79.26667°E | Government forest-clearance mine report: 21°24'N, 79°16'E; government report coordinate |
| Munsar / Mansar | Nagpur, Maharashtra | Underground | 21.38944°N, 79.28722°E | ARMA 2018 published mine study center: 21°23'22"N, 79°17'14"E; published study center |
| Beldongri | Nagpur, Maharashtra | Underground | 21.34950°N, 79.30030°E | The Diggings/USGS locality point, with mine identity corroborated by MOIL's unit register; public-source approximate |
| Gumgaon | Nagpur, Maharashtra | Underground | 21.39602°N, 78.99197°E | Public Gumgaon locality point within the government environmental-clearance lease envelope; government-corroborated locality |
| Dongri Buzurg | Bhandara, Maharashtra | Opencast | 21.54861°N, 79.68278°E | Mindat mine locality point, with mine identity corroborated by MOIL's unit register and government mine plan; public-source approximate |
| Sitapatore | Balaghat, MP | Opencast | 21.66667°N, 79.66667°E | Mindat Sitapatore deposit point; MOIL's unit register confirms Sitapatore Mine at Sukli; public-source approximate |

**PRIORITY NOTE:** Chikla is the single richest structural-control precedent in this table (the plunging-synform detail is exactly what Module 1's lineament-proximity feature is designed to capture). Its source-backed point is now included, but it remains a locality point rather than a surveyed lease centroid. The preview therefore reports the LOOCV evidence as source-backed screening evidence, not as a final geological validation.

**Geological framework:** All MOIL ore sits within the **Sausar Group**, a Mesoproterozoic metasedimentary fold belt ~200km long (Balaghat to Nagpur), ~25km wide, striking ENE-WSW to NNE-SSW, dipping 45-70° south. Ore occurs as **gondite** (manganese-silicate metasediment) at specific stratigraphic horizons, frequently at formation contacts (e.g., Mansar–Sitasaongi contact at Chikla), and is **structurally concentrated in fold hinges and shear zones** — the Chikla example (ore at the core of a plunging synform) is the clearest documented case and should be used as the primary structural-control template when building the lineament/fold-proximity feature in Module 1. Ore mineral assemblage: braunite, bixbyite, hausmannite, hollandite, jacobsite, vredenburgite, pyrolusite, cryptomelane, psilomelane.

**ASTER sensor facts (confirmed, use directly):** 14 bands total — VNIR bands 1-3 (15m resolution, includes 3N/3B stereo pair), SWIR bands 4-9 (30m resolution), TIR bands 10-14 (90m resolution). Published studies on comparable manganese deposits (Oman ophiolite-hosted Mn, Pakistan Bela ophiolite Mn) confirm manganese exhibits diagnostic low reflectance across ASTER VNIR/SWIR (bands 1-9) and distinct thermal emission behaviour in TIR (bands 10-14), with band-ratio and PCA transforms of the SWIR bands being the established discrimination method.

**IMPORTANT — do not hallucinate a specific band-ratio formula.** The exact numerator/denominator band combination validated in the cited literature must be pulled directly from the source papers during Phase 0 (search terms: "Rajendran Nasir 2013 manganese ASTER Oman band ratio", "ASTER Bela ophiolite manganese band ratio Pakistan 2025"). If the papers are inaccessible, fall back to the general mineral-exploration convention of testing multiple SWIR band ratio candidates (e.g., b4/b6, b4/b7, b6/b8 in ASTER SWIR numbering) and empirically selecting whichever ratio best separates pixels at the five known mine coordinates from random background pixels — this is a legitimate, explainable methodology and should be presented as such if the literature-derived formula can't be sourced in time.

---

## 5. REPOSITORY STRUCTURE

```
moil-mrip/
├── docker-compose.yml
├── requirements.txt              # pinned deps, repo-root level — Phase 0
├── .env.example
├── .gitignore                     # secrets/, .env, data/raw|processed/, etc. — Phase 0
├── README.md
├── DATA_SOURCES.md                  # attribution/licensing — Section 11
├── secrets/                          # gitignored, holds gee_key.json etc.
├── data/
│   ├── raw/                    # GEE exports, Bhukosh shapefiles land here
│   ├── processed/               # cleaned rasters, feature tables
│   └── synthetic/                # clearly-labeled synthetic ops data
├── ingestion/
│   ├── gee_client.py             # authenticates + pulls Sentinel-1/2, ASTER
│   ├── bhukosh_loader.py          # parses manually-downloaded shapefiles
│   ├── era5_client.py              # pulls rainfall history via CDS API
│   └── config.py                    # AOI bounding box, mine coordinate table
├── module1_reserve_mapping/
│   ├── grid_alignment.py             # resamples all rasters to one common
│   │                                    # grid BEFORE any feature stacking — Phase 2
│   ├── spectral.py                  # band ratio computation
│   ├── structural.py                 # SAR lineament / fold-proximity extraction
│   ├── fusion_model.py                # RandomForest training + inference,
│   │                                     # writes model_runs row
│   ├── validate.py                     # LOOCV validation, NOT in-sample-only
│   └── train_fusion_model.ipynb         # exploratory notebook, not production code
├── module2_production_forecast/
│   ├── synth_ops_generator.py            # calibrated synthetic production data
│   ├── weather_loader.py                  # wraps era5_client for mine-specific pulls
│   ├── forecast_model.py                   # XGBoost regressor, queries reserve_grid
│   └── train_forecast_model.ipynb
├── module3_recommendations/
│   ├── rules_engine.py                      # deterministic decision logic
│   └── llm_explainer.py                      # Ollama call, text phrasing ONLY
├── db/
│   ├── schema.sql                             # full PostGIS schema, Section 7
│   └── seed.py                                 # loads mine table — Phase 0, run
│                                                   # AFTER schema.sql is applied
├── api/
│   ├── Dockerfile                                # build context is repo ROOT, see Section 10
│   ├── main.py                                    # FastAPI app + CORS middleware
│   ├── routers/
│   │   ├── reserves.py
│   │   ├── production.py
│   │   └── recommendations.py                       # internally calls forecast
│   │                                                     # logic + rules_engine +
│   │                                                     # llm_explainer in sequence
│   └── schemas.py                                     # Pydantic response models
├── frontend/                                        # React+Leaflet OR Streamlit — see Q8
│   └── (structure depends on answer to Section 2, Q8)
└── tests/
    ├── test_spectral.py
    ├── test_fusion_validation.py               # tests the LOOCV logic specifically
    ├── test_rules_engine.py                      # all four branches, Phase 4
    ├── test_api_endpoints.py
    └── test_e2e.py                                 # Phase 5
```

---

## 6. PHASE-BY-PHASE BUILD SPEC

Each phase below has: an objective, the exact prompt block to give a coding agent, starter code for the non-obvious parts, and an acceptance test. Do not skip the acceptance test.

---

### PHASE 0 — Environment + Data Acquisition (before any modeling code)

**Objective:** Get every credential and raw dataset in place so later phases don't stall.

**PROMPT FOR CODING AGENT:**
```
Set up the repository structure exactly as specified in Section 5 of the build
spec. Create ingestion/config.py containing:
  - AOI bounding box covering the Balaghat-Bhandara-Nagpur corridor
    (use bounds: lat 20.9 to 22.1, lon 79.0 to 80.6 — this covers all
    mines listed in Section 4 with margin for unexplored terrain)
  - A MINES dict with the source-backed screening coordinates from Section 4,
     each entry tagged with a "confidence" field and source URI. Preserve
     "approximate" or "locality" confidence where the source is not a lease
     survey; do not upgrade it to "confirmed" without stronger evidence.
   - Do NOT fabricate coordinates. If a mine has no cited point or envelope,
     mark it as "coordinates": None, "status": "NEEDS_USER_INPUT" and print a
     clear warning at import time listing which mines are missing coordinates.

Then write ingestion/gee_client.py with functions:
  - authenticate() — reads service account JSON path from .env,
    raises a clear error with setup instructions if missing
  - get_sentinel2_composite(aoi, start_date, end_date, max_cloud_pct)
  - get_sentinel1_composite(aoi, start_date, end_date)
  - get_aster_scenes(aoi, start_date, end_date)
  - export_to_geotiff(image, aoi, filename) — exports to data/raw/

Also write db/seed.py: reads MINES from ingestion/config.py and INSERTs
a row into the `mines` table (schema in Section 7) for every entry that
has non-null lat/lon — set coordinate_status to the entry's "confidence"
value. Skip NEEDS_USER_INPUT entries and print a one-line warning per
skipped mine so it's obvious at seed time, not just at import time. This
must run after docker-compose brings up the `db` service and schema.sql
has been applied — document that order explicitly in README.md.

Also create requirements.txt at the repo root (not per-module) pinning:
  earthengine-api, geemap, rasterio, geopandas, shapely, opencv-python,
  scipy, scikit-learn, xgboost, shap, pandas, numpy, fastapi, uvicorn,
  psycopg2-binary, pydantic, cdsapi, ollama, python-dotenv, pytest
Pin major versions only (e.g. rasterio>=1.3,<2.0) — exact pins can wait,
but an unpinned requirements.txt is not acceptable for a "production
MVP" claim.

Also create .gitignore containing at minimum: secrets/, .env, data/raw/,
data/processed/, __pycache__/, *.pyc, .ipynb_checkpoints/, ollama_models/

Do not run anything yet that requires live GEE credentials — stub the
authentication check so the code is complete and correct but the human
team runs it once they've confirmed Section 2 Q1.
```

**Starter code — `ingestion/config.py` mine table:**
```python
# ingestion/config.py

AOI_BOUNDS = {
    "min_lat": 20.9, "max_lat": 22.1,
    "min_lon": 79.0, "max_lon": 80.6,
}

MINES = {
    "balaghat_bharveli": {
        "lat": 21.80, "lon": 80.18, "district": "Balaghat, MP",
        "type": "underground", "confidence": "public_source_approximate",
        "source": "Mindat locality record; confirm against MOIL lease documents"
    },
    "ukwa": {
        "lat": 21.97, "lon": 80.47, "district": "Balaghat, MP",
        "type": "opencast", "confidence": "public_source_approximate",
        "source": "Mindat locality record; confirm against MOIL lease documents"
    },
    "tirodi": {
        "lat": 21.68333, "lon": 79.73333, "district": "Balaghat, MP",
        "type": "opencast", "confidence": "public_mine_locality",
        "source": "South Tirodi Mine locality record; MOIL unit register"
    },
    "chikla": {
        "lat": 21.54333, "lon": 79.75389,
        "district": "Bhandara, Maharashtra",
        "type": "underground", "confidence": "government_corroborated_locality",
        "source": "Mindat point corroborated by Govt. Chikla mine report"
    },
    "kandri": {"lat": 21.4, "lon": 79.266667,
               "district": "Nagpur, Maharashtra",
               "confidence": "government_report"},
    "mansar": {"lat": 21.389444, "lon": 79.287222,
               "district": "Nagpur, Maharashtra",
               "confidence": "published_mine_study"},
    "beldongri": {"lat": 21.3495, "lon": 79.3003,
                  "district": "Nagpur, Maharashtra",
                  "confidence": "public_locality_approximate"},
    "gumgaon": {"lat": 21.39602, "lon": 78.99197,
                "district": "Nagpur, Maharashtra",
                "confidence": "government_envelope_corroborated"},
    "dongri_buzurg": {"lat": 21.548611, "lon": 79.682778,
                      "district": "Bhandara, Maharashtra",
                      "type": "opencast",
                      "confidence": "public_locality_approximate"},
    "sitapatore": {"lat": 21.66667, "lon": 79.66667,
                   "district": "Bhandara, Maharashtra",
                   "type": "opencast",
                   "confidence": "public_locality_approximate"},
}

def check_mine_coordinates():
    missing = [k for k, v in MINES.items() if v.get("lat") is None]
    if missing:
        print(f"[WARNING] {len(missing)} mines missing source-backed coordinates: "
              f"{missing}. Reserve-mapping validation will only use the "
              f"{len(MINES) - len(missing)} source-backed locations until these "
              f"are filled in. Ask the team for MOIL lease document "
              f"coordinates or GSI Bhukosh point locations for these mines.")
    return missing
```

**Manual steps the human team must do in Phase 0 (agent should print these as a checklist, not attempt to automate what can't be automated):**
1. Create a GEE service account, download JSON key, place at `secrets/gee_key.json` (never commit this — add to `.gitignore`).
2. Go to bhukosh.gsi.gov.in, search "Balaghat" and "Nagpur" district geological maps, download available lithology shapefiles into `data/raw/bhukosh/`.
3. Register for a free Copernicus Climate Data Store account for ERA5 access, place API key in `.env`.
4. Locate and download the 2-3 cited ASTER-manganese papers (Rajendran & Nasir 2013 Oman study; the 2025 MDPI Bela ophiolite Pakistan study) for the exact band-ratio formula.

**Acceptance test:** `python -m ingestion.config` runs and prints the coordinate warning correctly; `.env.example` exists documenting every required credential; repository structure matches Section 5 exactly.

---

### PHASE 1 — Module 1, Spectral Layer

**Objective:** Produce a first-pass raster where pixel values correlate with manganese-bearing surface material, and prove it lights up at the confirmed mine coordinates before trusting it anywhere else.

**PROMPT FOR CODING AGENT:**
```
Implement module1_reserve_mapping/spectral.py with:

  1. load_aster_bands(geotiff_path) -> dict of numpy arrays keyed by
     band number (1-14)

  2. compute_band_ratios(bands: dict, ratio_definitions: list[tuple])
     -> dict of ratio_name: numpy array. ratio_definitions is a list of
     (name, numerator_band, denominator_band) tuples so we can test
     multiple candidate ratios without rewriting code.

  3. If the literature-sourced ratio formula (from the Phase 0 papers)
     is available, hardcode it as the DEFAULT_RATIOS list with a
     docstring citing the source paper and page/equation number.
     If not available by build time, fall back to this candidate set
     and say so explicitly in a comment:
        CANDIDATE_RATIOS = [
            ("swir_ratio_a", 4, 6), ("swir_ratio_b", 4, 7),
            ("swir_ratio_c", 6, 8), ("swir_ratio_d", 5, 8),
        ]

  4. score_ratio_at_known_mines(ratio_array, mines: dict, geotransform)
     -> for each confirmed mine, sample the ratio value at that pixel
     and at 20 random background pixels within the AOI, return a
     simple separation statistic (e.g. Cohen's d or a t-test p-value)
     so we can empirically pick whichever candidate ratio best
     separates known-ore pixels from background BEFORE using it for
     anything else.

  5. A main() that runs all candidate ratios, prints the separation
     score for each, and saves the best-performing ratio's raster to
     data/processed/manganese_spectral_score.tif

Write this so a human can run `python -m module1_reserve_mapping.spectral`
after Phase 0 data is in place and get a printed ranking of which
candidate ratio works best BEFORE any fusion modeling happens.
```

**Acceptance test:** the printed ranking shows at least one candidate ratio with a statistically meaningful separation (p < 0.05 or Cohen's d > 0.5) between confirmed-mine pixels and background pixels. If none separate meaningfully, stop and debug the band math or reconsider AOI/date range (cloud cover, seasonal vegetation cover can degrade SWIR signal) before proceeding to Phase 2.

---

### PHASE 2 — Module 1, Structural Layer + Fusion Model

**Objective:** Add the fold/lineament structural signal (the Chikla precedent — ore at a plunging synform core), fuse it with the spectral score, and produce the final reserve-probability surface.

**PROMPT FOR CODING AGENT:**
```
FIRST — before any feature extraction — implement
module1_reserve_mapping/grid_alignment.py with:

  align_to_common_grid(rasters: dict[str, tuple[array, geotransform, crs]],
                        target_resolution_m: int = 30,
                        target_crs: str = "EPSG:32644")
  -> dict of the same keys, each resampled (rasterio.warp.reproject,
     Resampling.bilinear for continuous data, Resampling.nearest for
     the binary lineament mask) onto ONE shared grid at 30m resolution
     in UTM Zone 44N (EPSG:32644 — correct UTM zone for this AOI's
     longitude range, 79-80.6°E).

  This step exists because ASTER SWIR is natively 30m, Sentinel-1 SAR
  is natively ~10m, and the Bhukosh shapefile is a vector layer that
  must be rasterized to the same grid before distance transforms can
  be computed pixel-for-pixel against the spectral raster. Skipping
  this step means later per-pixel feature stacking (spectral_score +
  dist_lineament + dist_sausar_boundary in the SAME array shape) will
  silently misalign — this is a correctness bug, not a style choice,
  and must be run before structural.py or fusion_model.py touch any
  raster. All raster outputs from Phase 1 (spectral.py) must also be
  re-run through this function before Phase 2 begins, if they weren't
  already produced on this exact grid.

  Store point data (mines, reserve_grid) in WGS84 (EPSG:4326, matching
  the PostGIS GEOGRAPHY columns in Section 7) — the UTM grid is for
  raster math only; reproject the final probability raster's sample
  points back to EPSG:4326 at the point where they're written to
  reserve_grid in save_to_postgis().

THEN implement module1_reserve_mapping/structural.py with:

  1. extract_lineaments(sar_geotiff_path) -> a binary raster of
     likely fault/fold-trace pixels, using Canny edge detection
     (cv2.Canny) on the Sentinel-1 SAR backscatter image after a
     speckle filter (use a simple median filter, kernel size 5, as
     the speckle-reduction step — document this as a simplification
     of the Lee filter for time reasons).

  2. distance_to_nearest_lineament(lineament_raster) -> a raster
     where each pixel's value is the Euclidean pixel-distance to the
     nearest lineament pixel (scipy.ndimage.distance_transform_edt).
     This is the structural-control feature: pixels close to a
     mapped lineament are more geologically plausible for ore,
     per the Chikla synform precedent in Section 4.

  3. distance_to_sausar_boundary(bhukosh_shapefile_path, aoi) ->
     similar distance-transform raster but from the GSI Bhukosh
     lithology boundary (requires Phase 0's manual shapefile
     download). If the shapefile isn't present, raise a clear
     error telling the user to complete Phase 0 step 2.

Implement module1_reserve_mapping/fusion_model.py with:

  1. build_training_table(spectral_score, dist_lineament,
     dist_sausar_boundary, mines: dict) -> a pandas DataFrame with
     one row per pixel, columns [spectral_score, dist_lineament,
     dist_sausar_boundary, label], where label=1 for pixels within
     ~500m of a CONFIRMED mine coordinate and label=0 for randomly
     sampled background pixels (sample 10x as many negatives as
     positives). CRITICAL: exclude any candidate background pixel
     within 2km of ANY known mine (confirmed OR NEEDS_USER_INPUT
     placeholder district-center) from the negative pool — the belt
     is only partially explored, so a "background" pixel sampled too
     close to a known mine may itself be unmapped ore, and labeling
     it as a hard negative would poison the model. Explicitly document
     in a docstring that this is a positive-unlabeled learning setup
     with a small positive set, and that predicted probabilities
     should be interpreted as RELATIVE ranking, not calibrated
     absolute probability.

  2. train_fusion_model(training_table) -> trains an
     sklearn.ensemble.RandomForestClassifier (n_estimators=300,
     class_weight="balanced", max_depth=8 to avoid overfitting on
     a small positive set, random_state=42 for reproducibility),
     returns the fitted model plus feature_importances_ printed to
     console AND written to the model_runs table (Section 7) — after
     validate.py computes its LOOCV numbers, update that same
     model_runs row with loocv_avg_percentile and
     in_sample_avg_percentile rather than leaving them null.

  3. predict_reserve_surface(model, spectral_score, dist_lineament,
     dist_sausar_boundary) -> full-AOI probability raster.

  4. save_to_postgis(probability_raster, geotransform, db_connection)
     -> writes the raster as a set of (lat, lon, probability) point
     rows into the reserve_grid table (schema in Section 7). Use a
     reasonable downsampling (e.g. every 4th pixel) so the table
     stays a manageable size for a hackathon demo, not full
     native resolution.

Then implement module1_reserve_mapping/validate.py:
   IMPORTANT — do not validate the model on the same points it was
   trained on. With a small set of confirmed or source-backed positives,
   checking where those exact points rank after training ON those exact points is circular
   and will produce an artificially strong number that means nothing.
   If an evaluator asks "how did you validate this," a circular
   validation is worse than no validation — it signals the team didn't
   understand their own methodology.

   Implement genuine Leave-One-Out Cross-Validation instead:
     for each confirmed mine M in the 3-4 available:
         train_subset = all confirmed mines EXCEPT M
         retrain the fusion model using only train_subset as positives
         predict the probability surface
         record the percentile rank of M's location in that surface
     report the average LOOCV percentile across all held-out mines,
     not just a single in-sample number.

   This will almost certainly produce a weaker, more honest number
   than the in-sample version — that's expected and correct with only
   3-4 positive examples. State the LOOCV result AND explain the
   methodology out loud in the demo; a modest, honestly-validated
   number is more credible to an MOIL evaluator than an inflated
   in-sample one, and the fact that the team built LOOCV at all with
   such a small positive set is itself a signal of rigor.

   Also print the standard in-sample percentile alongside the LOOCV
   number, clearly labeled as "in-sample (optimistic, for reference
   only)" vs "leave-one-out (honest estimate)" — showing both,
   correctly labeled, is more defensible than showing only one.
```

**Acceptance test:** the LOOCV average percentile is meaningfully better than random (random expectation is the 50th percentile — anything consistently better than that across held-out mines is a real signal). Do not gate this on a specific number like "top 10-15%" — with only 3-4 positives, LOOCV results will be noisy, and a single unlucky held-out mine can swing the average significantly. If the LOOCV average is at or below the 50th percentile, that's a real signal to revisit feature engineering before proceeding. If it's meaningfully above 50th but below what an in-sample check would suggest, that's expected and fine — report both numbers honestly in the demo rather than gating on an arbitrary threshold.

---

### PHASE 3 — Module 2, Production Forecasting (THE INTEGRATION PHASE)

**Objective:** Build the production shortfall forecaster, and critically, wire it to consume Module 1's output — this is the step that makes the system genuinely integrated rather than three separate projects.

**PROMPT FOR CODING AGENT:**
```
Implement module2_production_forecast/synth_ops_generator.py:

  1. Ask the human team (print a clear prompt, don't proceed silently)
     for any real MOIL annual tonnage figures they've sourced from
     public annual reports or the IBM Yearbook manganese chapter. If
     none are provided, use these placeholder anchors and mark them
     CLEARLY as illustrative in every downstream chart/table:
       ANNUAL_TONNAGE_ANCHOR = 1_800_000  # tonnes, MOIL total, order
                                            # of magnitude from public
                                            # company profile — CONFIRM
                                            # exact figure before final
                                            # submission

  2. generate_synthetic_daily_production(mine_id, start_date, end_date,
     annual_tonnage_share) -> a pandas DataFrame with columns
     [date, mine_id, planned_tonnage, actual_tonnage, downtime_hours,
     rainfall_mm, blast_delay_flag]. Explicitly:
       - downtime_hours drawn from a Weibull distribution (shape=1.5,
         scale=4) — document this is a generic reliability-engineering
         assumption, not MOIL-specific data
       - rainfall_mm pulled from REAL era5_client.py output for that
         mine's coordinates and date — this part is real, not synthetic
       - blast_delay_flag drawn from a Poisson process, rate calibrated
         so delays occur roughly 1x per week — again generic, documented
         as such
       - actual_tonnage = planned_tonnage adjusted down by a function
         of downtime_hours, rainfall_mm (above a threshold, e.g. 40mm/
         day halts opencast operations), and blast_delay_flag

  3. Tag every row with a "data_provenance" column: either "synthetic"
     or "real_era5_weather" so the dashboard can visually distinguish
     what's real from what's simulated.

Implement module2_production_forecast/forecast_model.py:

  1. build_features(production_df, reserve_grid_db_connection) ->
     THIS IS THE INTEGRATION STEP. For each mine, query the
     reserve_grid table (Module 1's output) for the average predicted
     manganese probability within a small radius of that mine's
     current coordinates, and add it as a feature column
     "local_reserve_confidence". Also add lag features (production
     t-1, t-7, t-30) and rolling averages.

  2. train_shortfall_model(features_df) -> XGBoost regressor predicting
     next-30-day production, trained with the reserve-confidence
     feature INCLUDED. Print feature importance and explicitly
     confirm "local_reserve_confidence" appears with non-trivial
     importance — if it doesn't, that's fine to report honestly
     (it may be a weak signal at this synthetic-data scale) but it
     must be documented either way, since the presence of the
     cross-module feature in the training table is what satisfies
     the integration requirement, whether or not the model finds it
     highly predictive.

  3. predict_shortfall_risk(model, mine_id, current_features) ->
     returns {predicted_production, planned_production,
     shortfall_probability, dominant_driver} where dominant_driver
     is picked via SHAP values (use shap.TreeExplainer) identifying
     which feature contributed most to a below-target prediction.
```

**Acceptance test:** the training feature table for Module 2 provably contains a column sourced from Module 1's database output (not a hardcoded stand-in) — inspect the SQL query in `build_features` to confirm it's a real query against `reserve_grid`, not a mocked value.

---

### PHASE 4 — Module 3, Recommendation Engine + Dashboard

**Objective:** Turn the two modules' outputs into a usable decision-support interface.

**PROMPT FOR CODING AGENT:**
```
Implement module3_recommendations/rules_engine.py with a pure-function
decision table (NOT an LLM call):

  def recommend(shortfall_risk: dict) -> dict:
      driver = shortfall_risk["dominant_driver"]
      if driver == "downtime_hours":
          action = "equipment_redeployment"
          detail = "Redeploy available equipment from the nearest " \
                    "underutilised mine; review maintenance schedule."
      elif driver == "rainfall_mm":
          action = "advance_stockpiling"
          detail = "Increase pre-monsoon stockpile buffer for this " \
                    "mine given upcoming rainfall forecast."
      elif driver == "local_reserve_confidence":
          action = "redirect_development"
          detail = "Current working face shows declining reserve " \
                    "confidence; Module 1 output indicates a higher- " \
                    "confidence zone nearby — see reserve map overlay."
      else:
          action = "monitor"
          detail = "No single dominant driver identified; continue " \
                    "standard monitoring."
      return {"action": action, "detail": detail, "driver": driver}

This function must be fully deterministic and unit-testable. Write
tests/test_rules_engine.py covering all four branches.

Implement module3_recommendations/llm_explainer.py:

  def explain_in_natural_language(recommendation: dict,
                                    mine_context: dict) -> str:
      # Calls a LOCAL Ollama instance running llama3:8b-instruct
      # (confirm with the user whether Ollama is installed; if not,
      # print exact install instructions: `curl -fsSL
      # https://ollama.com/install.sh | sh` then `ollama pull llama3:8b`)
      # The prompt template below takes the ALREADY-DECIDED
      # recommendation dict and mine context, and asks the LLM ONLY
      # to phrase it as a readable paragraph — never to decide the
      # action itself.

      prompt = f"""You are writing a short operational note for MOIL
mine planning staff. Do not invent any facts beyond what is given below.

Mine: {mine_context['name']} ({mine_context['district']})
Recommended action: {recommendation['action']}
Reasoning: {recommendation['detail']}
Driver identified: {recommendation['driver']}

Write this as a 2-3 sentence plain-English note a planning officer
could read in 10 seconds. Do not add numbers, dates, or facts that
were not given above."""

      # ... call ollama via the `ollama` python package or REST API
      # at localhost:11434/api/generate

Build the FastAPI backend per Section 8's exact endpoint contracts.

For the frontend: ask the user (Section 2, Q8) whether to build React+
Leaflet or Streamlit before writing any frontend code, since this
determines the entire folder structure of frontend/.
```

**Acceptance test:** calling `/recommendations/{mine_id}` returns a response where the `action` and `driver` fields come from `rules_engine.py`'s deterministic logic (verifiable by unit test) and only the `explanation_text` field comes from the LLM call — confirm this separation is visible in the response schema (Section 8).

---

### PHASE 5 — Integration Test + Demo Prep

**PROMPT FOR CODING AGENT:**
```
Write an end-to-end integration test (tests/test_e2e.py) that:
  1. Confirms module1's reserve_grid table is populated
  2. Confirms module2's forecast query against reserve_grid returns
     non-null local_reserve_confidence values for at least the
     confirmed mines
  3. Hits every API endpoint in Section 8 and validates response
     schemas
  4. Confirms the dashboard loads and renders the reserve heatmap
     layer without errors (headless browser check via Playwright,
     or ask the user to do this manually if Playwright setup is
     too time-costly for the remaining budget)

Then write a DEMO_SCRIPT.md with this exact narrative structure:
   1. Open on the reserve probability map. State explicitly: "Red
      zones show where our deterministic screening surface ranks reserve
      probability highest around source-backed mine locality points."
  2. Zoom to Balaghat, point out the known mine sits in a high-
     probability zone — this is the validation moment, say the
     LOOCV average percentile from Phase 2's validate.py out loud,
     and briefly explain it's leave-one-out (not in-sample) precisely
     so the number can be trusted. This one sentence of methodology
     is worth more in front of an evaluator than a bigger but
     unexplained number.
  3. Pan to an unexplored high-probability zone nearby, state this
     is a drilling-priority recommendation, not a certainty claim.
  4. Switch to a specific mine's production forecast chart, point
     out the shortfall risk and identified driver.
  5. Show the recommendation panel, read the natural-language note.
  6. Close by stating the explicit limitation: this is a screening
     and prioritization tool for where MOIL should send drilling
     crews and how they should plan equipment allocation — not a
     replacement for physical exploration.
```

---

## 7. DATABASE SCHEMA (PostgreSQL + PostGIS)

```sql
-- db/schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE mines (
    mine_id         VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    district        VARCHAR(100),
    mine_type       VARCHAR(30),  -- underground / opencast
    coordinate_status VARCHAR(30), -- confirmed / town_proxy / needs_input
    geom            GEOGRAPHY(POINT, 4326)
);

CREATE TABLE model_runs (
    model_version   VARCHAR(20) PRIMARY KEY,
    module          VARCHAR(30) NOT NULL,  -- 'reserve_mapping' or 'production_forecast'
    trained_at      TIMESTAMP DEFAULT NOW(),
    n_positive_examples INT,               -- e.g. 3 or 4 confirmed mines used
    loocv_avg_percentile FLOAT,            -- Module 1 only, from validate.py
    in_sample_avg_percentile FLOAT,        -- Module 1 only, labeled as optimistic
    feature_importances JSONB,             -- printed dict from training, stored not just logged
    notes           TEXT                    -- e.g. "Chikla coordinates unresolved at train time"
);
-- Every model_version referenced in reserve_grid or shortfall_forecasts
-- should have a matching row here — this is what makes a prediction
-- auditable after the fact ("which model made this call, and how was
-- it validated") rather than a number with no traceable origin.

CREATE TABLE reserve_grid (
    id              SERIAL PRIMARY KEY,
    geom            GEOGRAPHY(POINT, 4326) NOT NULL,
    spectral_score  FLOAT,
    dist_lineament_m FLOAT,
    dist_sausar_boundary_m FLOAT,
    reserve_probability FLOAT NOT NULL,
    model_version   VARCHAR(20),
    computed_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_reserve_grid_geom ON reserve_grid USING GIST(geom);

CREATE TABLE production_history (
    id              SERIAL PRIMARY KEY,
    mine_id         VARCHAR(50) REFERENCES mines(mine_id),
    date            DATE NOT NULL,
    planned_tonnage FLOAT,
    actual_tonnage  FLOAT,
    downtime_hours  FLOAT,
    rainfall_mm     FLOAT,
    blast_delay_flag BOOLEAN,
    data_provenance VARCHAR(30) NOT NULL  -- 'synthetic' or 'real_era5_weather'
);

CREATE TABLE shortfall_forecasts (
    id              SERIAL PRIMARY KEY,
    mine_id         VARCHAR(50) REFERENCES mines(mine_id),
    forecast_date   DATE NOT NULL,
    horizon_days    INT NOT NULL,  -- 30 / 60 / 90
    predicted_tonnage FLOAT,
    planned_tonnage FLOAT,
    shortfall_probability FLOAT,
    dominant_driver VARCHAR(50),
    local_reserve_confidence FLOAT,  -- the cross-module feature, stored
                                       -- explicitly so it's auditable
    model_version   VARCHAR(20),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recommendations (
    id              SERIAL PRIMARY KEY,
    mine_id         VARCHAR(50) REFERENCES mines(mine_id),
    forecast_id     INT REFERENCES shortfall_forecasts(id),
    action          VARCHAR(50) NOT NULL,   -- from rules_engine.py, deterministic
    detail          TEXT NOT NULL,           -- from rules_engine.py, deterministic
    explanation_text TEXT,                    -- from LLM, phrasing only
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 8. API CONTRACT (FastAPI)

```
GET  /mines
     -> list all mines with coordinates + status

GET  /reserves/heatmap?bbox=<min_lon>,<min_lat>,<max_lon>,<max_lat>
     -> GeoJSON FeatureCollection of reserve_grid points within bbox,
        for the Leaflet/deck.gl overlay

GET  /reserves/validation
     -> { "confirmed_mines_checked": int,
          "avg_percentile_rank": float,
          "per_mine": [{"mine_id": str, "percentile": float}] }
        -- this is Phase 2's validate.py output, served live

GET  /production/{mine_id}/history?days=90
     -> production_history rows for charting

GET  /production/{mine_id}/forecast?horizon=30
     -> { "predicted_tonnage": float, "planned_tonnage": float,
          "shortfall_probability": float, "dominant_driver": str,
          "local_reserve_confidence": float }

GET  /recommendations/{mine_id}?horizon=30
     -> { "action": str, "detail": str,          # from rules_engine.py
          "explanation_text": str,                # from llm_explainer.py
          "driver": str }
```

`GET /recommendations/{mine_id}` must NOT require the caller to already have a forecast in hand — the route handler internally calls the same forecasting logic used by `/production/{mine_id}/forecast` (import and call `predict_shortfall_risk()` directly, or call the sibling endpoint internally — do not duplicate the forecasting logic in two places), then passes that result into `rules_engine.recommend()`, then passes the result of THAT into `llm_explainer.explain_in_natural_language()`. This three-step chain happening inside one route handler is what the response schema's three provenance-separated fields (`action`/`detail` from rules, `explanation_text` from LLM) are documenting — make sure the actual code path matches, not just the schema.

Every response model must be defined as a Pydantic schema in `api/schemas.py` — do not return raw dicts from route handlers.

---

## 9. FRONTEND — TWO PATHS (pick based on Section 2 Q8 answer)

**If Streamlit (faster, lower risk, recommended if the finale time budget is tight):** a single `app.py` with `st.map` or `pydeck` for the heatmap layer, `st.line_chart` for production forecasts, and a sidebar mine-selector. Can be built in a few hours by one person.

**If React + Leaflet (more professional look, higher risk, only if the team has a frontend-strong member with time to spare):**
```
frontend/
├── src/
│   ├── components/
│   │   ├── ReserveMap.jsx       # Leaflet map, GeoJSON heatmap layer
│   │   ├── MineSelector.jsx
│   │   ├── ForecastChart.jsx    # recharts line chart
│   │   └── RecommendationPanel.jsx
│   ├── api/client.js             # fetch wrappers for Section 8 endpoints
│   └── App.jsx
```
Do not attempt both — pick one based on the honest answer to Q8, since half-building both wastes the most scarce resource (time) in a 36-hour build.

---

## 10. DOCKER DEPLOYMENT

```yaml
# docker-compose.yml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: moil_mrip
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
  api:
    build:
      context: .              # NOT ./api — the API imports code from
      dockerfile: api/Dockerfile   # module1_reserve_mapping/, module2_.../
    depends_on: [db]               # etc., which live at repo root. A build
    environment:                    # context scoped to ./api cannot see
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/moil_mrip  # them — this is a real bug if built as
    ports: ["8000:8000"]             # `build: ./api` and must use the repo
  ollama:                             # root as context instead, with the
    image: ollama/ollama                 # Dockerfile path pointing into api/.
    volumes:
      - ollama_models:/root/.ollama
    ports: ["11434:11434"]
  frontend:
    build: ./frontend
    ports: ["3000:3000"]   # 8501:8501 instead if Streamlit — this whole
    environment:             # service block changes shape depending on
      VITE_API_URL: http://localhost:8000  # the Section 2 Q8 answer, so
                                              # don't build this section
                                              # until Q8 is answered
volumes:
  pgdata:
  ollama_models:
```

`api/Dockerfile` must therefore `COPY` the whole repo (or at minimum `ingestion/`, `module1_reserve_mapping/`, `module2_production_forecast/`, `module3_recommendations/`, and `api/` itself) into the image — not just the `api/` folder — since `main.py` imports across those module boundaries.

Add `from fastapi.middleware.cors import CORSMiddleware` to `api/main.py` and allow the frontend's origin (`http://localhost:3000` or `:8501`) — without this, the browser will silently block every frontend request to the API and the first symptom will look like a broken dashboard, not an obvious CORS error, so get this in from Phase 4 rather than debugging it late.

This must run with **zero internet dependency at demo time** except the one-time `ollama pull llama3:8b` done in advance — everything else is local containers talking to a local Postgres.

---

## 11. DATA ATTRIBUTION & LICENSING (do not skip — this is public-sector software)

State these explicitly somewhere in the repo (`DATA_SOURCES.md`) and, ideally, as a footer line in the dashboard itself — a system pitched for actual MOIL/Ministry of Steel adoption should not quietly omit where its inputs came from:

- **Sentinel-1 / Sentinel-2**: © Copernicus Programme / ESA. Free and open under the Copernicus Sentinel Data Terms and Conditions; attribution required, redistribution of raw data has conditions — check current terms at the point of any public release, not just at build time.
- **ASTER**: distributed by NASA LP DAAC / METI (Japan). Free for research and most non-commercial use via NASA Earthdata; note the data has its own usage policy separate from Sentinel's.
- **GSI Bhukosh**: released under India's National Data Sharing and Accessibility Policy (NDSAP) — free for use, attribute as "Geological Survey of India, Bhukosh portal."
- **ERA5**: © Copernicus Climate Change Service (C3S), Copernicus Climate Data Store — free with attribution.
- **MOIL production figures**: sourced from public annual reports / IBM Yearbook — cite the specific report and year used, not just "MOIL public data."

None of this blocks a hackathon demo, but a system explicitly pitched as "ready to be used across MOIL offices" should have this documented from day one rather than retrofitted later if it's ever actually deployed.

---

## 12. PRODUCTION HARDENING — DELIBERATELY OUT OF SCOPE FOR THIS BUILD

State this section's contents plainly if asked "is this ready for production" in the demo — the honest answer is "this is a validated MVP architecture; here's specifically what a real deployment would still need," and having that list ready is more credible than implying the hackathon build is already production-hardened when it isn't:

- **Authentication / role-based access** — currently zero auth on any API route. A real multi-office deployment needs per-office login and role separation (planning staff vs. read-only viewers, at minimum).
- **Scheduled data refresh** — Module 1's satellite ingestion and Module 2's weather pull are currently one-time manual runs (Phase 0). A production system needs a scheduled job (cron, or a lightweight scheduler like APScheduler) to re-pull Sentinel/ERA5 data on a sensible cadence (weekly for cloud-free composite rebuilding is reasonable given Sentinel-2's ~5-day revisit) and retrain/refresh `model_runs` accordingly.
- **Secrets management** — `.env` files are fine for a hackathon; a real deployment should use a proper secrets manager rather than plaintext files, even locally.
- **HTTPS / network exposure** — the Docker Compose setup here assumes local-only access; any real network exposure needs TLS termination and firewall rules that are out of scope here.
- **Monitoring / logging** — no centralized logging or alerting is specified. A real system needs to know when the GEE quota is exhausted, when a scheduled refresh fails, or when the LLM service is unreachable, none of which currently surface anywhere.
- **Backup strategy** — the PostGIS volume has no backup story here.

Listing this out loud is a strength in the demo, not a weakness — it shows the team understands the difference between "a validated MVP" and "a production system," which is exactly the distinction a sophisticated evaluator is listening for.

---

## 13. FINAL PRE-SUBMISSION CHECKLIST

- [ ] Every mine coordinate has a recorded source and confidence; replace locality screening points with MOIL lease or GSI Bhukosh geometry before final scientific use
- [ ] `db/seed.py` has actually been run and the `mines` table is populated — don't discover at demo time that it was only ever specified, never executed
- [ ] Raster grid alignment (`grid_alignment.py`) confirmed to run before structural/fusion feature stacking — spot check that spectral, lineament, and boundary-distance rasters have identical shape and geotransform before they're combined
- [ ] Validation number quoted in the demo is the **LOOCV** average, explicitly labeled as such — not the in-sample number, and the difference between the two is understood by whoever presents
- [ ] `model_runs` table has a row for the model version actually running in the demo, with LOOCV numbers filled in — not null
- [ ] Every synthetic data table/chart visually labeled as synthetic in the UI, and `data_provenance` column is actually populated correctly, not defaulted to one value everywhere
- [ ] `local_reserve_confidence` cross-module feature confirmed present in Module 2's training data via an actual SQL query against `reserve_grid` (this is the integration proof point — have this query result ready to show if asked)
- [ ] LLM explanation text never contains a number or fact not present in the `rules_engine.py` output it was given — spot-check a few generated explanations against their inputs
- [ ] CORS is configured and the frontend can actually reach the API across the container network, tested, not assumed
- [ ] `api/Dockerfile`'s build context is the repo root, not `./api` — confirm the built image actually contains `module1_reserve_mapping/` etc. by shelling into the container if unsure
- [ ] Full Docker Compose stack starts clean on a fresh machine with only `.env` filled in
- [ ] `DATA_SOURCES.md` exists and is accurate
- [ ] Demo script rehearsed at least twice end-to-end, including the explicit "here's what's deliberately out of scope" line from Section 12 if the team is asked about production-readiness

