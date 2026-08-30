import { createInsertSchema } from "drizzle-zod";
import { pgTable, real, text, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const minesTable = pgTable("mines", {
  mineId: varchar("mine_id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  mineType: varchar("mine_type", { length: 30 }).notNull(),
  coordinateStatus: varchar("coordinate_status", { length: 50 }).notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  depthM: real("depth_m"),
  reserveConfidence: real("reserve_confidence").notNull(),
  shortfallProbability: real("shortfall_probability").notNull(),
  dominantDriver: text("dominant_driver").notNull(),
});

export const insertMineSchema = createInsertSchema(minesTable);
export type InsertMine = z.infer<typeof insertMineSchema>;
export type Mine = typeof minesTable.$inferSelect;