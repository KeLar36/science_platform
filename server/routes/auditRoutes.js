const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { verifyToken, checkRole } = require("../middleware/auth");

router.get(
  "/",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  auditController.getLogs,
);

module.exports = router;
