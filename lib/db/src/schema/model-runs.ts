import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const modelRunsTable = pgTable("model_runs", {
  modelVersion: varchar("model_version", { length: 50 }).primaryKey(),
  module: varchar("module", { length: 50 }).notNull(),
  trainedAt: timestamp("trained_at", { withTimezone: true }).notNull().defaultNow(),
  nPositiveExamples: integer("n_positive_examples"),
  loocvAvgPercentile: real("loocv_avg_percentile"),
  inSampleAvgPercentile: real("in_sample_avg_percentile"),
  featureImportances: jsonb("feature_importances").$type<Record<string, number> | null>(),
  notes: text("notes"),
});

export const insertModelRunSchema = createInsertSchema(modelRunsTable).omit({
  trainedAt: true,
});
export type InsertModelRun = z.infer<typeof insertModelRunSchema>;
export type ModelRun = typeof modelRunsTable.$inferSelect;