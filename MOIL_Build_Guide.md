# SIH26009 — Full Build Guide
## AI/ML + Space Technology for Manganese Reserve Identification (MOIL)

*This is a real engineering spec, grounded in actual MOIL geology, actual open data sources, and a real technical architecture. Every data source cited below was verified to exist and be accessible before writing this.*

---

## Part 1 — The Ground Truth You're Building Against

Before any code, you need to actually understand what you're modelling. This is the part almost every competing team will skip, and it is the entire reason this PS is winnable.

**MOIL operates 10 mines** across two regions: six in Nagpur and Bhandara districts of Maharashtra (Kandri, Munsar/Mansar, Beldongri, Gumgaon, Chikla, Ukwa — mostly underground; Dongri Buzurg and Sitapatore are opencast), and four in Balaghat district of Madhya Pradesh (Balaghat mine is the largest and deepest, at ~383m depth; Tirodi mine also sits here). All are roughly a century old.

**The geology is a named, well-studied Precambrian belt.** MOIL's ore does not sit in random geology — it sits in the **Sausar Group**, a Mesoproterozoic metasedimentary fold belt stretching approximately 200km from Balaghat in the east to Nagpur in the west, roughly 25km wide, striking predominantly ENE-WSW to NNE-SSW with 45°-70° southward dips. The manganese ore occurs as **"gondites"** — a specific manganese-silicate-rich metasedimentary rock type — hosted at specific stratigraphic horizons within the Sausar sequence, structurally controlled by folded shear zones and synclinal basins. The ore minerals are a known assemblage: braunite, bixbyite, hausmannite, hollandite, jacobsite, vredenburgite, pyrolusite, cryptomelane, psilomelane.

**Why this matters for your build:** this is not "find shiny rocks from space." This is a *structurally controlled, stratigraphically hosted* deposit type. Manganese doesn't occur randomly across the landscape — it occurs where a specific rock unit (the ore-bearing gondite horizon within the Sausar Group) is exposed or shallowly buried, AND where structural features (folds, shear zones) have concentrated it. A model that only looks at surface spectral colour and ignores structural geology will produce a probability map that looks impressive but is geologically meaningless. A model that combines spectral indicators WITH structural/stratigraphic context is doing what an actual exploration geologist does. This is your entire competitive edge over every other team that will just run a spectral classifier and call it done.

**Real, verified, freely accessible data sources you will use:**

1. **GSI Bhukosh** (bhukosh.gsi.gov.in) — Geological Survey of India's open data portal. Provides lithology shapefiles, geological maps, and mineral occurrence maps for the Nagpur-Bhandara-Balaghat belt, free download, no paywall. This gives you the actual mapped extent of the Sausar Group and known lithological boundaries — your ground truth layer for "where is the ore-bearing rock unit."

2. **Google Earth Engine** (earthengine.google.com, free for research/education accounts) — access to Sentinel-1 SAR (`COPERNICUS/S1_GRD`), Sentinel-2 multispectral (`COPERNICUS/S2`), and Landsat 8/9 collections via Python API (`earthengine-api` + `geemap`). This is where your spectral and structural imagery comes from.

3. **ASTER L1T/L2** — available via GEE (`ASTER/AST_L1T_003`) or NASA Earthdata. ASTER's 14 spectral bands span VNIR through TIR and are the historically validated sensor for manganese exploration — published studies (Oman, Pakistan Bela ophiolite) confirm manganese shows diagnostic low reflectance in ASTER bands 1-9 (VNIR/SWIR) and distinct emission behaviour in bands 10-14 (TIR), and band-ratio methods on ASTER SWIR bands are the established technique for mapping Mn-bearing lithology.

4. **ERA5 reanalysis** (Copernicus Climate Data Store, free API) — hourly rainfall, temperature for the production-shortfall module.

5. **MOIL Annual Reports / Indian Bureau of Mines Yearbook** (public PDFs) — gives you real production tonnage figures, mine-wise output, and grade classifications to calibrate your synthetic production model so it isn't fabricated from nothing.

---

## Part 2 — System Architecture

Three modules that must work as one system, not three disconnected demos:

```
┌─────────────────────────────────────────────────────────────┐
│                      MODULE 1: RESERVE MAPPING                │
│  Satellite ingestion → Spectral analysis → Structural analysis│
│  → Fusion model → Manganese probability surface               │
└───────────────────────┬───────────────────────────────────────┘
                         │ feeds site-specific risk context into
┌───────────────────────▼───────────────────────────────────────┐
│                 MODULE 2: PRODUCTION FORECASTING                │
│  Synthetic ops data + weather + equipment reliability →        │
│  Time-series model → Shortfall probability per mine             │
└───────────────────────┬───────────────────────────────────────┘
                         │ feeds predictions into
┌───────────────────────▼───────────────────────────────────────┐
│              MODULE 3: DECISION SUPPORT DASHBOARD                │
│  Reserve map + shortfall risk + recommendation engine →         │
│  Unified web dashboard for MOIL planning                         │
└───────────────────────────────────────────────────────────────┘
```

The integration point that makes this "sophisticated" rather than three unrelated demos: **Module 1's output (a per-pixel/per-block manganese confidence score) becomes an input feature to Module 2.** A mine block with declining measured reserve confidence should influence the production risk model — this is literally what real mine planning does (reserve depletion is a production risk factor). If you build these as three silos, the evaluator sees three hackathon projects stapled together. If Module 2 actually queries Module 1's output as a feature, the evaluator sees one system.

---

## Part 3 — Full Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Satellite data access | Google Earth Engine Python API + `geemap` | Free, no data download/storage burden, industry-standard for this exact task |
| Geospatial processing | `rasterio`, `geopandas`, `GDAL`, `shapely` | Standard geospatial Python stack, handles GeoTIFF/shapefile I/O |
| Ground truth ingestion | GSI Bhukosh shapefiles (manual download, one-time) | Real lithology boundaries for the Sausar Group |
| Spectral classification | `scikit-learn` (Random Forest, SVM) | Interpretable, works well on tabular band-ratio features, defensible to a geologist evaluator (vs. black-box CNN) |
| Structural feature extraction | OpenCV (edge/lineament detection on SAR), `scikit-image` | Fault/lineament mapping from Sentinel-1 |
| Fusion model | Gradient boosting (`XGBoost` or `LightGBM`) combining spectral + structural + proximity-to-known-ore features | Combines heterogeneous features better than a single deep model would justify in 36 hours |
| Production time-series | `XGBoost` regression with lag features, or `PyTorch` LSTM if team has bandwidth | Tabular time-series with known exogenous variables (weather, equipment) — gradient boosting is faster to get right and easier to explain |
| Recommendation layer | Rule-based engine + `Ollama` running `Llama-3-8B` locally for natural-language explanation generation | Keeps the core logic auditable (rules) while using an LLM only for the human-readable explanation layer — this matters because MOIL evaluators will distrust an opaque "AI says do X" without traceable reasoning |
| Backend API | `FastAPI` | Fast to build, async, auto-generates OpenAPI docs which look professional in a demo |
| Frontend | `React` + `Leaflet.js` (or `deck.gl` for larger raster overlays) | Map-centric dashboard, industry-standard |
| Database | `PostgreSQL` + `PostGIS` extension | You are storing geospatial features and time-series together — PostGIS is built exactly for this |
| Deployment | Docker Compose (backend, frontend, Postgres as separate containers) | Clean deployment story for the demo and for the "scalable to other MOIL sites" pitch |

---

## Part 4 — Build Order (This Is the Part That Matters Most)

Do not build all three modules in parallel from hour zero. Build in this sequence, because each phase de-risks the next and gives you a demoable checkpoint at every stage — critical if judging happens in rounds or if you run out of time.

### Phase 0 (Before the finale — 3 to 6 weeks of prep)

This PS cannot be built cold in 36 hours. The prep phase is where you actually win.

1. Get a Google Earth Engine account approved (takes a few days — do this in week 1).
2. Download GSI Bhukosh lithology shapefiles for the Nagpur-Bhandara-Balaghat corridor. Study them. Identify the mapped Sausar Group boundary and, specifically, where the gondite/ore-bearing horizon is shown relative to MOIL's known mine coordinates.
3. Pull Sentinel-2, Sentinel-1, and ASTER imagery for the full belt (200km x 25km is a manageable area) via GEE. Do this ahead of time — don't burn finale hours on cloud-free compositing.
4. Read the 3-4 published papers on ASTER-based manganese mapping (Oman, Pakistan/Bela ophiolite studies) closely enough to correctly implement their band-ratio formulas. This is 2-3 hours of reading that separates your spectral model from a guessed one.
5. Pull MOIL annual report PDFs and IBM Yearbook manganese chapter for real production figures — mine-wise tonnage, grade distribution — to calibrate Module 2's synthetic data generation so it's grounded in real magnitudes, not arbitrary numbers.

### Phase 1 — Module 1, Spectral Layer (Hours 0-8 of build time)

Build the simplest version first: download/cache the satellite composites for the AOI, compute band ratios on ASTER (or Sentinel-2 SWIR as a substitute if ASTER coverage is patchy for your exact AOI — Sentinel-2 has bands 11/12 in SWIR which can approximate the same principle at coarser spectral resolution), and produce a first-pass "manganese-likely surface material" raster. Validate this against the *known* MOIL mine locations — if your band-ratio output doesn't light up at the Balaghat and Nagpur mine coordinates, something in your band math is wrong. Fix it here before building anything else, because everything downstream depends on this being right.

### Phase 2 — Module 1, Structural Layer + Fusion (Hours 8-16)

Add lineament extraction from Sentinel-1 SAR (edge detection via Sobel/Canny on the SAR backscatter image highlights fault-like linear features). Overlay against the GSI Bhukosh structural data if available for validation. Then build the fusion model: a Random Forest or XGBoost classifier where each training pixel has features [spectral band ratios, distance to nearest mapped lineament, distance to nearest known Sausar Group boundary, elevation, NDVI]. Label training pixels using proximity to MOIL's known ore locations as positive examples and random background pixels as negative examples (this is a standard "positive-unlabeled" exploration geology ML setup — be upfront about this limitation when presenting, it is methodologically honest and evaluators respect that far more than an overconfident claim). Output: a continuous probability surface, not a binary map.

### Phase 3 — Module 2, Production Forecasting (Hours 16-24, can run in parallel with Phase 2 if you have two sub-teams)

Generate synthetic-but-calibrated operational data: for each of the 10 mines, simulate daily production over 2 years using the real annual tonnage figures from MOIL reports as an anchor, with realistic noise sources layered in — equipment downtime (Weibull-distributed failures, parameterised loosely from published mining reliability literature), rainfall disruption (pull real ERA5 rainfall history for the actual mine coordinates — this part is NOT synthetic, it's real weather history), and blast-delay factor (Poisson). Train an XGBoost regressor with lag features (production t-1, t-7, t-30) plus the exogenous variables to predict next-30-day production and flag shortfall risk against planned targets. Critically: pull in a feature from Module 1 — e.g., "distance from current working face to the boundary of the highest-confidence ore zone" — as a leading indicator. This is the integration point mentioned in Part 2.

### Phase 4 — Module 3, Dashboard + Recommendation Layer (Hours 24-32)

Build the FastAPI backend serving: `/reserves/{mine_id}` (returns the probability raster tile + summary stats), `/production/{mine_id}/forecast` (returns 30/60/90-day shortfall risk), `/recommendations/{mine_id}` (returns ranked corrective actions). The recommendation logic is rule-based first: if shortfall driver = equipment downtime → recommend redeployment from nearest underutilised mine; if driver = rainfall → recommend advance stockpiling; if driver = declining reserve confidence in current working zone → recommend redirecting development toward the nearest high-confidence unexplored zone from Module 1's output. Feed the structured rule output into a locally-run Llama-3-8B (via Ollama) purely to phrase it as a natural-language recommendation paragraph — this is a light LLM touch, not the core intelligence, which keeps the system auditable. Frontend: Leaflet map with the reserve probability heatmap as a tile layer, mine markers, click-through to production forecast charts and recommendation panel.

### Phase 5 — Integration Test + Demo Script (Hours 32-36)

Run the full pipeline end-to-end at least three times before presenting. Prepare the demo narrative in this order: (1) show the reserve probability map and explicitly point out that it correctly highlights the known Balaghat and Nagpur ore zones — this is your credibility proof, (2) show it also highlights unexplored high-confidence zones nearby — this is your "here's what MOIL doesn't know yet" moment, (3) switch to a specific mine, show the production forecast flagging a shortfall risk and the specific driver, (4) show the recommendation panel with the natural-language explanation, (5) explicitly state the honest limitation: reserve confidence is a screening tool that should direct where MOIL sends drilling crews next, not a replacement for drilling — professional geologists use remote sensing this way, and saying so out loud makes you more credible, not less.

---

## Part 5 — Where the Sophistication Actually Comes From

Read this part carefully, because it's the difference between a solution that looks like every other team's and one that visibly required real work:

1. **You validate against known ground truth before trusting the model on unknown ground.** Most teams will build a classifier and immediately show it "finding new reserves" without ever checking whether it correctly identifies the reserves everyone already knows about. Checking against MOIL's 10 known mine locations first, and only then extending to unexplored terrain, is the methodologically correct order and it is also the more impressive demo structure.

2. **You use band ratios grounded in actual published geology literature, not a guessed formula.** The Oman and Pakistan ASTER-manganese studies give you real, citable band combinations. Anyone can say "we used AI to find spectral signatures" — very few teams will have actually read the geological remote sensing literature and implemented the specific band math that's been peer-reviewed for this exact mineral.

3. **You incorporate structural geology, not just colour.** A synclinal fold or shear zone is where ore concentrates in this deposit type. A model that only does pixel-wise spectral classification is missing half of what an exploration geologist actually looks for. Adding the lineament/structural layer, even in simplified form, is the single feature that separates a genuinely informed model from a generic "AI finds minerals" toy.

4. **The production model uses real weather history, not fully synthetic data.** ERA5 rainfall for the actual mine coordinates over the actual monsoon seasons is real. Layering synthetic equipment/blast noise on top of real weather is a defensible hybrid approach, and you should say exactly this to the evaluator rather than implying the whole dataset is real (which it isn't, and claiming otherwise would be caught and would cost you credibility).

5. **The two modules are integrated, not parallel.** Module 1's reserve confidence feeding into Module 2's risk model, and both feeding into Module 3's recommendations, is what makes this "one system" instead of "three hackathon projects in a trench coat."

6. **You state your epistemic limits out loud.** Surface remote sensing cannot see 300+ meters underground with certainty — nothing can, without drilling. Presenting your output as a probability-ranked exploration-targeting tool (which is exactly how the mining industry actually uses this class of technology) rather than as a definitive subsurface map is the difference between a team that understands the domain and a team that's overselling a toy. An MOIL evaluator, who deals with real exploration geologists, will immediately trust the team that is precise about what the tool does and doesn't claim.

---

## Part 6 — Honest Risk Notes

- Microaneurysm-scale precision is not the risk here (that's a different PS) — the real risk is that ASTER's exact archive coverage over your AOI on cloud-free dates may be sparse. Check this in Phase 0, and have Sentinel-2 SWIR as your fallback spectral source if ASTER coverage is thin.
- The positive-unlabeled learning setup (only 10 known positive locations) means your fusion model's confidence numbers will be noisy. Don't oversell precision — present it as a ranked probability surface, which is honest and is also how professional mineral prospectivity mapping is actually communicated in industry.
- Keep the LLM layer thin. If your recommendation engine's core logic lives inside an LLM prompt instead of in explicit rules, an MOIL evaluator will correctly distrust it. Rules first, LLM only for phrasing.

