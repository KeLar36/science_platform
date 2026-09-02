const express = require("express");
const router = express.Router();
const superadminController = require("../controllers/superadminController");
const { verifyToken, checkRole } = require("../middleware/auth");

router.use(verifyToken, checkRole(["superadmin"]));

router.get("/analytics", superadminController.getAnalytics);
router.post("/broadcast", superadminController.sendBroadcast);
router.get("/programs", superadminController.getPrograms);

module.exports = router;
