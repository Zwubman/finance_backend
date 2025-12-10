import Notification from "../Models/notification.js";

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const notifications = await Notification.findAll({
      where: { user_id: userId, is_deleted: false },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;
    const id = parseInt(req.params.id, 10);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!id) return res.status(400).json({ success: false, message: "Invalid notification id" });

    const notif = await Notification.findOne({ where: { notification_id: id, user_id: userId } });
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });

    notif.is_read = true;
    await notif.save();
    return res.json({ success: true, notification: notif });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const count = await Notification.count({ where: { user_id: userId, is_read: false, is_deleted: false } });
    return res.json({ success: true, unread: count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
  getUserNotifications,
  markAsRead,
  getUnreadCount,
};
