import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { customLabAttachmentsUpload } from "../../utils/course-media.js";
import {
  createCustomLab,
  authorizeCustomLabWrite,
  deleteCustomLab,
  getCustomLab,
  listCustomLabs,
  updateCustomLab,
} from "./custom-labs.controller.js";

const router = Router();

router.get("/", listCustomLabs);
router.get("/:id", getCustomLab);
router.put(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  authorizeCustomLabWrite,
  customLabAttachmentsUpload,
  updateCustomLab,
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  deleteCustomLab,
);
router.post(
  "/",
  requireAuth,
  requireRole("TEACHER"),
  customLabAttachmentsUpload,
  createCustomLab,
);

export default router;
