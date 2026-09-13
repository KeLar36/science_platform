const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { verifyToken, checkRole, optionalToken } = require("../middleware/auth");
const checkProjectAdminAccess = require("../middleware/checkProjectAdminAccess");
const checkProjectOwner = require("../middleware/checkProjectOwner");
const upload = require("../middleware/upload");

router.get("/archive", optionalToken, projectController.getArchive);
router.get("/", verifyToken, projectController.getAll);
router.get("/my", verifyToken, projectController.getMyProjects);
router.post("/", verifyToken, upload.single("file"), projectController.create);
router.get(
  "/reviewer/queue",
  verifyToken,
  checkRole(["reviewer", "admin", "superadmin"]),
  projectController.getReviewerQueue,
);
router.get("/:id", verifyToken, projectController.getById);
router.get("/:id/review", verifyToken, projectController.getReview);

router.post(
  "/:id/version",
  verifyToken,
  checkProjectOwner,
  upload.single("file"),
  projectController.uploadNewVersion,
);
router.patch(
  "/:id/assign",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  checkProjectAdminAccess,
  projectController.assignReviewer,
);
router.post(
  "/:id/review",
  verifyToken,
  checkRole(["reviewer", "admin", "superadmin"]),
  projectController.submitReview,
);

router.patch(
  "/:id/status",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  checkProjectAdminAccess,
  projectController.updateStatus,
);

router.delete("/:id", verifyToken, projectController.delete);

module.exports = router;
