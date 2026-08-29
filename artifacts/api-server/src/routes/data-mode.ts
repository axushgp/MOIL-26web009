import { Router, type IRouter } from "express";
import {
  DataModeRequest,
  DataModeResponse,
} from "@workspace/api-zod";
import {
  getDataMode,
  setDataMode,
} from "../lib/data-mode";

const router: IRouter = Router();

router.get("/data-mode", (_req, res) => {
  res.json(DataModeResponse.parse(getDataMode()));
});

router.put("/data-mode", (req, res, next) => {
  try {
    const request = DataModeRequest.parse(req.body);
    res.json(DataModeResponse.parse(setDataMode(request)));
  } catch (error) {
    next(error);
  }
});

export default router;