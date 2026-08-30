# Live data setup for MRIP

The dashboard now has a **Synthetic preview / Live data** switch. The switch is
fail-closed: selecting Live data never falls back to the synthetic database
records. The current repository reports each source as `missing` or
`adapter_pending` until the ingestion adapters below are connected and
validated.

This is important because “live” does not mean “a credential exists.” A source
is live only when the application has fetched it, recorded its source date and
provenance, transformed it into the MRIP schema, and passed validation checks.

## 1. Google Earth Engine: Sentinel-1, Sentinel-2, and ASTER

1. Create or select a Google Cloud project owned by the team.
2. Enable the Earth Engine API and request Earth Engine access for the project.
   Earth Engine approval and noncommercial/research eligibility are controlled
   by Google, not by this application.
3. Create a service account with the minimum Earth Engine permissions needed by
   the ingestion job and download its JSON key.
4. Store the JSON key as a Replit Secret or protected workspace file. Never
   commit it. For the local file-based adapter, set:

   ```text
   GEE_PROJECT_ID=your-approved-project-id
   GEE_SERVICE_ACCOUNT_JSON=secrets/gee-service-account.json
   ```

5. Implement the ingestion job against:

   - `COPERNICUS/S1_GRD` for SAR backscatter and lineaments
   - `COPERNICUS/S2` for multispectral fallback/quality checks
   - `ASTER/AST_L1T_003` for ASTER VNIR/SWIR/TIR inputs

   The job must save source dates, collection IDs, cloud filters, AOI, and
   export checksums beside every GeoTIFF. Reproject all outputs to the common
   30m UTM Zone 44N grid before feature fusion. Do not hardcode an ASTER
   manganese band-ratio formula without citing the paper and equation used;
   otherwise evaluate the documented candidate ratios empirically.

## 2. GSI Bhukosh geology

Bhukosh is a manual-download source in this project, not an assumed public
streaming API.

1. Download the Nagpur, Bhandara, and Balaghat lithology/geological layers from
   the GSI Bhukosh portal.
2. Put the complete shapefile sets, including sidecar files, under:

   ```text
   data/raw/bhukosh/
   ```

   Or set `BHUKOSH_DATA_DIR` to another protected directory. The Node API
   consumes a validated GeoJSON export from `BHUKOSH_GEOJSON_PATH`; the export
   must retain the original layer attribution and CRS metadata.
3. Record the Bhukosh layer name, download date, license/attribution, CRS, and
   the Sausar Group boundary selected for modelling.
4. Build the loader that validates geometry, CRS, and required attributes,
   rasterizes the selected boundary onto the shared 30m grid, and rejects
   missing or ambiguous layers instead of treating an empty layer as valid.

## 3. ERA5 weather through Copernicus CDS

ERA5 is reanalysis, so it is real observed/reconstructed weather data but not
instantaneous sensor telemetry. It may also have publication latency.

1. Create a free Copernicus Climate Data Store account.
2. Create a CDS API key and store it in Replit Secrets as `CDS_API_KEY`; do not
   paste it into source files or chat.
3. Implement the mine-specific loader for rainfall and temperature over each
   confirmed coordinate and date range.
4. Cache the raw response and record the CDS dataset, request parameters,
   retrieval date, coordinate, and units. The production feature table should
   label these columns as `real_era5_weather`; downtime and blast delays remain
   synthetic until verified operational data replaces them.

## 4. Verified MOIL production data

There is no safe assumption that a public real-time mine-wise production API is
available. Use one of these verified inputs:

- MOIL annual reports with the exact report year and page citation
- Indian Bureau of Mines yearbook tables with chapter/table citation
- A MOIL-provided operational export or approved internal API

Normalize to a protected CSV or database import with at least:

```text
mine_id,date,planned_tonnage,actual_tonnage,downtime_hours,
rainfall_mm,blast_delay_flag,data_provenance,source_document
```

Set `MOIL_PRODUCTION_DATA_PATH` to the normalized file for the file adapter.
Every row needs a source reference and a provenance value. Do not combine
illustrative values with verified values in the same series without a visible
provenance boundary and an explicit model-run note.

Before accepting coordinates as ground truth, confirm all mine points against
MOIL lease documents or GSI locations. Chikla is the priority unresolved point
in the build specification.

## 5. What must be implemented before Live data is enabled

The source-status endpoint intentionally keeps `live_ready=false` until the
actual adapters exist. The remaining engineering work is:

1. Add the Earth Engine export/refresh worker.
2. Add the Bhukosh parser and shared-grid rasterizer.
3. Add the ERA5 request/cache loader.
4. Add the verified production-data importer.
5. Replace synthetic reserve, history, and forecast reads with versioned
   live-table reads after validation.
6. Record `model_runs`, source timestamps, provenance, and validation metrics.
7. Run a full end-to-end check with the live switch selected.
8. Only then mark the source statuses `connected` and allow
   `live_ready=true`.

Until those steps are complete, use **Synthetic preview** for demonstrations
and use **Live data** only as a setup/readiness check. The footer limitation
about screening rather than drilling remains true even after the feeds are
connected.