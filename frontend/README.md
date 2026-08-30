# Frontend surface

The Replit preview is the React + Vite frontend required by Section 9. It
lives at `artifacts/moil-mrip/` because Replit artifact routing and the shared
pnpm workspace own its preview port. Its reserve map, mine selector, forecast
chart, and recommendation panel are the frontend components for this project.

The root `api/` service is the specification-compatible FastAPI surface for a
Docker Compose scientific deployment; `artifacts/api-server/` remains the
Replit-native preview API.