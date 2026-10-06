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

router.post("/", requireAuth, requireRole("TEACHER", "ADMIN"), createLesson);
router.get("/:id", requireAuth, requireRole("STUDENT", "TEACHER", "ADMIN"), getLessonById);
router.put("/:id/videos/order", requireAuth, requireRole("TEACHER", "ADMIN"), reorderLessonVideos);
router.patch("/:id", requireAuth, requireRole("TEACHER", "ADMIN"), updateLesson);
router.delete("/:id", requireAuth, requireRole("TEACHER", "ADMIN"), deleteLesson);

export default router;
