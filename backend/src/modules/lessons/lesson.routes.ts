import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  createLesson,
  deleteLesson,
  getLessonById,
  reorderLessonVideos,
  updateLesson,
} from "./lesson.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("TEACHER"), createLesson);
router.get("/:id", requireAuth, requireRole("STUDENT", "TEACHER"), getLessonById);
router.put("/:id/videos/order", requireAuth, requireRole("TEACHER"), reorderLessonVideos);
router.patch("/:id", requireAuth, requireRole("TEACHER"), updateLesson);
router.delete("/:id", requireAuth, requireRole("TEACHER"), deleteLesson);

export default router;
