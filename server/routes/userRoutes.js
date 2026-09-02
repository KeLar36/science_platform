const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, checkRole, canManageUser } = require("../middleware/auth");
const upload = require("../middleware/upload");
const adminAccess = checkRole(["admin", "superadmin"]);

router.get("/me", verifyToken, userController.getMe);
router.patch(
  "/update-profile",
  verifyToken,
  upload.single("image"),
  userController.updateProfile,
);
router.get("/bookmarks/all", verifyToken, userController.getBookmarks);
router.get("/bookmarks/check/:id", verifyToken, userController.checkBookmark);
router.get("/saved-posts", verifyToken, userController.getSavedPosts);
router.post(
  "/bookmarks/toggle/:id",
  verifyToken,
  userController.toggleBookmark,
);

router.get("/community", userController.getCommunity);\
router.get("/all", verifyToken, adminAccess, userController.getAll);
router.get("/count", verifyToken, adminAccess, userController.getCount);

router.patch(
  "/role/:id",
  verifyToken,
  adminAccess,
  canManageUser,
  userController.updateRole,
);
router.patch(
  "/ban/:id",
  verifyToken,
  adminAccess,
  canManageUser,
  userController.banUser,
);

router.delete("/profile", verifyToken, userController.deleteSelf);

router.delete(
  "/:id",
  verifyToken,
  adminAccess,
  canManageUser,
  userController.deleteUser,
);

module.exports = router;
