import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    error.statusCode === 503
  ) {
    res.status(503).json({
      code: "LIVE_DATA_NOT_READY",
      error: error instanceof Error ? error.message : "Live data is not ready.",
    });
    return;
  }

  logger.error({ err: error }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
