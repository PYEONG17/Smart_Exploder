import { Router } from "express";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../../middlewares/auth.middleware.js";
import { lab3DModelUpload } from "../../utils/course-media.js";
import {
  listExploreMaterials,
  listManageableExploreMaterials,
  getManageableExploreMaterialById,
  getExploreFilters,
  getExploreMaterialById,
  createExploreMaterial,
  updateExploreMaterial,
  deleteExploreMaterial,
} from "./controller.js";

const router = Router();

router.get("/filters", getExploreFilters);
router.get(
  "/management",
  requireAuth,
  requireRole("TEACHER"),
  listManageableExploreMaterials,
);
router.get(
  "/management/:id",
  requireAuth,
  requireRole("TEACHER"),
  getManageableExploreMaterialById,
);
router.get("/", listExploreMaterials);
router.get("/:id", optionalAuth, getExploreMaterialById);
router.post(
  "/",
  requireAuth,
  requireRole("TEACHER"),
  lab3DModelUpload,
  createExploreMaterial,
);
router.put(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  lab3DModelUpload,
  updateExploreMaterial,
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  deleteExploreMaterial,
);

export default router;
