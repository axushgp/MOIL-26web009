import { Router, type IRouter } from "express";
import {
  GetMineRecommendationParams,
  GetMineRecommendationQueryParams,
  GetMineRecommendationResponse,
  GetProductionForecastParams,
  GetProductionForecastQueryParams,
  GetProductionForecastResponse,
  GetProductionHistoryParams,
  GetProductionHistoryQueryParams,
  GetProductionHistoryResponse,
  GetReserveHeatmapQueryParams,
  GetReserveHeatmapResponse,
  GetReserveValidationResponse,
  ListMinesResponse,
} from "@workspace/api-zod";
import {
  getDataMode,
  ensureOperationalDataMode,
} from "../lib/data-mode";
import {
  findMine,
  getLiveForecast,
  getLiveProductionHistory,
  getLiveRecommendation,
  getLiveValidation,
  listLiveMines,
  listLiveReservePoints,
  getProductionHistory,
  initializeMripStore,
  listMines,
  listReservePoints,
  persistForecast,
  persistRecommendation,
  recommendationResponse,
} from "../lib/mrip-store";

const router: IRouter = Router();

function normalizeHorizon(value: unknown) {
  return typeof value === "string" ? Number(value) : value;
}

router.use(async (_req, _res, next) => {
  try {
    ensureOperationalDataMode();
    await initializeMripStore();
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/mines", async (_req, res, next) => {
  try {
    const mines = getDataMode().mode === "live" ? listLiveMines() : await listMines();
    res.json(ListMinesResponse.parse(mines));
  } catch (error) {
    next(error);
  }
});

router.get("/reserves/heatmap", async (req, res, next) => {
  try {
    const query = GetReserveHeatmapQueryParams.parse(req.query);
    let points = getDataMode().mode === "live" ? listLiveReservePoints() : await listReservePoints();
    if (query.bbox) {
      const values = query.bbox.split(",").map(Number);
      if (values.length === 4 && values.every(Number.isFinite)) {
        const [minLon, minLat, maxLon, maxLat] = values;
        points = points.filter(
          (point) =>
            point.longitude >= minLon &&
            point.longitude <= maxLon &&
            point.latitude >= minLat &&
            point.latitude <= maxLat,
        );
      }
    }
    res.json(
      GetReserveHeatmapResponse.parse({
        points,
        model_version: getDataMode().mode === "live" ? "live-bundle" : "fusion-v0.4",
        computed_at: getDataMode().mode === "live" ? new Date().toISOString() : "2026-08-29T09:00:00.000Z",
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/reserves/validation", (_req, res) => {
  const validation = getDataMode().mode === "live" ? getLiveValidation() : {
      confirmed_mines_checked: 3,
      avg_percentile_rank: 82.4,
      per_mine: [
        { mine_id: "balaghat", percentile: 91.2 },
        { mine_id: "ukwa", percentile: 83.4 },
        { mine_id: "tirodi", percentile: 72.6 },
      ],
      method:
        "Leave-one-out percentile ranking on public-source approximate mine points",
    };
  res.json(GetReserveValidationResponse.parse(validation));
});

router.get("/production/:mineId/history", async (req, res, next) => {
  try {
    const { mineId } = GetProductionHistoryParams.parse(req.params);
    const { days } = GetProductionHistoryQueryParams.parse(req.query);
    const mine = getDataMode().mode === "live"
      ? listLiveMines().find((record) => record.mine_id === mineId)
      : await findMine(mineId);
    if (!mine) {
      res.status(404).json({ error: "Mine not found" });
      return;
    }
    const history = getDataMode().mode === "live"
      ? getLiveProductionHistory(mineId, days)
      : await getProductionHistory(mineId, days);
    res.json(GetProductionHistoryResponse.parse(history));
  } catch (error) {
    next(error);
  }
});

router.get("/production/:mineId/forecast", async (req, res, next) => {
  try {
    const { mineId } = GetProductionForecastParams.parse(req.params);
    const { horizon } = GetProductionForecastQueryParams.parse({
      ...req.query,
      horizon: normalizeHorizon(req.query.horizon),
    });
    const mine = getDataMode().mode === "live"
      ? listLiveMines().find((record) => record.mine_id === mineId)
      : await findMine(mineId);
    if (!mine) {
      res.status(404).json({ error: "Mine not found" });
      return;
    }
    if (getDataMode().mode === "live") {
      const liveForecast = getLiveForecast(mineId, horizon);
      if (!liveForecast) {
        res.status(404).json({ error: "Forecast not found in validated live bundle" });
        return;
      }
      res.json(GetProductionForecastResponse.parse(liveForecast));
      return;
    }
    const forecast = await persistForecast(mine, horizon);
    res.json(GetProductionForecastResponse.parse({
      mine_id: forecast.mineId,
      horizon_days: forecast.horizonDays,
      predicted_tonnage: forecast.predictedTonnage,
      planned_tonnage: forecast.plannedTonnage,
      shortfall_probability: forecast.shortfallProbability,
      dominant_driver: forecast.dominantDriver,
      local_reserve_confidence: forecast.localReserveConfidence,
      model_version: forecast.modelVersion,
      provenance: forecast.provenance,
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/recommendations/:mineId", async (req, res, next) => {
  try {
    const { mineId } = GetMineRecommendationParams.parse(req.params);
    const { horizon } = GetMineRecommendationQueryParams.parse({
      ...req.query,
      horizon: normalizeHorizon(req.query.horizon),
    });
    const mine = getDataMode().mode === "live"
      ? listLiveMines().find((record) => record.mine_id === mineId)
      : await findMine(mineId);
    if (!mine) {
      res.status(404).json({ error: "Mine not found" });
      return;
    }
    if (getDataMode().mode === "live") {
      const liveRecommendation = getLiveRecommendation(mineId, horizon);
      if (!liveRecommendation) {
        res.status(404).json({ error: "Recommendation not found in validated live bundle" });
        return;
      }
      res.json(GetMineRecommendationResponse.parse(liveRecommendation));
      return;
    }
    const forecast = await persistForecast(mine, horizon);
    const recommendation = await persistRecommendation(mine, forecast);
    res.json(
      GetMineRecommendationResponse.parse(
        recommendationResponse(mine, forecast, recommendation),
      ),
    );
  } catch (error) {
    next(error);
  }
});

export default router;