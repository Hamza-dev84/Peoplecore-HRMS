import { Router } from "express";
import { updateUserRole } from "../controllers/userController";
import protect from "../middleware/authMiddleware";
import authorizeRoles from "../middleware/roleMiddleware";

const router = Router();

router.patch("/:id/role", protect, authorizeRoles("super_admin"), updateUserRole);

export default router;