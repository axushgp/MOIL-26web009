const baseUrl = process.env.MRIP_API_URL || "http://127.0.0.1:8080/api";

const expectedEndpoints = [
  "/healthz",
  "/data-mode",
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

const dataMode = await get("/data-mode");
if (dataMode.mode !== "synthetic" || dataMode.sources?.length < 5) {
  throw new Error("Data-mode readiness contract is incomplete");
}

if (!dataMode.live_ready) {
  const liveModeResponse = await fetch(`${baseUrl}/data-mode`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "live" }),
  });
  if (!liveModeResponse.ok) throw new Error("Could not select live mode");
  const liveMinesResponse = await fetch(`${baseUrl}/mines`);
  if (liveMinesResponse.status !== 503) {
    throw new Error("Live mode did not fail closed when adapters were incomplete");
  }
  const syntheticModeResponse = await fetch(`${baseUrl}/data-mode`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "synthetic" }),
  });
  if (!syntheticModeResponse.ok) throw new Error("Could not restore synthetic mode");
}

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