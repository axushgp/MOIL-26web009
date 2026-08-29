import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, real, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { minesTable } from "./mines";

export const shortfallForecastsTable = pgTable(
  "shortfall_forecasts",
  {
    id: serial("id").primaryKey(),
    mineId: varchar("mine_id", { length: 50 })
      .notNull()
      .references(() => minesTable.mineId),
    forecastDate: date("forecast_date", { mode: "string" }).notNull(),
    horizonDays: integer("horizon_days").notNull(),
    predictedTonnage: real("predicted_tonnage").notNull(),
    plannedTonnage: real("planned_tonnage").notNull(),
    shortfallProbability: real("shortfall_probability").notNull(),
    dominantDriver: varchar("dominant_driver", { length: 80 }).notNull(),
    localReserveConfidence: real("local_reserve_confidence").notNull(),
    modelVersion: varchar("model_version", { length: 50 }).notNull(),
    provenance: varchar("provenance", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    mineHorizonDateUnique: uniqueIndex("shortfall_forecasts_lookup_idx").on(
      table.mineId,
      table.forecastDate,
      table.horizonDays,
    ),
  }),
);

export const insertShortfallForecastSchema = createInsertSchema(shortfallForecastsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertShortfallForecast = z.infer<typeof insertShortfallForecastSchema>;
export type ShortfallForecast = typeof shortfallForecastsTable.$inferSelect;