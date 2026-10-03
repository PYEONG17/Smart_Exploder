import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  answerLessonQuestion,
  askLessonQuestion,
  listLessonQuestions,
} from "./controller.js";

const router = Router();

router.use(requireAuth);
router.get("/lessons/:lessonId/questions", listLessonQuestions);
router.post(
  "/lessons/:lessonId/questions",
  requireRole("STUDENT"),
  askLessonQuestion,
);
router.patch(
  "/questions/:questionId/answer",
  requireRole("TEACHER", "ADMIN"),
  answerLessonQuestion,
);

export default router;
