import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  createFlashcard,
  createPracticeQuestion,
  deleteFlashcard,
  listFlashcards,
  listPracticeQuestions,
  submitPracticeAnswer,
  updateFlashcardMastered,
} from "./controller.js";

const router = Router();

router.use(requireAuth);
router.get("/flashcards", listFlashcards);
router.post("/flashcards", createFlashcard);
router.patch("/flashcards/:flashcardId/mastered", updateFlashcardMastered);
router.delete("/flashcards/:flashcardId", deleteFlashcard);
router.get("/practice-questions", listPracticeQuestions);
router.post("/practice-questions", createPracticeQuestion);
router.post("/practice-questions/:questionId/answer", submitPracticeAnswer);

export default router;
