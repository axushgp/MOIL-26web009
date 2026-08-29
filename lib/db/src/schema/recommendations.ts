import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { minesTable } from "./mines";
import { shortfallForecastsTable } from "./shortfall-forecasts";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  mineId: varchar("mine_id", { length: 50 })
    .notNull()
    .references(() => minesTable.mineId),
  forecastId: integer("forecast_id").references(() => shortfallForecastsTable.id),
  action: varchar("action", { length: 120 }).notNull(),
  detail: text("detail").notNull(),
  explanationText: text("explanation_text").notNull(),
  driver: varchar("driver", { length: 80 }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({
  id: true,
  generatedAt: true,
});
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;