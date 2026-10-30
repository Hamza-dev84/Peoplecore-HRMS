import { Router } from "express";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendAnnouncement,
} from "../controllers/notificationController";
import protect from "../middleware/authMiddleware";
import authorizeRoles from "../middleware/roleMiddleware";

const router = Router();

router.use(protect);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.post("/announcement", authorizeRoles("super_admin", "hr"), sendAnnouncement);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;