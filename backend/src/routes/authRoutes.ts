import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController";
import protect from "../middleware/authMiddleware";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.patch("/change-password", protect, changePassword);

export default router;