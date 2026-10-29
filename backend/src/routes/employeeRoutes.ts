import { Router } from "express";
import {
  listEmployees,
  listDepartments,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getProfile,
  updateProfile,
  updateProfileImage
} from "../controllers/employeeController";
import protect from "../middleware/authMiddleware";
import authorizeRoles from "../middleware/roleMiddleware";
import uploadProfileImage from "../middleware/uploadMiddleware";

const router = Router();

router.use(protect);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/profile/image", uploadProfileImage, updateProfileImage);
router.get("/", authorizeRoles("super_admin", "hr"), listEmployees);
router.post("/", authorizeRoles("super_admin", "hr"), createEmployee);
router.get("/departments", authorizeRoles("super_admin", "hr"), listDepartments);
router.get("/:id", authorizeRoles("super_admin", "hr"), getEmployee);
router.patch("/:id", authorizeRoles("super_admin", "hr"), updateEmployee);
router.delete("/:id", authorizeRoles("super_admin"), deleteEmployee);

export default router;