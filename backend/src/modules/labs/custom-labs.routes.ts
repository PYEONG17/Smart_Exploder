import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { customLabAttachmentsUpload } from "../../utils/course-media.js";
import {
  createCustomLab,
  getCustomLab,
  listCustomLabs,
} from "./custom-labs.controller.js";

const router = Router();

router.get("/", listCustomLabs);
router.get("/:id", getCustomLab);
router.post(
  "/",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  customLabAttachmentsUpload,
  createCustomLab,
);

export default router;
