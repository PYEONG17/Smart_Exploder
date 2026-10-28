import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { lab3DModelUpload } from "../../utils/course-media.js";
import { listLabModels, saveLabModel } from "./lab-models.controller.js";

const router = Router();

router.get("/", listLabModels);
router.post(
  "/:experimentId",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  lab3DModelUpload,
  saveLabModel,
);
export default router;
