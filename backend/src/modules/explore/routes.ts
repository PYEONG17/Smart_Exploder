import { Router } from "express";
import {
  listExploreMaterials,
  getExploreFilters,
  getExploreMaterialById,
  createExploreMaterial,
} from "./controller.js";

const router = Router();

router.get("/filters", getExploreFilters);
router.get("/", listExploreMaterials);
router.get("/:id", getExploreMaterialById);
router.post("/", createExploreMaterial);

export default router;
