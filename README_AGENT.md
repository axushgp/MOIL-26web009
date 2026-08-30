# README.md — Context Primer for Coding Agents
# Project: MOIL Manganese Reserve Intelligence Platform (MRIP)
# PS: SIH26009 — AI/ML + Space Technology for Manganese Reserve Identification

> **This file is written for AI coding agents, not humans.** It is meant to be the first thing an agent reads when opening this repository — whether that's Claude Code starting a session, a fresh agent picking up mid-build, or an agent resuming after context was reset. Read this file in full before touching any code, running any command, or making any assumption about the project. Everything below is either a fact you can rely on, a rule you must follow, or a pointer to where the fact/rule is elaborated in more depth.
>
> Two companion documents sit alongside this one and contain the full detail this file only summarizes:
> - `SIH26009_MOIL_Build_Guide.md` — the narrative rationale: why this problem is winnable, what "sophistication" means for this specific system, and the build order reasoning at a conceptual level.
> - `SIH26009_CODING_AGENT_SPEC.md` — the executable spec: exact file structure, phase-by-phase prompts, starter code, database schema, API contracts, and acceptance tests. **This is the file to follow when actually writing code.** This README is the map; that file is the territory.
>
> If anything in this README appears to conflict with the CODING_AGENT_SPEC file, the CODING_AGENT_SPEC file wins — this README is a summary and could theoretically drift out of sync with a future edit to that file; treat it as the higher-trust source when in doubt, and flag the discrepancy rather than silently picking one.

---

## 1. WHAT THIS PROJECT IS, IN ONE PARAGRAPH

A web platform for MOIL Limited (India's largest manganese ore producer, a Ministry of Steel PSU) that does two connected things: (1) predicts where unexplored manganese reserves are likely to be found, by fusing satellite imagery with real, published geological structure specific to MOIL's actual mining belt, and (2) predicts production shortfall risk at each of MOIL's mines, using real weather/soil data plus calibrated operational simulation, where declining reserve confidence at a mine directly feeds into that mine's shortfall risk. A recommendation layer turns both outputs into plain-language corrective actions. Everything surfaces on one dashboard. Three modules, one integrated system — this phrase matters and recurs throughout this document because the single biggest failure mode for this project is building three disconnected demos instead of one system, and every architectural decision below exists partly to prevent that.

---

## 2. THE DOMAIN — READ THIS BEFORE WRITING ANY MODULE 1 CODE

This section exists because Module 1 (reserve mapping) cannot be built correctly, or defended credibly in front of an evaluator, without this context. Do not skip it because it looks like background reading rather than a spec.

### 2.1 — MOIL and its mines

MOIL Limited operates **10 mines** across two regions:
- **Nagpur/Bhandara districts, Maharashtra:** Kandri, Mansar (also spelled Munsar), Beldongri, Gumgaon, Chikla (underground); Dongri Buzurg, Sitapatore (opencast)
- **Balaghat district, Madhya Pradesh:** Balaghat mine (largest and deepest, ~383m depth, underground since 1903), Ukwa (opencast), Tirodi

All roughly a century old. The preview carries source-backed screening points for all ten, with confidence recorded per mine — see Section 4 of CODING_AGENT_SPEC.md for the exact table. These are not lease-boundary surveys and must be replaced with MOIL or GSI geometry for a final scientific run. This is a running theme in this project: real, checkable specificity where we have it, honest uncertainty where we don't, never a fabricated middle ground.

### 2.2 — The geology (this is the actual technical edge of this project)

MOIL's ore sits in the **Sausar Group**: a named, peer-reviewed, Mesoproterozoic metasedimentary fold belt, ~200km long running from Balaghat to Nagpur, ~25km wide, striking ENE-WSW to NNE-SSW, dipping 45-70° south. The ore itself occurs as **"gondite"** — a specific manganese-silicate metasedimentary rock type — hosted at particular stratigraphic horizons within that belt, frequently at contacts between named rock formations (e.g. the documented Mansar–Sitasaongi formation contact at Chikla mine), and **structurally concentrated in fold hinges and shear zones**. Chikla is the single best-documented case: ore occurs at the core of a **plunging synform** (a specific fold geometry). Ore mineral assemblage: braunite, bixbyite, hausmannite, hollandite, jacobsite, vredenburgite, pyrolusite, cryptomelane, psilomelane.

**Why an agent must internalize this:** manganese here is not randomly scattered rock you can find by scanning for a color signature from orbit. It occurs where a *specific rock unit* is present AND where *specific structural geometry* has concentrated it. A model built on spectral signal alone is doing a fundamentally weaker version of this problem than a model that also incorporates structural proximity (to lineaments/folds) and stratigraphic proximity (to the mapped Sausar Group boundary). This is the single largest source of genuine technical sophistication in the whole project, and it's also the thing most competing solutions to this same problem statement will skip. Do not simplify Module 1 down to "spectral classifier" — that throws away the actual differentiator.

### 2.3 — What "identify sub-surface reserves" honestly means here

No satellite can see 300+ meters underground. Nothing can, without drilling. When this project's outputs are described as identifying "sub-surface indicators," that means: structural and stratigraphic surface proxies that are geologically known to correlate with what's below (per 2.2), producing a **probability-ranked exploration-targeting map** — the same epistemic posture the actual mining industry uses this class of remote-sensing technology for. Never let code, UI copy, or a demo narrative imply certainty about subsurface content that the system cannot actually possess. This honesty is a credibility asset in front of a domain-expert evaluator, not a weakness to hide.

---

## 3. SYSTEM ARCHITECTURE — THE SHAPE OF THE WHOLE SYSTEM

```
MODULE 1: RESERVE MAPPING
  Satellite ingestion (Sentinel-1/2, ASTER via GEE) + GSI Bhukosh geology
  → Spectral analysis (band ratios, + NDVI/LST as secondary signals)
  → Structural analysis (SAR lineament proximity, Sausar boundary proximity)
  → Fusion model (Random Forest, LOOCV-validated against known mines)
  → Reserve probability surface, written to `reserve_grid` table
        │
        │  THE INTEGRATION POINT — a real SQL query, not a mocked value:
        │  Module 2 queries `reserve_grid` for "local_reserve_confidence"
        │  at each mine and uses it as a training feature.
        ▼
MODULE 2: PRODUCTION FORECASTING
  Real ERA5 rainfall + real SAR-derived soil moisture + calibrated
  synthetic equipment/blast data + local_reserve_confidence from Module 1
  → XGBoost regressor → shortfall probability + SHAP-attributed driver
        │
        ▼
MODULE 3: RECOMMENDATION & DASHBOARD
  Deterministic rules engine (driver → action) — the LLM (Ollama/Llama-3)
  ONLY phrases the rules engine's output as a sentence, it never decides
  anything → FastAPI → dashboard (map + charts + recommendation panel)
```

**The one fact about this architecture that must never be lost across a context reset:** Module 2's forecast model must contain a feature that is the product of a real database query against Module 1's output table. This is what separates "one integrated system" from "three hackathon projects stapled together," and it is explicitly checked by an acceptance test (see CODING_AGENT_SPEC.md Phase 3). If you find yourself building Module 2 without this query — even a placeholder version — stop, that's the single most important structural requirement in the whole project.

**The one rule about the LLM that must never be lost:** the Rules Engine (`module3_recommendations/rules_engine.py`) is a deterministic, pure, unit-tested function. The LLM (`llm_explainer.py`) is called *after* the rules engine has already decided everything, and its only job is turning a structured decision into a readable sentence. If any business logic, scoring, or decision-making ever ends up inside an LLM prompt, that is a regression against the core design principle of this system and must be reverted, not rationalized.

---

## 4. PROBLEM STATEMENT TRACEABILITY — DO NOT LOSE THIS TABLE

The original PS names specific sub-problems and specific satellite inputs. This table is the canonical check for whether the codebase actually satisfies the PS as written, not just something plausible-sounding. This table was built after a gap-analysis review found three real omissions (vegetation index, land temperature, and two of three named corrective actions were unimplemented) — those gaps are now closed in the current spec, and this table is what prevents them from silently reopening in a future edit.

| PS requirement | Where it lives in the codebase | Confirm before demo |
|---|---|---|
| Reserves from surface indicators | `module1_reserve_mapping/spectral.py` | Band-ratio separation test passes (Phase 1 acceptance test) |
| Reserves from sub-surface indicators | `module1_reserve_mapping/structural.py` (structural proxy, honestly framed per §2.3) | LOOCV validation number is quoted correctly as LOOCV, not in-sample |
| Rainfall input | `ingestion/era5_client.py` (real data) | — |
| Soil moisture input | `ingestion/soil_moisture.py` (SAR-derived, real, gap-fix) | `soil_moisture_pct` populated for confirmed mines, not defaulted |
| Vegetation index input | `module1_reserve_mapping/spectral.py::compute_ndvi` (gap-fix) | Feature importance actually printed and reviewed |
| Land temperature input | `module1_reserve_mapping/spectral.py::compute_land_surface_temperature` (gap-fix) | Feature importance actually printed and reviewed |
| Shortfall prediction — equipment downtime | `module2_production_forecast/forecast_model.py` | — |
| Shortfall prediction — weather | same, via rainfall_mm + soil_moisture_pct | — |
| Shortfall prediction — blasting delays | same, via blast_delay_flag | — |
| Corrective action — re-deploy equipment | `rules_engine.py` → `equipment_redeployment` | — |
| Corrective action — optimize blasting | `rules_engine.py` → `optimize_blast_schedule` (gap-fix) | Unit test exists for this branch |
| Corrective action — adjust mine schedule | `rules_engine.py` → `adjust_mine_schedule` (gap-fix) | Unit test exists for this branch |
| Dashboard: predicted reserves | Frontend map layer, `/reserves/heatmap` | — |
| Dashboard: production trends | `/production/{mine_id}/history` | — |
| Dashboard: shortfall risk | `/production/{mine_id}/forecast` | — |
| Dashboard: recommended steps | `/recommendations/{mine_id}` | — |

If any future change to this codebase removes or breaks one of these mappings, that is a regression against the actual problem statement, not just a refactor — treat it with the same seriousness as a failing test.

---

## 5. NON-NEGOTIABLE RULES FOR ANY AGENT WORKING IN THIS REPO

These are absolute, not stylistic preferences. Restated here because they are the rules most likely to be silently violated by an agent optimizing for "looks impressive" over "is honest and correct."

1. **Never invent MOIL production data, mine coordinates, or survey results.** Every coordinate in the preview has a recorded public source and confidence; locality-level points remain explicitly approximate and must not be presented as lease surveys. If no source-backed point exists, flag it `ASK USER` or `NEEDS_USER_INPUT` rather than filling in a plausible-looking placeholder.
2. **Never present synthetic data as real, anywhere** — not in a variable name, not in a docstring, not in the UI. Every synthetic value carries a `data_provenance` tag (`"synthetic"` vs. `"real_era5_weather"` / `"real_satellite_derived"`), and the dashboard must visually distinguish them, not just store the distinction invisibly in the database.
3. **The LLM never decides anything.** It phrases what the rules engine and trained models have already decided. See Section 3 above.
4. **Validate reserve-mapping predictions with Leave-One-Out Cross-Validation, never in-sample-only.** The preview uses ten source-backed screening points and reports the computed LOOCV average; a connected scientific run must use the strongest available mine geometries and still report the honest held-out result, never an in-sample score.
5. **Align every raster to one common grid before combining features.** ASTER (~30m), Sentinel-1 (~10m), and vector shapefiles are not natively on the same pixel grid — `module1_reserve_mapping/grid_alignment.py` must run before any feature stacking, or features will silently misalign in a way that looks fine but is mathematically wrong.
6. **Exclude a 2km buffer around all known mines from the negative-training sample pool in Module 1.** The belt is only partially explored; a "background" pixel too close to a known mine might itself be unmapped ore, and labeling it a hard negative would poison the fusion model.
7. **Build in phase order. Do not start a phase until the previous phase's acceptance test passes.** Full phase-by-phase detail is in CODING_AGENT_SPEC.md Section 6 — that is the authoritative build sequence, this README only summarizes that it exists and must be followed in order.
8. **Commit after every phase**, so the repository is in a working, demoable state at every checkpoint, not just at the very end.

---

## 6. REPOSITORY MAP

```
moil-mrip/
├── requirements.txt          # pinned Python deps (repo root, not per-module)
├── docker-compose.yml         # db + api + ollama + frontend, see spec §10
├── .env.example                # documents every required credential
├── .gitignore                   # secrets/, .env, data/raw|processed/
├── DATA_SOURCES.md               # attribution/licensing for every data source
├── secrets/                       # gitignored — gee_key.json etc. live here
├── data/{raw,processed,synthetic}/
├── ingestion/
│   ├── config.py                # AOI bounds + MINES coordinate table
│   ├── gee_client.py             # Sentinel-1/2, ASTER via Earth Engine
│   ├── bhukosh_loader.py          # GSI shapefile parsing
│   ├── era5_client.py              # real rainfall history
│   └── soil_moisture.py             # real SAR-derived soil moisture (gap-fix)
├── module1_reserve_mapping/
│   ├── grid_alignment.py             # MUST run before feature stacking
│   ├── spectral.py                    # band ratios + NDVI + LST (gap-fix)
│   ├── structural.py                   # SAR lineaments, boundary distance
│   ├── fusion_model.py                  # Random Forest, writes model_runs
│   └── validate.py                       # LOOCV — see Rule #4 above
├── module2_production_forecast/
│   ├── synth_ops_generator.py            # calibrated synthetic + real inputs
│   ├── weather_loader.py
│   └── forecast_model.py                   # THE integration query lives here
├── module3_recommendations/
│   ├── rules_engine.py                      # deterministic, 7 branches, unit-tested
│   └── llm_explainer.py                      # Ollama, phrasing ONLY — see Rule #3
├── db/
│   ├── schema.sql                             # mines, reserve_grid, model_runs,
│   │                                              # production_history,
│   │                                              # shortfall_forecasts, recommendations
│   └── seed.py                                 # populates `mines` — run after schema.sql
├── api/
│   ├── Dockerfile                                # build context = repo ROOT, not ./api
│   ├── main.py                                    # FastAPI + CORS middleware
│   ├── routers/{reserves,production,recommendations}.py
│   └── schemas.py                                     # Pydantic response models
├── frontend/                                        # React+Leaflet OR Streamlit —
│                                                         # confirm which before building
└── tests/                                              # one test file per module,
                                                            # plus test_e2e.py
```

For the exact contents and build prompt for every file above, see `SIH26009_CODING_AGENT_SPEC.md` Sections 5-10 — that document has the literal prompt text to give a coding agent for each phase, plus starter code for the non-obvious parts (band-ratio candidate testing, LOOCV loop, the deterministic rules table, the Docker build-context fix).

---

## 7. VERIFIED DATA SOURCES (all free, all confirmed accessible)

| Source | What it provides | Used in |
|---|---|---|
| Google Earth Engine (`earthengine-api` + `geemap`) | Sentinel-1 SAR, Sentinel-2 MSI, ASTER L1T | Module 1, ingestion/gee_client.py |
| GSI Bhukosh (bhukosh.gsi.gov.in) | Lithology shapefiles, mapped Sausar Group boundary | Module 1, ingestion/bhukosh_loader.py |
| Copernicus Climate Data Store (ERA5) | Real hourly rainfall history | Module 2, ingestion/era5_client.py |
| Sentinel-1 SAR (reused from Module 1) | Soil moisture proxy via backscatter | Module 2, ingestion/soil_moisture.py (gap-fix) |
| MOIL Annual Reports / IBM Yearbook (public PDFs) | Real production tonnage figures to anchor synthetic data | Module 2, synth_ops_generator.py |
| Published ASTER-manganese literature (Oman, Pakistan Bela ophiolite studies) | Validated band-ratio methodology | Module 1, spectral.py — see the "do not hallucinate a band-ratio formula" warning in CODING_AGENT_SPEC.md §4 |

Full attribution/licensing text (Copernicus terms, NASA/METI ASTER terms, GSI NDSAP terms) belongs in `DATA_SOURCES.md` at build time — see CODING_AGENT_SPEC.md Section 11 for the exact required wording per source.

---

## 8. WHAT "DONE" LOOKS LIKE

The full pre-submission checklist lives in CODING_AGENT_SPEC.md Section 13 and should be treated as the actual gate, not this summary. At minimum, an agent should never consider this project complete unless:

- Every row in Section 4 of this README (the PS traceability table) has a real, demonstrable code path
- The LOOCV validation number, not the in-sample number, is what's quoted anywhere the model's accuracy is reported
- Module 2's training data provably contains a real query result from Module 1's `reserve_grid` table
- Every synthetic value is visually and structurally distinguishable from real data, everywhere it appears
- The full Docker Compose stack starts clean on a machine that has only `.env` filled in — nothing else assumed

---

## 9. DELIBERATELY OUT OF SCOPE FOR THIS BUILD

Authentication/RBAC, scheduled data refresh, production secrets management, HTTPS/network hardening, centralized monitoring, and backup strategy are all explicitly deferred — see CODING_AGENT_SPEC.md Section 12 for the full reasoning. An agent should not attempt to silently add production-hardening scope that wasn't asked for, and should not claim the MVP is production-ready without this caveat attached. Stating this list out loud when relevant is a credibility strength, not an admission of incompleteness.

