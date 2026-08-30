import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const barrel = resolve(process.cwd(), "../api-zod/src/index.ts");
writeFileSync(
  barrel,
  `export * from "./generated/api";
// Orval emits operation parameter names as both runtime schemas and types.
// Keep the generated files untouched and export only non-colliding types.
export type {
  DataModeRequest,
  DataModeRequestMode,
  DataModeResponse,
  DataModeResponseMode,
  DataSourceStatus,
  DataSourceStatusStatus,
  GetMineRecommendationHorizon,
  GetProductionForecastHorizon,
  GetReserveHeatmapParams,
  HealthStatus,
  HeatmapResponse,
  Mine,
  ProductionForecast,
  ProductionHistory,
  Recommendation,
  ReservePoint,
  ValidationMine,
  ValidationResponse,
} from "./generated/types";
`,
);