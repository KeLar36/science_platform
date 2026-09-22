const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken, checkRole } = require("../middleware/auth");

router.use(verifyToken);

router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.delete("/clear-all", notificationController.clearAllNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
