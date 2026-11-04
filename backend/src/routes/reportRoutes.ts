import { Router } from "express";
import {
  employeesReport,
  attendanceReport,
  leavesReport,
} from "../controllers/reportController";
import protect from "../middleware/authMiddleware";
import authorizeRoles from "../middleware/roleMiddleware";

const router = Router();

router.use(protect);

router.get("/employees", authorizeRoles("super_admin", "hr"), employeesReport);
router.get("/attendance", attendanceReport);
router.get("/leaves", leavesReport);

export default router;