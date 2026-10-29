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
  changePassword
} from "../controllers/authController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/change-password", protect, changePassword);

export default router;