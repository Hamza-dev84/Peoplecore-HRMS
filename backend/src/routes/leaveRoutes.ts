import { Router } from "express";
import {
  applyLeave,
  listLeaves,
  myLeaves,
  getLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from "../controllers/leaveController";
import protect from "../middleware/authMiddleware";
import authorizeRoles from "../middleware/roleMiddleware";

const router = Router();

router.use(protect);

router.post("/", applyLeave);
router.get("/", listLeaves);
router.get("/my", myLeaves);
router.get("/:id", getLeave);
router.patch("/:id/approve", authorizeRoles("super_admin", "hr"), approveLeave);
router.patch("/:id/reject", authorizeRoles("super_admin", "hr"), rejectLeave);
router.patch("/:id/cancel", cancelLeave);

export default router;