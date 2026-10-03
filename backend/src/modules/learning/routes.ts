import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  checkQuizAnswer,
  getMyProgress,
  getMyQuizAttempts,
  getInteractiveVideoAnalytics,
  createLessonQuiz,
  createLessonVideo,
  listAvailableQuizzes,
  saveProgress,
  submitQuizAttempt,
  submitInteractiveEventResponse,
  submitVideoActivityAnswer,
} from "./controller.js";

const router = Router();

router.use(requireAuth);
router.post(
  "/lessons/:lessonId/quizzes",
  requireRole("TEACHER", "ADMIN"),
  createLessonQuiz,
);
router.post(
  "/lessons/:lessonId/videos",
  requireRole("TEACHER", "ADMIN"),
  createLessonVideo,
);
router.post(
  "/videos/:videoId/activities/:activityId/answer",
  requireRole("STUDENT"),
  submitVideoActivityAnswer,
);
router.post(
  "/videos/:videoId/activities/:activityId/responses",
  requireRole("STUDENT", "TEACHER", "ADMIN"),
  submitInteractiveEventResponse,
);
router.get(
  "/videos/:videoId/activities/analytics",
  requireRole("TEACHER", "ADMIN"),
  getInteractiveVideoAnalytics,
);
router.get("/quizzes", requireRole("STUDENT"), listAvailableQuizzes);
router.get("/progress", requireRole("STUDENT"), getMyProgress);
router.put("/progress/:lessonId", requireRole("STUDENT"), saveProgress);
router.get("/quizzes/attempts", requireRole("STUDENT"), getMyQuizAttempts);
router.post(
  "/quizzes/:quizId/questions/:questionId/check",
  requireRole("STUDENT"),
  checkQuizAnswer,
);
router.post(
  "/quizzes/:quizId/attempts",
  requireRole("STUDENT"),
  submitQuizAttempt,
);

export default router;
