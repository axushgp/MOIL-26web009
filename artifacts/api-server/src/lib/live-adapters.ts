import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type LiveSourceId =
  | "earth-engine"
  | "bhukosh"
  | "era5"
  | "moil-production"
  | "fusion-output";

export type LiveSourceStatus = "connected" | "missing" | "adapter_pending";

export type LiveSourceReadiness = {
  id: LiveSourceId;
  label: string;
  status: LiveSourceStatus;
  detail: string;
};

type Provenance = {
  source_id: string;
  source_uri: string;
  source_date: string;
  retrieved_at: string;
  checksum: string;
};

type GeoJsonGeometry = {
  type: "Point" | "Polygon" | "MultiPolygon";
  coordinates: number[] | number[][] | number[][][];
};

export type LiveBundle = {
  generated_at: string;
  source_runs: Array<{
    source_id: LiveSourceId;
    provenance: Provenance;
  }>;
  mines: Array<{
    mine_id: string;
    name: string;
    district: string;
    mine_type: string;
    coordinate_status: string;
    latitude: number;
    longitude: number;
    depth_m: number | null;
    reserve_confidence: number;
    shortfall_probability: number;
    dominant_driver: string;
    provenance: string;
    geometry: GeoJsonGeometry;
    geometry_status: "verified_point" | "verified_envelope";
    geometry_confidence: string;
    validation_eligible: boolean;
    geometry_provenance: Provenance;
  }>;
  reserve_points: Array<{
    latitude: number;
    longitude: number;
    reserve_probability: number;
    spectral_score: number;
    structural_score: number;
    zone_type: string;
    data_provenance: string;
  }>;
  production_history: Array<{
    mine_id: string;
    date: string;
    planned_tonnage: number;
    actual_tonnage: number;
    downtime_hours: number;
    rainfall_mm: number;
    blast_delay_flag: boolean;
    data_provenance: string;
  }>;
  validation: {
    confirmed_mines_checked: number;
    avg_percentile_rank: number;
    per_mine: Array<{ mine_id: string; percentile: number }>;
    method: string;
  };
  forecasts: Array<{
    mine_id: string;
    horizon_days: number;
    predicted_tonnage: number;
    planned_tonnage: number;
    shortfall_probability: number;
    dominant_driver: string;
    local_reserve_confidence: number;
    model_version: string;
    provenance: string;
  }>;
  recommendations: Array<{
    mine_id: string;
    horizon_days?: number;
    action: string;
    detail: string;
    driver: string;
    explanation_text: string;
    generated_at: string;
  }>;
};

const workspaceRoot = path.resolve(process.cwd());
const defaultLiveDir = path.join(workspaceRoot, "data", "processed", "live");

function resolveWorkspacePath(value: string | undefined, fallback: string) {
  return path.resolve(workspaceRoot, value || fallback);
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasProvenance(value: unknown): value is Provenance {
  if (!isRecord(value)) return false;
  return ["source_id", "source_uri", "source_date", "retrieved_at", "checksum"]
    .every((key) => typeof value[key] === "string" && value[key].length > 0);
}

function hasGeometry(value: unknown): value is GeoJsonGeometry {
  if (!isRecord(value)) return false;
  if (!["Point", "Polygon", "MultiPolygon"].includes(String(value.type))) return false;
  return Array.isArray(value.coordinates) && value.coordinates.length > 0;
}

function fileHasProvenance(filePath: string) {
  const value = readJson(filePath);
  if (!isRecord(value)) return false;
  return hasProvenance(value.provenance);
}

function sha256(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function inspectEarthEngine(): LiveSourceReadiness {
  const configuredCredential = process.env.GEE_SERVICE_ACCOUNT_JSON?.trim();
  const keyPath = resolveWorkspacePath(
    configuredCredential && !configuredCredential.startsWith("{")
      ? configuredCredential
      : undefined,
    "secrets/gee-service-account.json",
  );
  const manifestPath = resolveWorkspacePath(
    process.env.GEE_IMAGE_MANIFEST_PATH,
    "data/processed/live/earth-engine.json",
  );
  const account = configuredCredential?.startsWith("{")
    ? readJsonValue(configuredCredential)
    : fs.existsSync(keyPath)
      ? readJson(keyPath)
      : undefined;
  if (!process.env.GEE_PROJECT_ID || !account) {
    return {
      id: "earth-engine",
      label: "Google Earth Engine",
      status: "missing",
      detail: "Missing GEE_PROJECT_ID or protected service-account JSON.",
    };
  }
  if (!isRecord(account) || typeof account.client_email !== "string" || typeof account.private_key !== "string") {
    return {
      id: "earth-engine",
      label: "Google Earth Engine",
      status: "missing",
      detail: "The service-account file is not a valid Google JSON credential.",
    };
  }
  if (!fs.existsSync(manifestPath) || !fileHasProvenance(manifestPath)) {
    return {
      id: "earth-engine",
      label: "Google Earth Engine",
      status: "adapter_pending",
      detail: "Credentials exist; a provenance-bearing Sentinel/ASTER export manifest is still required.",
    };
  }
  return {
    id: "earth-engine",
    label: "Google Earth Engine",
    status: "connected",
    detail: `Verified imagery manifest ${sha256(manifestPath).slice(0, 12)}… with source dates and export metadata.`,
  };
}

function readJsonValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function inspectBhukosh(): LiveSourceReadiness {
  const geojsonPath = resolveWorkspacePath(
    process.env.BHUKOSH_GEOJSON_PATH,
    "data/processed/live/bhukosh.geojson",
  );
  if (!fs.existsSync(geojsonPath)) {
    return {
      id: "bhukosh",
      label: "GSI Bhukosh geology",
      status: "missing",
      detail: "Add the downloaded Bhukosh shapefiles and their validated GeoJSON export.",
    };
  }
  const value = readJson(geojsonPath);
  if (!isRecord(value) || value.type !== "FeatureCollection" || !Array.isArray(value.features) || value.features.length === 0 || !hasProvenance(value.provenance)) {
    return {
      id: "bhukosh",
      label: "GSI Bhukosh geology",
      status: "adapter_pending",
      detail: "GeoJSON must be a non-empty FeatureCollection with CRS/layer provenance.",
    };
  }
  return {
    id: "bhukosh",
    label: "GSI Bhukosh geology",
    status: "connected",
    detail: `Validated ${value.features.length} geological features with download attribution.`,
  };
}

function inspectEra5(): LiveSourceReadiness {
  const era5Path = resolveWorkspacePath(
    process.env.ERA5_DATA_PATH,
    "data/processed/live/era5.json",
  );
  if (!process.env.CDS_API_KEY && !fs.existsSync(era5Path)) {
    return {
      id: "era5",
      label: "ERA5 weather",
      status: "missing",
      detail: "Set CDS_API_KEY and run the mine-coordinate ERA5 retrieval.",
    };
  }
  if (!fs.existsSync(era5Path) || !fileHasProvenance(era5Path)) {
    return {
      id: "era5",
      label: "ERA5 weather",
      status: "adapter_pending",
      detail: "CDS access is not enough; a cached response with request and retrieval provenance is required.",
    };
  }
  return {
    id: "era5",
    label: "ERA5 weather",
    status: "connected",
    detail: "Cached rainfall and temperature output includes CDS request provenance.",
  };
}

function parseCsv(filePath: string) {
  if (!fs.existsSync(filePath)) return undefined;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return undefined;
  const headers = lines[0].split(",").map((value) => value.trim());
  const required = [
    "mine_id",
    "date",
    "planned_tonnage",
    "actual_tonnage",
    "downtime_hours",
    "rainfall_mm",
    "blast_delay_flag",
    "data_provenance",
    "source_document",
  ];
  if (!required.every((field) => headers.includes(field))) return undefined;
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]));
  });
}

function inspectMoilProduction(): LiveSourceReadiness {
  const csvPath = resolveWorkspacePath(
    process.env.MOIL_PRODUCTION_DATA_PATH,
    "data/raw/moil/production.csv",
  );
  const rows = parseCsv(csvPath);
  if (!rows) {
    return {
      id: "moil-production",
      label: "Verified MOIL production",
      status: "missing",
      detail: "Provide an official-report or authorized MOIL CSV with row-level source_document fields.",
    };
  }
  const valid = rows.every((row) =>
    row.mine_id &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
    ["planned_tonnage", "actual_tonnage", "downtime_hours", "rainfall_mm"].every((key) => Number.isFinite(Number(row[key]))) &&
    ["data_provenance", "source_document"].every((key) => row[key]),
  );
  return {
    id: "moil-production",
    label: "Verified MOIL production",
    status: valid ? "connected" : "adapter_pending",
    detail: valid
      ? `Validated ${rows.length} production rows with source-document provenance.`
      : "Production rows contain missing dates, numeric fields, or provenance references.",
  };
}

function isLiveBundle(value: unknown): value is LiveBundle {
  if (!isRecord(value)) return false;
  const arrays = ["source_runs", "mines", "reserve_points", "production_history", "forecasts", "recommendations"];
  if (!arrays.every((key) => Array.isArray(value[key]))) return false;
  if (!isRecord(value.validation) || typeof value.generated_at !== "string") return false;
  if (!(value.source_runs as unknown[]).every((run) => isRecord(run) && typeof run.source_id === "string" && hasProvenance(run.provenance))) return false;
  if (!(value.mines as unknown[]).every((mine) =>
    isRecord(mine) &&
    typeof mine.provenance === "string" &&
    typeof mine.latitude === "number" &&
    typeof mine.longitude === "number" &&
    hasGeometry(mine.geometry) &&
    ["verified_point", "verified_envelope"].includes(String(mine.geometry_status)) &&
    typeof mine.geometry_confidence === "string" &&
    typeof mine.validation_eligible === "boolean" &&
    hasProvenance(mine.geometry_provenance)
  )) return false;
  if (!(value.reserve_points as unknown[]).every((point) => isRecord(point) && typeof point.data_provenance === "string")) return false;
  if (!(value.production_history as unknown[]).every((row) => isRecord(row) && typeof row.data_provenance === "string")) return false;
  if (!(value.forecasts as unknown[]).every((forecast) => isRecord(forecast) && typeof forecast.provenance === "string")) return false;
  if (!(value.recommendations as unknown[]).every((recommendation) => isRecord(recommendation) && typeof recommendation.provenance === "string")) return false;
  if (!isRecord(value.validation) || typeof value.validation.method !== "string" || !Array.isArray(value.validation.per_mine)) return false;
  const eligibleMineIds = new Set(
    (value.mines as Array<Record<string, unknown>>)
      .filter((mine) => mine.validation_eligible === true)
      .map((mine) => mine.mine_id)
      .filter((mineId): mineId is string => typeof mineId === "string"),
  );
  if (!(value.validation.per_mine as unknown[]).every(
    (item) => isRecord(item) && typeof item.mine_id === "string" && eligibleMineIds.has(item.mine_id),
  )) return false;
  return true;
}

export function inspectLiveSources(): LiveSourceReadiness[] {
  const bundlePath = resolveWorkspacePath(
    process.env.LIVE_BUNDLE_PATH,
    path.relative(workspaceRoot, path.join(defaultLiveDir, "bundle.json")),
  );
  const bundle = readJson(bundlePath);
  const bundleReady = isLiveBundle(bundle);
  const sources = [
    inspectEarthEngine(),
    inspectBhukosh(),
    inspectEra5(),
    inspectMoilProduction(),
    {
      id: "fusion-output" as const,
      label: "Validated live fusion output",
      status: bundleReady ? "connected" as const : "adapter_pending" as const,
      detail: bundleReady
        ? "Mines, reserve cells, forecasts, recommendations, and validation share source-run provenance."
        : "Run the scientific fusion pipeline to create a validated live bundle.",
    },
  ];
  return sources;
}

export function liveDataIsReady() {
  return inspectLiveSources().every((source) => source.status === "connected");
}

export function loadLiveBundle(): LiveBundle {
  const bundlePath = resolveWorkspacePath(
    process.env.LIVE_BUNDLE_PATH,
    path.relative(workspaceRoot, path.join(defaultLiveDir, "bundle.json")),
  );
  const bundle = readJson(bundlePath);
  if (!isLiveBundle(bundle) || !liveDataIsReady()) {
    throw new Error("Validated live bundle is unavailable; live mode remains fail-closed.");
  }
  return bundle;
}