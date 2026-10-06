import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  chatWithGemini,
  generateAssessmentWithGemini,
} from "./controller.js";
import {
  findLessonResources,
  generateCourseOutline,
  generateLessonDraft,
} from "./studio.controller.js";
import { lessonTutorChat } from "./lesson-tutor.controller.js";

const router = Router();
const windowMs = 60_000;

function createUserRateLimiter(requestLimit: number, message: string) {
  const userRequests = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next();

    const now = Date.now();
    const current = userRequests.get(userId);
    if (!current || now >= current.resetAt) {
      userRequests.set(userId, { count: 1, resetAt: now + windowMs });
      if (userRequests.size > 1000) {
        for (const [id, entry] of userRequests) {
          if (now >= entry.resetAt) userRequests.delete(id);
        }
      }
      return next();
    }

    if (current.count >= requestLimit) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((current.resetAt - now) / 1000)),
      );
      res.status(429).json({
        success: false,
        message,
      });
      return;
    }

    current.count += 1;
    return next();
  };
}

const limitChatRequests = createUserRateLimiter(
  10,
  "Bạn đã gửi nhiều câu hỏi liên tiếp. Vui lòng thử lại sau một phút.",
);
const limitLessonTutorRequests = createUserRateLimiter(
  15,
  "Bạn đã hỏi quá nhiều câu liên tiếp. Vui lòng thử lại sau một phút.",
);
const limitAssessmentRequests = createUserRateLimiter(
  3,
  "Bạn đã tạo nhiều đề liên tiếp. Vui lòng thử lại sau một phút.",
);

const limitStudioRequests = createUserRateLimiter(
  6,
  "Bạn đã dùng AI quá nhiều lần liên tiếp. Vui lòng thử lại sau một phút.",
);
const teacherAi = [requireAuth, requireRole("TEACHER", "ADMIN"), limitStudioRequests];

router.post("/chat", requireAuth, limitChatRequests, chatWithGemini);
router.post("/lesson-tutor", requireAuth, limitLessonTutorRequests, lessonTutorChat);
router.post("/studio/outline", ...teacherAi, generateCourseOutline);
router.post("/studio/lessons/:lessonId/draft", ...teacherAi, generateLessonDraft);
router.post("/studio/lessons/:lessonId/resources", ...teacherAi, findLessonResources);
router.post(
  "/assessments/generate",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  limitAssessmentRequests,
  generateAssessmentWithGemini,
);

export default router;
