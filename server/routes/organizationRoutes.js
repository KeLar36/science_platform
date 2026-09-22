const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");
const { verifyToken, checkRole } = require("../middleware/auth");
const checkOrgAccess = require("../middleware/checkOrgAccess");
const upload = require("../middleware/upload");

router.get("/public/list", organizationController.getPublicList);

router.get(
  "/all",
  verifyToken,
  checkRole(["superadmin"]),
  organizationController.getAll,
);

router.post(
  "/create",
  verifyToken,
  upload.single("logo"),
  organizationController.create,
);

router.post("/join", verifyToken, organizationController.joinRequest);
router.post("/leave", verifyToken, organizationController.leave);

router.post(
  "/requests/accept/:userId",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  organizationController.acceptRequest,
);

router.post(
  "/requests/reject/:userId",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  organizationController.rejectRequest,
);

router.get(
  "/:id/users",
  verifyToken,
  checkOrgAccess,
  organizationController.getOrganizationUsers,
);

router.get(
  "/:id/programs",
  verifyToken,
  checkOrgAccess,
  organizationController.getOrganizationPrograms,
);

router.patch(
  "/:id/verify",
  verifyToken,
  checkRole(["superadmin"]),
  organizationController.toggleVerified,
);

router.patch(
  "/:id/feature",
  verifyToken,
  checkRole(["superadmin"]),
  organizationController.toggleFeatured,
);

router.post(
  "/:id/kick",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  organizationController.kick,
);

router.get(
  "/:id/requests/pending",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  organizationController.getPendingRequests,
);

router.patch(
  "/:id/status",
  verifyToken,
  checkRole(["superadmin"]),
  organizationController.updateStatus,
);

router.get(
  "/:id/reviewers",
  verifyToken,
  checkOrgAccess,
  checkRole(["admin", "superadmin"]),
  organizationController.getOrganizationReviewers,
);

router.patch(
  "/:id/members/:userId/role",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  checkOrgAccess,
  organizationController.updateMemberRole,
);

router.patch(
  "/:id/transfer-ownership",
  verifyToken,
  organizationController.transferOrgOwnership,
);

router.patch(
  "/:id",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  checkOrgAccess,
  upload.single("logo"),
  organizationController.update,
);

router.delete(
  "/:id",
  verifyToken,
  checkRole(["superadmin", "admin"]),
  organizationController.delete,
);

router.get("/:id", verifyToken, organizationController.getById);

module.exports = router;
