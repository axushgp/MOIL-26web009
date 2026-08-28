export type ShortfallRisk = {
  dominant_driver: string;
};

export type Recommendation = {
  action: string;
  detail: string;
  driver: string;
};

/**
 * Deterministic planning rules.
 *
 * This function deliberately owns the operational decision. Any future
 * natural-language layer may only phrase the returned recommendation; it must
 * not choose a different action or driver.
 */
export function recommend(shortfallRisk: ShortfallRisk): Recommendation {
  const driver = shortfallRisk.dominant_driver;
  const normalizedDriver = driver.trim().toLowerCase();

  if (normalizedDriver === "equipment downtime" || normalizedDriver === "downtime_hours") {
    return {
      action: "Redeploy standby equipment",
      detail: "Review the nearest underutilised fleet and stage one compatible unit before the next maintenance window.",
      driver: "Equipment downtime",
    };
  }

  if (normalizedDriver === "rainfall" || normalizedDriver === "rainfall_mm") {
    return {
      action: "Advance stockpiling",
      detail: "Build a controlled surface stockpile ahead of the monsoon-sensitive production window.",
      driver: "Rainfall",
    };
  }

  if (
    normalizedDriver === "reserve confidence" ||
    normalizedDriver === "local_reserve_confidence"
  ) {
    return {
      action: "Redirect development toward priority zone",
      detail: "Prioritise drilling and development toward the nearest high-confidence unexplored zone before committing new capacity.",
      driver: "Reserve confidence",
    };
  }

  return {
    action: "Continue standard monitoring",
    detail: "No single dominant driver is classified; continue standard monitoring while the next evidence update is prepared.",
    driver,
  };
}