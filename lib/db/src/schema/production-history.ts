import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, real, serial, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { minesTable } from "./mines";

export const productionHistoryTable = pgTable(
  "production_history",
  {
    id: serial("id").primaryKey(),
    mineId: varchar("mine_id", { length: 50 })
      .notNull()
      .references(() => minesTable.mineId),
    date: date("date", { mode: "string" }).notNull(),
    plannedTonnage: real("planned_tonnage").notNull(),
    actualTonnage: real("actual_tonnage").notNull(),
    downtimeHours: real("downtime_hours").notNull(),
    rainfallMm: real("rainfall_mm").notNull(),
    blastDelayFlag: boolean("blast_delay_flag").notNull(),
    dataProvenance: varchar("data_provenance", { length: 80 }).notNull(),
  },
  (table) => ({
    mineDateUnique: uniqueIndex("production_history_mine_date_idx").on(
      table.mineId,
      table.date,
    ),
  }),
);

export const insertProductionHistorySchema = createInsertSchema(productionHistoryTable).omit({
  id: true,
});
export type InsertProductionHistory = z.infer<typeof insertProductionHistorySchema>;
export type ProductionHistory = typeof productionHistoryTable.$inferSelect;