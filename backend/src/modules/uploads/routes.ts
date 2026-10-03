import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  courseThumbnailUpload,
  lessonMaterialUpload,
  lessonVideoUpload,
} from "../../utils/course-media.js";
import {
  authorizeLessonVideoUpload,
  createLessonMaterialLink,
  uploadCourseThumbnail,
  uploadLessonMaterial,
  uploadLessonVideo,
} from "./controller.js";

const router = Router();

router.use(requireAuth, requireRole("TEACHER", "ADMIN"));
router.post("/thumbnail", courseThumbnailUpload, uploadCourseThumbnail);
router.post(
  "/lessons/:lessonId/video",
  authorizeLessonVideoUpload,
  lessonVideoUpload,
  uploadLessonVideo,
);
router.post(
  "/lessons/:lessonId/material",
  authorizeLessonVideoUpload,
  lessonMaterialUpload,
  uploadLessonMaterial,
);
router.post(
  "/lessons/:lessonId/material-link",
  authorizeLessonVideoUpload,
  createLessonMaterialLink,
);

export default router;
