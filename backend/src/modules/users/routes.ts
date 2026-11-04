import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { avatarUpload } from "../../utils/multer.js";
import {
  getMe,
  updateProfile,
  uploadAvatar,
  randomAvatar,
} from "./controller.js";

const router = Router();

// Tất cả các tuyến đều yêu cầu xác thực
router.use(requireAuth);

// GET  /api/users/me              – Lấy thông tin người dùng hiện tại
router.get("/me", getMe);

// PATCH /api/users/me/profile     – Cập nhật thông tin cá nhân (name, bio)
router.patch("/me/profile", updateProfile);

// POST /api/users/:id/avatar      – Tải lên ảnh đại diện
router.post("/:id/avatar", avatarUpload.single("avatar"), uploadAvatar);

// GET  /api/users/:id/avatar/random – Lấy ảnh đại diện ngẫu nhiên
router.get("/:id/avatar/random", randomAvatar);

export default router;
