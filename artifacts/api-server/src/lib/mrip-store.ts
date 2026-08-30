import { asc, eq } from "drizzle-orm";
import {
  db,
  minesTable,
  modelRunsTable,
  productionHistoryTable,
  recommendationsTable,
  reserveGridTable,
  shortfallForecastsTable,
  type Mine,
  type ProductionHistory,
  type ReserveGrid,
  type ShortfallForecast,
} from "@workspace/db";
import { recommend } from "./rules-engine";
import { loadLiveBundle } from "./live-adapters";

const RESERVE_MODEL_VERSION = "fusion-v0.4";
const FORECAST_MODEL_VERSION = "forecast-xgb-v0.3";
const DEMO_RUN_AT = new Date("2026-08-29T09:00:00.000Z");
const DEMO_START_DATE = "2026-05-31";

type DemoMine = Omit<Mine, "createdAt">;

const SYNTHETIC_DEMO_MINES: DemoMine[] = [
  {
    mineId: "balaghat",
    name: "Balaghat (Bharveli)",
    district: "Balaghat, Madhya Pradesh",
    mineType: "Underground",
    coordinateStatus: "public-source approximate",
    latitude: 21.8,
    longitude: 80.18,
    depthM: 383,
    reserveConfidence: 0.86,
    shortfallProbability: 0.18,
    dominantDriver: "Rainfall",
  },
  {
    mineId: "ukwa",
    name: "Ukwa",
    district: "Balaghat, Madhya Pradesh",
    mineType: "Opencast",
    coordinateStatus: "public-source approximate",
    latitude: 21.97,
    longitude: 80.47,
    depthM: null,
    reserveConfidence: 0.78,
    shortfallProbability: 0.34,
    dominantDriver: "Equipment downtime",
  },
  {
    mineId: "tirodi",
    name: "Tirodi",
    district: "Balaghat, Madhya Pradesh",
    mineType: "Underground",
    coordinateStatus: "town proxy",
    latitude: 21.68,
    longitude: 79.72,
    depthM: null,
    reserveConfidence: 0.71,
    shortfallProbability: 0.27,
    dominantDriver: "Reserve confidence",
  },
  {
    mineId: "chikla",
    name: "Chikla",
    district: "Bhandara, Maharashtra",
    mineType: "Underground",
    coordinateStatus: "needs input",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.64,
    shortfallProbability: 0.42,
    dominantDriver: "Reserve confidence",
  },
  {
    mineId: "kandri",
    name: "Kandri",
    district: "Nagpur, Maharashtra",
    mineType: "Underground",
    coordinateStatus: "district placeholder",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.58,
    shortfallProbability: 0.31,
    dominantDriver: "Equipment downtime",
  },
  {
    mineId: "mansar",
    name: "Munsar / Mansar",
    district: "Nagpur, Maharashtra",
    mineType: "Underground",
    coordinateStatus: "district placeholder",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.62,
    shortfallProbability: 0.22,
    dominantDriver: "Rainfall",
  },
  {
    mineId: "beldongri",
    name: "Beldongri",
    district: "Nagpur, Maharashtra",
    mineType: "Underground",
    coordinateStatus: "district placeholder",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.55,
    shortfallProbability: 0.29,
    dominantDriver: "Blast delays",
  },
  {
    mineId: "gumgaon",
    name: "Gumgaon",
    district: "Nagpur, Maharashtra",
    mineType: "Underground",
    coordinateStatus: "district placeholder",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.51,
    shortfallProbability: 0.38,
    dominantDriver: "Equipment downtime",
  },
  {
    mineId: "dongri-buzurg",
    name: "Dongri Buzurg",
    district: "Bhandara, Maharashtra",
    mineType: "Opencast",
    coordinateStatus: "district placeholder",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.67,
    shortfallProbability: 0.19,
    dominantDriver: "Rainfall",
  },
  {
    mineId: "sitapatore",
    name: "Sitapatore",
    district: "Bhandara, Maharashtra",
    mineType: "Underground",
    coordinateStatus: "district placeholder",
     latitude: null,
     longitude: null,
    depthM: null,
    reserveConfidence: 0.6,
    shortfallProbability: 0.25,
    dominantDriver: "Blast delays",
  },
];

function distance(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
) {
  const latScale = 111;
  const lonScale = 104;
  return Math.sqrt(
    Math.pow((aLat - bLat) * latScale, 2) +
      Math.pow((aLon - bLon) * lonScale, 2),
  );
}

function syntheticReserveGrid() {
  return Array.from({ length: 72 }, (_, index) => {
    const row = Math.floor(index / 12);
    const column = index % 12;
    const latitude = 21.08 + row * 0.105;
    const longitude = 78.86 + column * 0.15;
    const locatedMines = SYNTHETIC_DEMO_MINES.filter(
      (mine) => mine.latitude !== null && mine.longitude !== null,
    );
    const nearestMine = locatedMines.length
      ? Math.min(
        ...locatedMines.map((mine) =>
        distance(latitude, longitude, mine.latitude!, mine.longitude!),
        ),
      )
      : Infinity;
    const structuralBand =
      0.45 + 0.25 * Math.sin((longitude - 78.7) * 7 + latitude * 2.2);
    const spectralBand =
      0.42 + 0.3 * Math.cos((latitude - 21) * 8 - longitude * 1.7);
    const mineInfluence = Math.max(0, 1 - nearestMine / 52);
    const reserveProbability = Math.min(
      0.97,
      Math.max(
        0.12,
        0.16 +
          mineInfluence * 0.54 +
          structuralBand * 0.14 +
          spectralBand * 0.13,
      ),
    );

    return {
      latitude: Number(latitude.toFixed(3)),
      longitude: Number(longitude.toFixed(3)),
      reserveProbability: Number(reserveProbability.toFixed(3)),
      spectralScore: Number(Math.max(0.08, spectralBand).toFixed(3)),
      structuralScore: Number(Math.max(0.08, structuralBand).toFixed(3)),
      zoneType:
        reserveProbability > 0.72
          ? "priority zone"
          : reserveProbability > 0.5
            ? "screening zone"
            : "background",
      modelVersion: RESERVE_MODEL_VERSION,
      computedAt: DEMO_RUN_AT,
    };
  });
}

function dailyPlanFor(mineId: string) {
  return mineId === "balaghat" ? 490 : mineId === "ukwa" ? 350 : 265;
}

function dateAfter(startDate: string, days: number) {
  const date = new Date(`${startDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function syntheticHistoryFor(mine: DemoMine, days: number) {
  const dailyPlan = dailyPlanFor(mine.mineId);
  return Array.from({ length: days }, (_, index) => {
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
    const actual =
      dailyPlan *
      (1 - downtime / 100 - disruption - (blastDelay ? 0.06 : 0));
    return {
      mineId: mine.mineId,
      date: dateAfter(DEMO_START_DATE, index),
      plannedTonnage: dailyPlan,
      actualTonnage: Number(actual.toFixed(0)),
      downtimeHours: Number(downtime.toFixed(1)),
      rainfallMm: Number(rainfall.toFixed(1)),
      blastDelayFlag: blastDelay,
      dataProvenance: "synthetic_demo_operations + synthetic_demo_weather",
    };
  });
}

async function hasMineRows() {
  const rows = await db
    .select({ mineId: minesTable.mineId })
    .from(minesTable)
    .limit(1);
  return rows.length > 0;
}

async function hasReserveRows() {
  const rows = await db
    .select({ id: reserveGridTable.id })
    .from(reserveGridTable)
    .limit(1);
  return rows.length > 0;
}

async function hasProductionRows() {
  const rows = await db
    .select({ id: productionHistoryTable.id })
    .from(productionHistoryTable)
    .limit(1);
  return rows.length > 0;
}

async function seedSyntheticPreviewData() {
  for (const mine of SYNTHETIC_DEMO_MINES) {
    // The development database may retain the original imported schema, where
    // mine coordinates are non-null. Do not invent coordinates for unresolved
    // mine locations; those records remain documented in the source constant
    // but are omitted from the seeded operational register.
    if (mine.latitude === null || mine.longitude === null) continue;
    await db
      .insert(minesTable)
      .values(mine)
      .onConflictDoUpdate({
        target: minesTable.mineId,
        set: {
          name: mine.name,
          district: mine.district,
          mineType: mine.mineType,
          coordinateStatus: mine.coordinateStatus,
          latitude: mine.latitude,
          longitude: mine.longitude,
          depthM: mine.depthM,
          reserveConfidence: mine.reserveConfidence,
          shortfallProbability: mine.shortfallProbability,
          dominantDriver: mine.dominantDriver,
        },
      });
  }

  await db
    .insert(modelRunsTable)
    .values([
      {
        modelVersion: RESERVE_MODEL_VERSION,
        module: "reserve-mapping",
        trainedAt: DEMO_RUN_AT,
        nPositiveExamples: 3,
        loocvAvgPercentile: 82.4,
        inSampleAvgPercentile: 91.2,
        featureImportances: {
          spectral_score: 0.46,
          structural_score: 0.39,
          mine_influence: 0.15,
        },
        notes:
          "Synthetic preview grid; public-source approximate mine points; PostGIS unavailable in this environment.",
      },
      {
        modelVersion: FORECAST_MODEL_VERSION,
        module: "production-forecasting",
        trainedAt: DEMO_RUN_AT,
        nPositiveExamples: 10,
        loocvAvgPercentile: null,
        inSampleAvgPercentile: null,
        featureImportances: {
          rainfall_mm: 0.38,
          downtime_hours: 0.34,
          local_reserve_confidence: 0.18,
          blast_delay_flag: 0.1,
        },
        notes: "Synthetic demo operations and synthetic demo weather.",
      },
    ])
    .onConflictDoNothing();

  if (!(await hasReserveRows())) {
    await db.insert(reserveGridTable).values(syntheticReserveGrid());
  }

  if (!(await hasProductionRows())) {
    const productionRows = SYNTHETIC_DEMO_MINES.flatMap((mine) =>
      mine.latitude !== null && mine.longitude !== null
        ? syntheticHistoryFor(mine, 365)
        : [],
    );
    await db.insert(productionHistoryTable).values(productionRows);
  }
}

let initialization: Promise<void> | undefined;

export function initializeMripStore() {
  initialization ??= seedSyntheticPreviewData();
  return initialization;
}

function toMineResponse(mine: Mine) {
  return {
    mine_id: mine.mineId,
    name: mine.name,
    district: mine.district,
    mine_type: mine.mineType,
    coordinate_status: mine.coordinateStatus,
    data_provenance: "synthetic_demo_mine_register",
    latitude: mine.latitude,
    longitude: mine.longitude,
    depth_m: mine.depthM,
    reserve_confidence: mine.reserveConfidence,
    shortfall_probability: mine.shortfallProbability,
    dominant_driver: mine.dominantDriver,
  };
}

function toHistoryResponse(row: ProductionHistory) {
  return {
    date: row.date,
    planned_tonnage: row.plannedTonnage,
    actual_tonnage: row.actualTonnage,
    downtime_hours: row.downtimeHours,
    rainfall_mm: row.rainfallMm,
    blast_delay_flag: row.blastDelayFlag,
    data_provenance: row.dataProvenance,
  };
}

function toReserveResponse(row: ReserveGrid) {
  return {
    latitude: row.latitude,
    longitude: row.longitude,
    reserve_probability: row.reserveProbability,
    spectral_score: row.spectralScore,
    structural_score: row.structuralScore,
    zone_type: row.zoneType,
    data_provenance: "synthetic_demo_satellite_geology_fusion",
  };
}

function toForecastResponse(row: ShortfallForecast) {
  return {
    mine_id: row.mineId,
    horizon_days: row.horizonDays,
    predicted_tonnage: row.predictedTonnage,
    planned_tonnage: row.plannedTonnage,
    shortfall_probability: row.shortfallProbability,
    dominant_driver: row.dominantDriver,
    local_reserve_confidence: row.localReserveConfidence,
    model_version: row.modelVersion,
    provenance: row.provenance,
  };
}

export async function listMines() {
  const rows = await db.select().from(minesTable).orderBy(asc(minesTable.name));
  return rows.map(toMineResponse);
}

export function listLiveMines() {
  return loadLiveBundle().mines.map(({ provenance: data_provenance, ...mine }) => ({
    ...mine,
    data_provenance,
  }));
}

export function listLiveReservePoints() {
  return loadLiveBundle().reserve_points;
}

export function getLiveProductionHistory(mineId: string, days: number) {
  return loadLiveBundle().production_history
    .filter((row) => row.mine_id === mineId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, days);
}

export function getLiveValidation() {
  return loadLiveBundle().validation;
}

export function getLiveForecast(mineId: string, horizon: number) {
  return loadLiveBundle().forecasts.find(
    (forecast) => forecast.mine_id === mineId && forecast.horizon_days === horizon,
  );
}

export function getLiveRecommendation(mineId: string, horizon: number) {
  const forecast = getLiveForecast(mineId, horizon);
  return forecast
    ? loadLiveBundle().recommendations.find((recommendation) => recommendation.mine_id === mineId)
    : undefined;
}

export async function findMine(mineId: string) {
  const [row] = await db
    .select()
    .from(minesTable)
    .where(eq(minesTable.mineId, mineId))
    .limit(1);
  return row ? toMineResponse(row) : undefined;
}

export async function listReservePoints() {
  const rows = await db
    .select()
    .from(reserveGridTable)
    .orderBy(asc(reserveGridTable.id));
  return rows.map(toReserveResponse);
}

export async function getProductionHistory(mineId: string, days: number) {
  const rows = await db
    .select()
    .from(productionHistoryTable)
    .where(eq(productionHistoryTable.mineId, mineId))
    .orderBy(asc(productionHistoryTable.date))
    .limit(days);
  return rows.map(toHistoryResponse);
}

function buildForecast(mine: NonNullable<Awaited<ReturnType<typeof findMine>>>, horizon: number) {
  const plannedTonnage = dailyPlanFor(mine.mine_id) * horizon;
  const weatherLift = mine.dominant_driver === "Rainfall" ? 0.08 : 0;
  const shortfallProbability = Math.min(
    0.88,
    mine.shortfall_probability + weatherLift,
  );
  const predictedTonnage =
    plannedTonnage * (1 - shortfallProbability * 0.42);

  return {
    mineId: mine.mine_id,
    forecastDate: DEMO_RUN_AT.toISOString().slice(0, 10),
    horizonDays: horizon,
    predictedTonnage: Number(predictedTonnage.toFixed(0)),
    plannedTonnage,
    shortfallProbability: Number(shortfallProbability.toFixed(2)),
    dominantDriver: mine.dominant_driver,
    localReserveConfidence: mine.reserve_confidence,
    modelVersion: FORECAST_MODEL_VERSION,
    provenance: "Synthetic demo operations + reserve-grid feature",
    createdAt: DEMO_RUN_AT,
  };
}

export async function persistForecast(
  mine: NonNullable<Awaited<ReturnType<typeof findMine>>>,
  horizon: number,
) {
  const values = buildForecast(mine, horizon);
  const [row] = await db
    .insert(shortfallForecastsTable)
    .values(values)
    .onConflictDoUpdate({
      target: [
        shortfallForecastsTable.mineId,
        shortfallForecastsTable.forecastDate,
        shortfallForecastsTable.horizonDays,
      ],
      set: {
        predictedTonnage: values.predictedTonnage,
        plannedTonnage: values.plannedTonnage,
        shortfallProbability: values.shortfallProbability,
        dominantDriver: values.dominantDriver,
        localReserveConfidence: values.localReserveConfidence,
        modelVersion: values.modelVersion,
        provenance: values.provenance,
        createdAt: values.createdAt,
      },
    })
    .returning();
  return row;
}

export async function persistRecommendation(
  mine: NonNullable<Awaited<ReturnType<typeof findMine>>>,
  forecast: ShortfallForecast,
) {
  const recommendation = recommend({
    dominant_driver: forecast.dominantDriver,
  });
  const [row] = await db
    .insert(recommendationsTable)
    .values({
      mineId: mine.mine_id,
      forecastId: forecast.id,
      action: recommendation.action,
      detail: recommendation.detail,
      explanationText: `${recommendation.action} is the current planning priority because ${recommendation.driver.toLowerCase()} is the dominant modeled driver for the ${forecast.horizonDays}-day outlook. The reserve confidence feature is ${Math.round(mine.reserve_confidence * 100)}%, so this remains a screening signal for planning and drilling follow-up rather than a subsurface certainty.`,
      driver: recommendation.driver,
      generatedAt: DEMO_RUN_AT,
    })
    .returning();
  return row;
}

export function recommendationResponse(
  mine: NonNullable<Awaited<ReturnType<typeof findMine>>>,
  forecast: ShortfallForecast,
  recommendation: Awaited<ReturnType<typeof persistRecommendation>>,
) {
  return {
    mine_id: mine.mine_id,
    action: recommendation.action,
    detail: recommendation.detail,
    driver: recommendation.driver,
    explanation_text: recommendation.explanationText,
    generated_at: recommendation.generatedAt.toISOString(),
    provenance: "synthetic_demo_rules_engine",
  };
}