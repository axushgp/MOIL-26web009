import assert from "node:assert/strict";
import test from "node:test";
import { recommend } from "./rules-engine";

test("recommends equipment redeployment for downtime", () => {
  assert.equal(recommend({ dominant_driver: "Equipment downtime" }).action, "Redeploy standby equipment");
});

test("recommends stockpiling for rainfall", () => {
  assert.equal(recommend({ dominant_driver: "rainfall_mm" }).action, "Advance stockpiling");
});

test("recommends redirecting development for reserve confidence", () => {
  assert.equal(
    recommend({ dominant_driver: "local_reserve_confidence" }).action,
    "Redirect development toward priority zone",
  );
});

test("falls back to monitoring for an unknown driver", () => {
  const recommendation = recommend({ dominant_driver: "unknown" });
  assert.equal(recommendation.action, "Continue standard monitoring");
  assert.equal(recommendation.driver, "unknown");
});