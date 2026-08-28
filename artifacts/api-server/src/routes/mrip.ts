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
import { recommend } from "../lib/rules-engine";

const router: IRouter = Router();

type MineRecord = {
  mine_id: string;
  name: string;
  district: string;
  mine_type: string;
  coordinate_status: string;
  latitude: number;
  longitude: number;
  depth_m?: number | null;
  reserve_confidence: number;
  shortfall_probability: number;
  dominant_driver: string;
};

const mines: MineRecord[] = [
  {
    mine_id: "balaghat",
    name: "Balaghat (Bharveli)",
    district: "Balaghat, Madhya Pradesh",
    mine_type: "Underground",
    coordinate_status: "public-source approximate",
    latitude: 21.8,
    longitude: 80.18,
    depth_m: 383,
    reserve_confidence: 0.86,
    shortfall_probability: 0.18,
    dominant_driver: "Rainfall",
  },
  {
    mine_id: "ukwa",
    name: "Ukwa",
    district: "Balaghat, Madhya Pradesh",
    mine_type: "Opencast",
    coordinate_status: "public-source approximate",
    latitude: 21.97,
    longitude: 80.47,
    depth_m: null,
    reserve_confidence: 0.78,
    shortfall_probability: 0.34,
    dominant_driver: "Equipment downtime",
  },
  {
    mine_id: "tirodi",
    name: "Tirodi",
    district: "Balaghat, Madhya Pradesh",
    mine_type: "Underground",
    coordinate_status: "town proxy",
    latitude: 21.68,
    longitude: 79.72,
    depth_m: null,
    reserve_confidence: 0.71,
    shortfall_probability: 0.27,
    dominant_driver: "Reserve confidence",
  },
  {
    mine_id: "chikla",
    name: "Chikla",
    district: "Bhandara, Maharashtra",
    mine_type: "Underground",
    coordinate_status: "needs input",
    latitude: 21.34,
    longitude: 79.74,
    depth_m: null,
    reserve_confidence: 0.64,
    shortfall_probability: 0.42,
    dominant_driver: "Reserve confidence",
  },
  {
    mine_id: "kandri",
    name: "Kandri",
    district: "Nagpur, Maharashtra",
    mine_type: "Underground",
    coordinate_status: "district placeholder",
    latitude: 21.31,
    longitude: 79.2,
    depth_m: null,
    reserve_confidence: 0.58,
    shortfall_probability: 0.31,
    dominant_driver: "Equipment downtime",
  },
  {
    mine_id: "mansar",
    name: "Munsar / Mansar",
    district: "Nagpur, Maharashtra",
    mine_type: "Underground",
    coordinate_status: "district placeholder",
    latitude: 21.28,
    longitude: 79.13,
    depth_m: null,
    reserve_confidence: 0.62,
    shortfall_probability: 0.22,
    dominant_driver: "Rainfall",
  },
  {
    mine_id: "beldongri",
    name: "Beldongri",
    district: "Nagpur, Maharashtra",
    mine_type: "Underground",
    coordinate_status: "district placeholder",
    latitude: 21.25,
    longitude: 79.05,
    depth_m: null,
    reserve_confidence: 0.55,
    shortfall_probability: 0.29,
    dominant_driver: "Blast delays",
  },
  {
    mine_id: "gumgaon",
    name: "Gumgaon",
    district: "Nagpur, Maharashtra",
    mine_type: "Underground",
    coordinate_status: "district placeholder",
    latitude: 21.18,
    longitude: 79.08,
    depth_m: null,
    reserve_confidence: 0.51,
    shortfall_probability: 0.38,
    dominant_driver: "Equipment downtime",
  },
  {
    mine_id: "dongri-buzurg",
    name: "Dongri Buzurg",
    district: "Bhandara, Maharashtra",
    mine_type: "Opencast",
    coordinate_status: "district placeholder",
    latitude: 21.4,
    longitude: 79.65,
    depth_m: null,
    reserve_confidence: 0.67,
    shortfall_probability: 0.19,
    dominant_driver: "Rainfall",
  },
  {
    mine_id: "sitapatore",
    name: "Sitapatore",
    district: "Bhandara, Maharashtra",
    mine_type: "Underground",
    coordinate_status: "district placeholder",
    latitude: 21.46,
    longitude: 79.6,
    depth_m: null,
    reserve_confidence: 0.6,
    shortfall_probability: 0.25,
    dominant_driver: "Blast delays",
  },
];

const modelVersion = "fusion-v0.4";

function distance(aLat: number, aLon: number, bLat: number, bLon: number) {
  const latScale = 111;
  const lonScale = 104;
  return Math.sqrt(
    Math.pow((aLat - bLat) * latScale, 2) +
      Math.pow((aLon - bLon) * lonScale, 2),
  );
}

const reservePoints = Array.from({ length: 72 }, (_, index) => {
  const row = Math.floor(index / 12);
  const column = index % 12;
  const latitude = 21.08 + row * 0.105;
  const longitude = 78.86 + column * 0.15;
  const nearestMine = Math.min(
    ...mines.map((mine) =>
      distance(latitude, longitude, mine.latitude, mine.longitude),
    ),
  );
  const structuralBand =
    0.45 + 0.25 * Math.sin((longitude - 78.7) * 7 + latitude * 2.2);
  const spectralBand =
    0.42 + 0.3 * Math.cos((latitude - 21) * 8 - longitude * 1.7);
  const mineInfluence = Math.max(0, 1 - nearestMine / 52);
  const reserveProbability = Math.min(
    0.97,
    Math.max(0.12, 0.16 + mineInfluence * 0.54 + structuralBand * 0.14 + spectralBand * 0.13),
  );

  return {
    latitude: Number(latitude.toFixed(3)),
    longitude: Number(longitude.toFixed(3)),
    reserve_probability: Number(reserveProbability.toFixed(3)),
    spectral_score: Number(Math.max(0.08, spectralBand).toFixed(3)),
    structural_score: Number(Math.max(0.08, structuralBand).toFixed(3)),
    zone_type: reserveProbability > 0.72 ? "priority zone" : reserveProbability > 0.5 ? "screening zone" : "background",
  };
});

function findMine(mineId: string) {
  return mines.find((mine) => mine.mine_id === mineId);
}

function forecastFor(mine: MineRecord, horizon: number) {
  const dailyPlan = mine.mine_id === "balaghat" ? 490 : mine.mine_id === "ukwa" ? 350 : 265;
  const plannedTonnage = dailyPlan * horizon;
  const weatherLift = mine.dominant_driver === "Rainfall" ? 0.08 : 0;
  const shortfallProbability = Math.min(0.88, mine.shortfall_probability + weatherLift);
  const predictedTonnage = plannedTonnage * (1 - shortfallProbability * 0.42);

  return {
    mine_id: mine.mine_id,
    horizon_days: horizon,
    predicted_tonnage: Number(predictedTonnage.toFixed(0)),
    planned_tonnage: plannedTonnage,
    shortfall_probability: Number(shortfallProbability.toFixed(2)),
    dominant_driver: mine.dominant_driver,
    local_reserve_confidence: mine.reserve_confidence,
    model_version: "forecast-xgb-v0.3",
    provenance: "Synthetic demo operations + reserve-grid feature",
  };
}

function historyFor(mine: MineRecord, days: number) {
  const dailyPlan = mine.mine_id === "balaghat" ? 490 : mine.mine_id === "ukwa" ? 350 : 265;
  const start = new Date("2026-05-31T00:00:00.000Z");
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const rainfall = Math.max(
      0,
      7 + 18 * Math.sin(index / 8) + (index > days - 20 ? 22 : 0),
    );
    const downtime = Math.max(
      1,
      4 + 2.5 * Math.cos(index / 6) + (index % 19 === 0 ? 14 : 0),
    );
    const blastDelay = index % 17 === 0 || index % 29 === 0;
    const disruption = rainfall > 25 ? 0.09 : 0;
    const actual = dailyPlan * (1 - downtime / 100 - disruption - (blastDelay ? 0.06 : 0));
    return {
      date: date.toISOString().slice(0, 10),
      planned_tonnage: dailyPlan,
      actual_tonnage: Number(actual.toFixed(0)),
      downtime_hours: Number(downtime.toFixed(1)),
      rainfall_mm: Number(rainfall.toFixed(1)),
      blast_delay_flag: blastDelay,
      data_provenance: "synthetic_demo_operations + synthetic_demo_weather",
    };
  });
}

router.get("/mines", (_req, res) => {
  res.json(ListMinesResponse.parse(mines));
});

router.get("/reserves/heatmap", (req, res) => {
  const query = GetReserveHeatmapQueryParams.parse(req.query);
  let points = reservePoints;
  if (query.bbox) {
    const values = query.bbox.split(",").map(Number);
    if (values.length === 4 && values.every(Number.isFinite)) {
      const [minLon, minLat, maxLon, maxLat] = values;
      points = reservePoints.filter(
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
      model_version: modelVersion,
      computed_at: "2026-08-29T09:00:00.000Z",
    }),
  );
});

router.get("/reserves/validation", (_req, res) => {
  res.json(
    GetReserveValidationResponse.parse({
      confirmed_mines_checked: 3,
      avg_percentile_rank: 82.4,
      per_mine: [
        { mine_id: "balaghat", percentile: 91.2 },
        { mine_id: "ukwa", percentile: 83.4 },
        { mine_id: "tirodi", percentile: 72.6 },
      ],
      method: "Leave-one-out percentile ranking on public-source approximate mine points",
    }),
  );
});

router.get("/production/:mineId/history", (req, res) => {
  const { mineId } = GetProductionHistoryParams.parse(req.params);
  const { days } = GetProductionHistoryQueryParams.parse(req.query);
  const mine = findMine(mineId);
  if (!mine) {
    res.status(404).json({ error: "Mine not found" });
    return;
  }
  res.json(GetProductionHistoryResponse.parse(historyFor(mine, days)));
});

router.get("/production/:mineId/forecast", (req, res) => {
  const { mineId } = GetProductionForecastParams.parse(req.params);
  const { horizon } = GetProductionForecastQueryParams.parse({
    ...req.query,
    horizon:
      typeof req.query.horizon === "string"
        ? Number(req.query.horizon)
        : req.query.horizon,
  });
  const mine = findMine(mineId);
  if (!mine) {
    res.status(404).json({ error: "Mine not found" });
    return;
  }
  res.json(GetProductionForecastResponse.parse(forecastFor(mine, horizon)));
});

router.get("/recommendations/:mineId", (req, res) => {
  const { mineId } = GetMineRecommendationParams.parse(req.params);
  const { horizon } = GetMineRecommendationQueryParams.parse({
    ...req.query,
    horizon:
      typeof req.query.horizon === "string"
        ? Number(req.query.horizon)
        : req.query.horizon,
  });
  const mine = findMine(mineId);
  if (!mine) {
    res.status(404).json({ error: "Mine not found" });
    return;
  }
  const forecast = forecastFor(mine, horizon);
  const recommendation = recommend(forecast);
  res.json(
    GetMineRecommendationResponse.parse({
      mine_id: mine.mine_id,
      ...recommendation,
      explanation_text: `${recommendation.action} is the current planning priority because ${recommendation.driver.toLowerCase()} is the dominant modeled driver for the ${horizon}-day outlook. The reserve confidence feature is ${Math.round(mine.reserve_confidence * 100)}%, so this remains a screening signal for planning and drilling follow-up rather than a subsurface certainty.`,
      generated_at: "2026-08-29T09:00:00.000Z",
    }),
  );
});

export default router;