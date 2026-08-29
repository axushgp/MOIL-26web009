import fs from "node:fs";
import path from "node:path";

import {
  DataModeResponse,
  DataModeRequest,
} from "@workspace/api-zod";

type DataMode = "synthetic" | "live";
type DataModeRequestValue = { mode: DataMode };
type DataModeResponseValue = {
  mode: DataMode;
  live_ready: boolean;
  message: string;
  sources: Array<{
    id: string;
    label: string;
    status: "connected" | "missing" | "adapter_pending";
    detail: string;
  }>;
};
type DataSourceStatus = DataModeResponseValue["sources"][number];

const workspaceRoot = path.resolve(process.cwd());
let activeMode: DataMode = process.env.MRIP_DATA_MODE === "live" ? "live" : "synthetic";

function sourceStatus(
  id: string,
  label: string,
  configured: boolean,
  detail: string,
): DataSourceStatus {
  return {
    id,
    label,
    status: configured ? "adapter_pending" : "missing",
    detail,
  };
}

export function getDataMode(): DataModeResponseValue {
  const geeKeyPath = process.env.GEE_SERVICE_ACCOUNT_JSON
    ? path.resolve(workspaceRoot, process.env.GEE_SERVICE_ACCOUNT_JSON)
    : "";
  const bhukoshPath = process.env.BHUKOSH_DATA_DIR
    ? path.resolve(workspaceRoot, process.env.BHUKOSH_DATA_DIR)
    : path.join(workspaceRoot, "data", "raw", "bhukosh");
  const moilDataPath = process.env.MOIL_PRODUCTION_DATA_PATH
    ? path.resolve(workspaceRoot, process.env.MOIL_PRODUCTION_DATA_PATH)
    : "";

  const sources = [
    sourceStatus(
      "earth-engine",
      "Google Earth Engine",
      Boolean(process.env.GEE_PROJECT_ID && geeKeyPath && fs.existsSync(geeKeyPath)),
      process.env.GEE_PROJECT_ID && geeKeyPath && fs.existsSync(geeKeyPath)
        ? "Project and service-account file found; ingestion adapter is still required."
        : "Set GEE_PROJECT_ID and GEE_SERVICE_ACCOUNT_JSON to a gitignored service-account JSON file.",
    ),
    sourceStatus(
      "bhukosh",
      "GSI Bhukosh geology",
      fs.existsSync(bhukoshPath),
      fs.existsSync(bhukoshPath)
        ? "Raw geology directory found; Sausar boundary parsing adapter is still required."
        : "Download the Bhukosh shapefiles into data/raw/bhukosh or set BHUKOSH_DATA_DIR.",
    ),
    sourceStatus(
      "era5",
      "ERA5 weather",
      Boolean(process.env.CDS_API_KEY),
      process.env.CDS_API_KEY
        ? "CDS credential found; mine-specific weather loader is still required."
        : "Store CDS_API_KEY as a Replit Secret after creating a Copernicus Climate Data Store account.",
    ),
    sourceStatus(
      "moil-production",
      "Verified MOIL production",
      Boolean(moilDataPath && fs.existsSync(moilDataPath)),
      moilDataPath && fs.existsSync(moilDataPath)
        ? "Production file found; provenance validation and ingestion adapter are still required."
        : "Provide a verified CSV/official report extract and set MOIL_PRODUCTION_DATA_PATH.",
    ),
  ];

  const liveReady = false;
  return DataModeResponse.parse({
    mode: activeMode,
    live_ready: liveReady,
    message:
      activeMode === "synthetic"
        ? "Synthetic preview is active. No external source is used for dashboard values."
        : liveReady
          ? "Live source mode is active."
          : "Live mode is selected, but one or more source adapters are not ready. Synthetic values are blocked.",
    sources,
  });
}

export function setDataMode(request: DataModeRequestValue) {
  activeMode = request.mode;
  return getDataMode();
}

export class LiveModeUnavailableError extends Error {
  readonly statusCode = 503;

  constructor() {
    super(
      "Live mode is selected, but live source adapters are not configured. Synthetic data is intentionally blocked.",
    );
    this.name = "LiveModeUnavailableError";
  }
}

export function ensureOperationalDataMode() {
  const status = getDataMode();
  if (status.mode === "live" && !status.live_ready) {
    throw new LiveModeUnavailableError();
  }
}