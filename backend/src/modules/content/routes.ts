import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  createVideoActivity,
  deleteMaterial,
  deleteQuiz,
  deleteVideo,
  deleteVideoActivity,
  listVideoActivities,
  updateVideoActivity,
  updateVideoMetadata,
} from "./controller.js";

const router = Router();
const teacherOnly = [requireAuth, requireRole("TEACHER")];

router.delete("/videos/:id", ...teacherOnly, deleteVideo);
router.patch("/videos/:id", ...teacherOnly, updateVideoMetadata);
router.delete("/quizzes/:id", ...teacherOnly, deleteQuiz);
router.delete("/materials/:id", ...teacherOnly, deleteMaterial);
router.get("/videos/:id/activities", ...teacherOnly, listVideoActivities);
router.post("/videos/:id/activities", ...teacherOnly, createVideoActivity);
router.put("/activities/:id", ...teacherOnly, updateVideoActivity);
router.delete("/activities/:id", ...teacherOnly, deleteVideoActivity);

export default router;
