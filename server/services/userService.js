const User = require("../models/User");
const Post = require("../models/Post");
const Organization = require("../models/Organization");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const notificationService = require("./notificationService");
const projectService = require("./projectService");

class UserService {
  async #deleteImageFromCloudinary(imageUrl) {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) return;
    try {
      const parts = imageUrl.split("/upload/");
      if (parts.length < 2) return;

      const publicIdWithExtension = parts[1].replace(/^v\d+\//, "");
      const publicId = publicIdWithExtension.substring(
        0,
        publicIdWithExtension.lastIndexOf("."),
      );

      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("Помилка видалення файлу з Cloudinary:", err);
    }
  }

  #buildFilterQuery(filters = {}) {
    const query = {};

    if (filters.role && filters.role !== "Всі") {
      query.role = filters.role;
    }

    if (filters.organizationId) {
      query.organizationId = filters.organizationId;
    }

    if (filters.accountStatus) {
      if (filters.accountStatus === "banned") {
        query.isBanned = true;
        query.isAnonymized = false;
      } else if (filters.accountStatus === "anonymized") {
        query.isAnonymized = true;
      } else if (filters.accountStatus === "active") {
        query.isBanned = false;
        query.isAnonymized = false;
      }
    } else if (filters.isBanned !== undefined) {
      query.isBanned = filters.isBanned === true || filters.isBanned === "true";
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: "i" };
      query.$or = [{ title: searchRegex }, { email: searchRegex }];
    }

    return query;
  }

  async #unassignReviewerProjects(reviewerId) {
    const Project = mongoose.model("Project");
    await Project.updateMany(
      {
        reviewerId: reviewerId,
        status: { $in: ["На розгляді", "На доопрацюванні"] },
      },
      {
        $set: {
          reviewerId: null,
          reviewStatus: "Не призначено",
        },
      },
    );
    console.log(
      `Проєкти рецензента ${reviewerId} успішно скинуто у статус "Не призначено".`,
    );
  }

  async anonymizeUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Користувача не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (user.isAnonymized) {
      const error = new Error("Цей акаунт вже було анонімізовано раніше.");
      error.statusCode = 400;
      throw error;
    }

    const OrganizationModel = mongoose.model("Organization");

    const ownedOrg = await OrganizationModel.findOne({ creatorId: userId });
    if (ownedOrg) {
      const membersCount = await User.countDocuments({
        organizationId: ownedOrg._id,
      });

      if (membersCount <= 1) {
        const error = new Error(
          "Ви є єдиним членом та засновником установи. Будь ласка, видаліть установу перед анонімізацією профілю.",
        );
        error.statusCode = 400;
        throw error;
      }

      const error = new Error(
        "Ви є засновником організації. Передайте права власності іншому учаснику перед анонімізацією.",
      );
      error.statusCode = 400;
      throw error;
    }

    await OrganizationModel.updateMany(
      { "joinRequests.userId": userId },
      { $pull: { joinRequests: { userId: userId } } },
    );

    if (user.image) {
      await this.#deleteImageFromCloudinary(user.image);
    }

    const anonymizedEmail = `deleted_${userId}_${Date.now()}@scienceplatform.com`;

    user.name = "Анонімний дослідник (GDPR)";
    user.email = anonymizedEmail;
    user.password = `anonymized_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    user.image = null;
    user.bio = "Цей акаунт було анонімізовано відповідно до політики GDPR.";
    user.topics = [];
    user.city = "";
    user.socials = { github: "", twitter: "", linkedIn: "" };
    user.bookmarks = [];
    user.organizationId = null;
    user.pendingOrganizationId = undefined;

    user.role = "user";
    user.isBanned = true;
    user.isAnonymized = true;

    if (user.allowedDomains) user.allowedDomains = [];
    if (user.allowedTypes) user.allowedTypes = [];
    if (user.academicDegree) user.academicDegree = "Немає / Дослідник";

    if (user.isReviewerActive !== undefined) {
      user.isReviewerActive = false;
    }

    await user.save();
    console.log(
      `Користувача ${userId} успішно анонімізовано за стандартами GDPR.`,
    );
    return user;
  }
  async getById(userId) {
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      const error = new Error("Користувача не знайдено");
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  async updateProfile(id, profileData) {
    const currentUser = await User.findById(id).select(
      "image organizationId role isReviewerActive",
    );

    if (
      profileData.image &&
      currentUser &&
      currentUser.image &&
      currentUser.image !== profileData.image
    ) {
      await this.#deleteImageFromCloudinary(currentUser.image);
    }

    if (profileData.isReviewerActive === true) {
      if (
        !currentUser ||
        !currentUser.organizationId ||
        currentUser.organizationId.toString() === "null"
      ) {
        const error = new Error(
          "Не можна активувати статус рецензента без прив'язки до установи!",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: profileData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) return null;

    if (
      currentUser &&
      profileData.isReviewerActive !== undefined &&
      profileData.isReviewerActive !== currentUser.isReviewerActive
    ) {
      try {
        const statusMsg = profileData.isReviewerActive
          ? "активовано"
          : "деактивовано";
        await notificationService.createNotification({
          recipientId: id,
          title: "Статус рецензента",
          message: `Ваш статус активності рецензента успішно ${statusMsg}.`,
          type: "SYSTEM_INFO",
          link: "/profile",
          sendEmail: false,
        });
      } catch (err) {
        console.error(
          "Помилка надсилання сповіщення про статус рецензента:",
          err,
        );
      }
    }

    if (
      updatedUser &&
      updatedUser.role === "reviewer" &&
      profileData.isReviewerActive === true &&
      updatedUser.organizationId
    ) {
      projectService
        .reassignUnassignedProjects(updatedUser.organizationId)
        .catch((err) =>
          console.error(
            "Помилка авто-перерозподілу при активації профілю:",
            err,
          ),
        );
    }

    const userObj = updatedUser.toObject
      ? updatedUser.toObject()
      : { ...updatedUser };

    const pendingJoinOrg = await Organization.findOne({
      "joinRequests.userId": id,
    }).select("_id name");

    const pendingCreateOrg = await Organization.findOne({
      creatorId: id,
      status: "pending",
    }).select("_id name");

    return {
      ...userObj,
      pendingOrganizationId: pendingCreateOrg ? pendingCreateOrg._id : null,
      pendingJoinRequestOrgId: pendingJoinOrg ? pendingJoinOrg._id : null,
      hasPendingJoinRequest: Boolean(pendingJoinOrg),
    };
  }

  async getPagedUsers(queryFilters = {}, page = 1, limit = 8) {
    const query = this.#buildFilterQuery(queryFilters);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return { users, totalPages, currentPage: Number(page), totalItems: total };
  }

  async countUsers(queryFilters = {}) {
    const query = this.#buildFilterQuery(queryFilters);
    return await User.countDocuments(query);
  }

  async updateRole(id, role, extraData = {}) {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      const error = new Error("Користувача не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (targetUser.role === "reviewer" && role !== "reviewer") {
      await this.#unassignReviewerProjects(id);
    }

    let updateQuery = {};
    if (role === "reviewer") {
      updateQuery = {
        $set: {
          role: role,
          academicDegree: extraData.academicDegree || "Немає / Дослідник",
          allowedDomains: extraData.allowedDomains || [],
          allowedTypes: extraData.allowedTypes || [],
          isReviewerActive: true,
        },
      };
    } else {
      updateQuery = {
        $set: { role: role },
        $unset: {
          academicDegree: 1,
          allowedDomains: 1,
          allowedTypes: 1,
          isReviewerActive: 1,
        },
      };
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
      overwriteDiscriminatorKey: true,
    });

    try {
      await notificationService.createNotification({
        recipientId: id,
        title: "Зміна ролі акаунта",
        message: `Адміністратор змінив вашу роль у системі на: "${role}".`,
        type: "SYSTEM_INFO",
        link: "/profile",
        sendEmail: true,
      });
    } catch (err) {
      console.error("Помилка надсилання сповіщення про зміну ролі:", err);
    }

    if (role === "reviewer" && updatedUser.organizationId) {
      projectService
        .reassignUnassignedProjects(updatedUser.organizationId)
        .catch((err) =>
          console.error("Помилка авто-перерозподілу при зміні ролі:", err),
        );
    }

    return updatedUser;
  }

  async updateBanStatus(id, isBanned) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error("Користувача не знайдено");
      error.statusCode = 404;
      throw error;
    }
    if (user.isAnonymized) {
      const error = new Error(
        "Неможливо змінити статус бана анонімізованого акаунта.",
      );
      error.statusCode = 400;
      throw error;
    }

    user.isBanned = isBanned;
    await user.save();

    if (isBanned && user.role === "reviewer") {
      const Project = mongoose.model("Project");

      await Project.updateMany(
        {
          reviewerId: id,
          status: { $in: ["На розгляді", "На доопрацюванні"] },
        },
        {
          $set: {
            reviewerId: null,
            reviewStatus: "Не призначено",
          },
        },
      );

      console.log(
        `Авто-очищення: Усі активні роботи забаненого рецензента ${user.name} скинуто в чергу.`,
      );
    }

    try {
      const title = isBanned ? "Акаунт заблоковано" : "Акаунт розблоковано";
      const message = isBanned
        ? "Ваш акаунт було заблоковано адміністратором."
        : "Ваш акаунт розблоковано. Ви знову маєте доступ до всіх функцій платформи.";

      await notificationService.createNotification({
        recipientId: id,
        title,
        message,
        type: "SYSTEM_INFO",
        link: "/profile",
        sendEmail: true,
      });
    } catch (err) {
      console.error("Помилка надсилання сповіщення про бан/розбан:", err);
    }

    const updatedUser = await User.findById(id).select("-password");
    return updatedUser;
  }
}

module.exports = new UserService();
