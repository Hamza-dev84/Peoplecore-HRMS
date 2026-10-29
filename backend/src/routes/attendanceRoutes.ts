import { Router } from "express";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  listAttendance,
  monthlyReport,
} from "../controllers/attendanceController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/today", getTodayAttendance);
router.get("/report", monthlyReport);
router.get("/", listAttendance);

export default router;