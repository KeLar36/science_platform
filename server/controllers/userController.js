const userService = require("../services/userService");
const User = require("../models/User");
const Post = require("../models/Post");
const Organization = require("../models/Organization");

class UserController {
  async getMe(req, res, next) {
    try {
      let rawUser = await userService.getById(req.user.id);

      const userObj = rawUser.toObject ? rawUser.toObject() : { ...rawUser };
      const userId = req.user.id;

      const pendingJoinOrg = await Organization.findOne({
        "joinRequests.userId": userId,
      }).select("_id name");

      const pendingCreateOrg = await Organization.findOne({
        creatorId: userId,
        status: "pending",
      }).select("_id name");

      const fullUserData = {
        ...userObj,
        pendingOrganizationId: pendingCreateOrg ? pendingCreateOrg._id : null,
        pendingJoinRequestOrgId: pendingJoinOrg ? pendingJoinOrg._id : null,
        hasPendingJoinRequest: Boolean(pendingJoinOrg),
      };

      res.json({ user: fullUserData });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const body = req.body || {};

      let socials = {};
      if (body.socials) {
        try {
          socials =
            typeof body.socials === "string"
              ? JSON.parse(body.socials)
              : body.socials;
        } catch (e) {
          console.error("Помилка парсингу socials у контролері:", e);
        }
      }

      let topics = [];
      if (body.topics) {
        try {
          topics =
            typeof body.topics === "string"
              ? JSON.parse(body.topics)
              : body.topics;
        } catch (e) {
          topics = body.topics;
        }
      }

      let isReviewerActive = undefined;
      if (body.isReviewerActive !== undefined) {
        isReviewerActive = body.isReviewerActive === "true";
      }

      const profileData = {
        name: body.name,
        bio: body.bio,
        city: body.city,
        topics: topics,
        socials: socials,
      };

      if (isReviewerActive !== undefined) {
        profileData.isReviewerActive = isReviewerActive;
      }

      if (body.academicDegree !== undefined) {
        profileData.academicDegree = body.academicDegree;
      }

      if (req.file) {
        profileData.image = req.file.path;
      }

      const updatedUser = await userService.updateProfile(
        req.user.id,
        profileData,
      );

      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const queryFilters = {};

      if (req.query.search) {
        queryFilters.search = req.query.search;
      }
      if (req.query.role && req.query.role !== "Всі ролі") {
        queryFilters.role = req.query.role;
      }
      if (req.query.accountStatus) {
        queryFilters.accountStatus = req.query.accountStatus;
      }

      const result = await userService.getPagedUsers(queryFilters, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req, res, next) {
    try {
      const { role, allowedDomains, allowedTypes, academicDegree } = req.body;

      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: "Не можна змінити власну роль" });
      }

      if (role === "superadmin" && req.user.role !== "superadmin") {
        return res
          .status(403)
          .json({ error: "Тільки суперадмін може призначати роль superadmin" });
      }

      const updatedUser = await userService.updateRole(req.params.id, role, {
        allowedDomains,
        allowedTypes,
        academicDegree,
      });

      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

  async banUser(req, res, next) {
    try {
      const { isBanned } = req.body;

      if (req.params.id === req.user.id) {
        return res
          .status(400)
          .json({ error: "Не можна заблокувати самого себе" });
      }

      const updatedUser = await userService.updateBanStatus(
        req.params.id,
        isBanned,
      );
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

  async getBookmarks(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select("bookmarks");
      if (!user) {
        return res.status(404).json({ error: "Користувача не знайдено" });
      }
      res.json({ bookmarks: user.bookmarks || [] });
    } catch (err) {
      next(err);
    }
  }

  async checkBookmark(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select("bookmarks");
      if (!user) {
        return res.status(404).json({ error: "Користувача не знайдено" });
      }
      const isBookmarked = user.bookmarks.includes(req.params.id);
      res.json({ isBookmarked });
    } catch (err) {
      next(err);
    }
  }

  async getSavedPosts(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select("bookmarks");
      if (!user) {
        return res.status(404).json({ error: "Користувача не знайдено" });
      }

      const posts = await Post.find({ _id: { $in: user.bookmarks } })
        .populate("authorId", "name image")
        .populate("organizationId", "name logo")
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  async toggleBookmark(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Користувача не знайдено" });
      }

      const postId = req.params.id;
      const index = user.bookmarks.indexOf(postId);

      if (index === -1) {
        user.bookmarks.push(postId);
      } else {
        user.bookmarks.splice(index, 1);
      }

      await user.save();
      res.json({
        bookmarks: user.bookmarks,
        message: "Закладки успішно оновлено",
      });
    } catch (err) {
      next(err);
    }
  }

  async getCommunity(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;

      const queryFilters = { isBanned: false };

      if (req.query.search) {
        queryFilters.name = { $regex: req.query.search.trim(), $options: "i" };
      }

      const users = await User.find(queryFilters)
        .select("name email image role city topics bio")
        .populate("organizationId", "name logo")
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(queryFilters);
      const totalPages = Math.ceil(total / limit);

      res.json({ users, totalPages, currentPage: page });
    } catch (err) {
      next(err);
    }
  }

  async getCount(req, res, next) {
    try {
      const count = await userService.countUsers({});
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }

  async deleteSelf(req, res, next) {
    try {
      const userId = req.user.id;
      await userService.anonymizeUser(userId);

      res.json({
        message:
          "Ваш профіль та персональні дані успішно анонімізовано та видалено з системи згідно з GDPR",
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const targetUserId = req.params.id;

      const targetUser = await userService.getById(targetUserId);
      if (!targetUser) {
        const error = new Error("Користувача не знайдено");
        error.statusCode = 404;
        throw error;
      }

      if (targetUser.role === "superadmin") {
        const error = new Error(
          "Не можна видалити суперадміністратора системи",
        );
        error.statusCode = 403;
        throw error;
      }

      await userService.anonymizeUser(targetUserId);

      res.json({
        message:
          "Профіль користувача успішно анонімізовано та очищено згідно з GDPR",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
