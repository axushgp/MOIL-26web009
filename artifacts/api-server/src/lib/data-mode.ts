import { GetDataModeResponse } from "@workspace/api-zod";
import { inspectLiveSources, liveDataIsReady } from "./live-adapters";

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
let activeMode: DataMode = process.env.MRIP_DATA_MODE === "live" ? "live" : "synthetic";

export function getDataMode(): DataModeResponseValue {
  const sources = inspectLiveSources();
  const liveReady = liveDataIsReady();
  return GetDataModeResponse.parse({
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