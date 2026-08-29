import { createInsertSchema } from "drizzle-zod";
import { pgTable, real, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const reserveGridTable = pgTable("reserve_grid", {
  id: serial("id").primaryKey(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  spectralScore: real("spectral_score").notNull(),
  structuralScore: real("structural_score").notNull(),
  reserveProbability: real("reserve_probability").notNull(),
  zoneType: varchar("zone_type", { length: 30 }).notNull(),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReserveGridSchema = createInsertSchema(reserveGridTable).omit({
  id: true,
  computedAt: true,
});
export type InsertReserveGrid = z.infer<typeof insertReserveGridSchema>;
export type ReserveGrid = typeof reserveGridTable.$inferSelect;