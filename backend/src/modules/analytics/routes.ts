import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  getMyLearningSummary,
  recordVideoHeartbeat,
} from "./controller.js";

const router = Router();

router.use(requireAuth, requireRole("STUDENT"));
router.get("/me", getMyLearningSummary);
router.post("/videos/:videoId/heartbeat", recordVideoHeartbeat);

export default router;
