import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  googleLogin,
  login,
  logout,
  me,
  register,
  updateProfile,
} from "./controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", requireAuth, me);
router.post("/logout", logout);
router.patch("/profile", requireAuth, updateProfile);

export default router;
