import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getMyCourses,
  reorderCourseLessons,
  updateCourse,
} from "./course.controller.js";

const router = Router();

router.get("/mine", requireAuth, requireRole("TEACHER", "ADMIN"), getMyCourses);
router.post("/", requireAuth, requireRole("TEACHER", "ADMIN"), createCourse);
router.get("/", getAllCourses);
router.get("/:id", optionalAuth, getCourseById);
router.put("/:id/lessons/order", requireAuth, requireRole("TEACHER", "ADMIN"), reorderCourseLessons);
router.patch("/:id", requireAuth, requireRole("TEACHER", "ADMIN"), updateCourse);
router.delete("/:id", requireAuth, requireRole("TEACHER", "ADMIN"), deleteCourse);

export default router;
