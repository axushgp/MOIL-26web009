import { Router, type IRouter } from "express";
import {
  GetDataModeResponse,
  SetDataModeBody,
} from "@workspace/api-zod";
import {
  getDataMode,
  setDataMode,
} from "../lib/data-mode";

const router: IRouter = Router();

router.get("/data-mode", (_req, res) => {
  res.json(GetDataModeResponse.parse(getDataMode()));
});

router.put("/data-mode", (req, res, next) => {
  try {
    const request = SetDataModeBody.parse(req.body);
    res.json(GetDataModeResponse.parse(setDataMode(request)));
  } catch (error) {
    next(error);
  }
});

export default router;