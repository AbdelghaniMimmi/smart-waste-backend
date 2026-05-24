import { Router } from "express";
import { getAllBinsStatus, getCriticalBins } from "../controllers/binController";

const router = Router();

router.get("/bins/status", getAllBinsStatus);
router.get("/bins/critical", getCriticalBins);

export default router;