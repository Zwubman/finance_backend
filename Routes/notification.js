import express from "express";
import { authenticate } from "../Middlewares/auth.js";
import notificationController from "../Controllers/notification.js";

const router = express.Router();

router.get("/", authenticate, notificationController.getUserNotifications);
router.get("/unread-count", authenticate, notificationController.getUnreadCount);
router.patch("/:id/read", authenticate, notificationController.markAsRead);

export default router;
