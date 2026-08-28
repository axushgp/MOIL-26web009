const baseUrl = process.env.MRIP_API_URL || "http://127.0.0.1:8080/api";

const expectedEndpoints = [
  "/healthz",
  "/mines",
  "/reserves/heatmap",
  "/reserves/validation",
];

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

const health = await get("/healthz");
if (health.status !== "ok") throw new Error("Health response is not ok");

const mines = await get("/mines");
if (!Array.isArray(mines) || mines.length < 1) throw new Error("Mine register is empty");

const mineId = mines[0].mine_id;
const heatmap = await get("/reserves/heatmap");
if (!Array.isArray(heatmap.points) || !heatmap.model_version) {
  throw new Error("Reserve heatmap contract is incomplete");
}

const validation = await get("/reserves/validation");
if (!Array.isArray(validation.per_mine) || validation.confirmed_mines_checked < 1) {
  throw new Error("Validation contract is incomplete");
}

const history = await get(`/production/${mineId}/history?days=30`);
const forecast = await get(`/production/${mineId}/forecast?horizon=30`);
const recommendation = await get(`/recommendations/${mineId}?horizon=30`);

if (history.length !== 30) throw new Error("Production history did not honor days=30");
if (!forecast.local_reserve_confidence) throw new Error("Forecast is missing reserve-grid feature");
if (!recommendation.action || !recommendation.driver || !recommendation.explanation_text) {
  throw new Error("Recommendation contract is incomplete");
}

console.log(`MRIP smoke check passed: ${expectedEndpoints.length + 3} core endpoints plus mine drill-down.`);