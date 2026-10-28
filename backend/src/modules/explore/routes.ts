import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  listExploreMaterials,
  getExploreFilters,
  getExploreMaterialById,
  createExploreMaterial,
  updateExploreMaterial,
  deleteExploreMaterial,
  triggerSeedMaterials,
} from "./controller.js";

const router = Router();

router.get("/filters", getExploreFilters);
router.post(
  "/seed",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  triggerSeedMaterials,
);
router.get("/", listExploreMaterials);
router.get("/:id", getExploreMaterialById);
router.post(
  "/",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  createExploreMaterial,
);
router.put(
  "/:id",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  updateExploreMaterial,
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  deleteExploreMaterial,
);

export default router;
