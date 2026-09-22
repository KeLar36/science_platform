const Organization = require("../models/Organization");
const { containsBadWords } = require("../shared/profanityFilter");
const User = require("../models/User");
const Program = require("../models/Program");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const projectService = require("./projectService");
const notificationService = require("./notificationService");
const auditService = require("./auditService");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

class OrganizationService {
  constructor() {
    this.publicListCache = null;
    this.cacheTimestamp = null;
    this.CACHE_TTL = 10 * 60 * 1000;
  }

  clearCache() {
    this.publicListCache = null;
    this.cacheTimestamp = null;
  }

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
      console.error("Помилка видалення логотипу установи з Cloudinary:", err);
    }
  }

  #buildFilterQuery(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type && filters.type !== "Всі") {
      query.type = filters.type;
    }

    if (filters.city && filters.city !== "Всі") {
      query.city = { $regex: filters.city.trim(), $options: "i" };
    }

    if (filters.scientificDomains && filters.scientificDomains !== "Всі") {
      query.scientificDomains = filters.scientificDomains;
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: "i" };
      query.$or = [
        { name: searchRegex },
        { edrpou: searchRegex },
        { description: searchRegex },
      ];
    }

    return query;
  }

  async getById(id) {
    const organization = await Organization.findById(id).populate(
      "creatorId",
      "name email",
    );

    if (!organization) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }
    return organization;
  }

  async getPublicList(filters = {}) {
    const now = Date.now();

    const isDefaultFilter =
      Object.keys(filters).length === 0 ||
      (filters.status === "approved" && filters.allowPublicJoin === true);

    if (
      isDefaultFilter &&
      this.publicListCache &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.publicListCache;
    }

    const query = this.#buildFilterQuery({
      status: "approved",
      allowPublicJoin: true,
      ...filters,
    });

    const list = await Organization.find(query)
      .select(
        "name logo website description edrpou type city scientificDomains isVerified email allowPublicJoin",
      )
      .lean();

    if (isDefaultFilter) {
      this.publicListCache = list;
      this.cacheTimestamp = now;
    }

    return list;
  }

  async create(userId, data, req = null) {
    const cleanEdrpou = data.edrpou ? data.edrpou.trim() : "";

    const activeOrg = await Organization.findOne({
      edrpou: cleanEdrpou,
      status: { $in: ["pending", "approved"] },
    });

    if (activeOrg) {
      const error = new Error(
        "Організація з таким кодом ЄДРПОУ вже зареєстрована або очікує на модерацію",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      containsBadWords(data.name) ||
      containsBadWords(data.description) ||
      containsBadWords(data.email) ||
      containsBadWords(data.city)
    ) {
      const error = new Error(
        "Назва, опис, email або місто містять недопустимі або образливі слова!",
      );
      error.statusCode = 400;
      throw error;
    }

    let domains = data.scientificDomains || [];
    if (typeof domains === "string") {
      try {
        domains = JSON.parse(domains);
      } catch (e) {
        domains = domains.split(",").map((d) => d.trim());
      }
    }

    const newOrg = new Organization({
      name: data.name ? data.name.trim() : "",
      edrpou: cleanEdrpou,
      description: data.description || "",
      website: data.website || "",
      logo: data.logo || null,
      email: data.email ? data.email.trim().toLowerCase() : "",
      type: data.type || "Університет",
      legalForm: data.legalForm || "ДУ/КЗ",
      city: data.city ? data.city.trim() : "Київ",
      scientificDomains: Array.isArray(domains) ? domains : [],
      creatorId: userId,
      status: "pending",
      isVerified: false,
      allowPublicJoin: true,
    });

    await newOrg.save();

    await User.findByIdAndUpdate(userId, {
      pendingOrganizationId: newOrg._id,
    });

    this.clearCache();

    await auditService.log({
      req,
      action: "ORG_CREATE_REQUESTED",
      category: "ORGANIZATION",
      severity: "info",
      targetEntity: {
        entityType: "Organization",
        entityId: newOrg._id,
        entityName: newOrg.name,
      },
      payload: {
        newState: {
          edrpou: newOrg.edrpou,
          type: newOrg.type,
          email: newOrg.email,
        },
      },
      organizationId: newOrg._id,
    });

    return newOrg;
  }

  async requestToJoin(orgId, userId, req = null) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (organization.status !== "approved") {
      const error = new Error("Не можна вступити до непідтвердженої установи");
      error.statusCode = 400;
      throw error;
    }

    if (organization.allowPublicJoin === false) {
      const error = new Error(
        "Ця організація закрила можливість надсилання публічних заявок на вступ",
      );
      error.statusCode = 403;
      throw error;
    }

    const alreadyRequested = organization.joinRequests.some(
      (r) => r.userId.toString() === userId.toString(),
    );
    if (alreadyRequested) {
      const error = new Error(
        "Ви вже надіслали запит на вступ до цієї установи",
      );
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (user.organizationId) {
      const error = new Error("Ви вже є членом іншої організації");
      error.statusCode = 400;
      throw error;
    }

    organization.joinRequests.push({ userId });
    await organization.save();

    await auditService.log({
      req,
      action: "ORG_JOIN_REQUESTED",
      category: "ORGANIZATION",
      severity: "info",
      targetEntity: {
        entityType: "Organization",
        entityId: organization._id,
        entityName: organization.name,
      },
      organizationId: organization._id,
    });

    try {
      const applicant = await User.findById(userId).select("name");
      await notificationService.createNotification({
        recipientId: organization.creatorId,
        title: "Нова заявка на вступ",
        message: `Користувач ${applicant?.name || "Хтось"} надіслав запит на приєднання до вашої установи "${organization.name}".`,
        type: "SYSTEM_INFO",
        link: "/organization/dashboard",
        sendEmail: false,
      });
    } catch (notifErr) {
      console.error("Помилка створення сповіщення requestToJoin:", notifErr);
    }
  }

  async leaveOrganization(userId, req = null) {
    const user = await User.findById(userId);
    if (!user || !user.organizationId) {
      const error = new Error("Ви не перебуваєте в жодній установі");
      error.statusCode = 400;
      throw error;
    }

    const org = await Organization.findById(user.organizationId);
    if (org && org.creatorId.toString() === userId.toString()) {
      const error = new Error(
        "Творець організації не може вийти з неї. Тільки видалити або передати права.",
      );
      error.statusCode = 400;
      throw error;
    }

    const previousOrgId = user.organizationId;
    const originalRole = user.role;
    user.organizationId = null;
    user.role = "user";

    if (originalRole === "reviewer") {
      user.isReviewerActive = false;
      user.allowedDomains = [];
      user.allowedTypes = [];
      user.academicDegree = "Немає / Дослідник";
    }

    await user.save();

    await auditService.log({
      req,
      action: "ORG_MEMBER_LEFT",
      category: "ORGANIZATION",
      severity: "warning",
      targetEntity: {
        entityType: "Organization",
        entityId: previousOrgId,
        entityName: org?.name || "Установа",
      },
      payload: {
        previousState: { role: originalRole, organizationId: previousOrgId },
      },
      organizationId: previousOrgId,
    });
  }

  async getOrganizationUsers(orgId, page = 1, limit = 8) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const skip = (pageNum - 1) * limitNum;

    const objectOrgId = mongoose.Types.ObjectId.isValid(orgId)
      ? new mongoose.Types.ObjectId(orgId)
      : orgId;

    const filter = {
      $or: [{ organizationId: objectOrgId }, { organizationId: String(orgId) }],
    };

    const totalItems = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const items = await User.find(filter)
      .select("name email role city socials isBanned image")
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      items,
      currentPage: pageNum,
      totalPages,
      totalItems,
    };
  }

  async getOrganizationPrograms(orgId, page = 1, limit = 8) {
    const skip = (page - 1) * limit;

    const totalItems = await Program.countDocuments({ organizationId: orgId });
    const totalPages = Math.ceil(totalItems / limit);

    const programs = await Program.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      items: programs,
      currentPage: Number(page),
      totalPages: totalPages || 1,
      totalItems,
    };
  }

  async update(orgId, updateData, file, req = null) {
    const cleanOrgId = orgId?._id ? orgId._id.toString() : orgId?.toString();

    const org = await Organization.findById(cleanOrgId);
    if (!org) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (
      (updateData.name && containsBadWords(updateData.name)) ||
      (updateData.description && containsBadWords(updateData.description)) ||
      (updateData.email && containsBadWords(updateData.email)) ||
      (updateData.city && containsBadWords(updateData.city))
    ) {
      const error = new Error(
        "Текст містить недопустимий або образливий контент!",
      );
      error.statusCode = 400;
      throw error;
    }

    const allowedFields = [
      "name",
      "city",
      "email",
      "website",
      "description",
      "type",
      "legalForm",
      "scientificDomains",
      "allowPublicJoin",
    ];

    const fieldsToUpdate = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "allowPublicJoin") {
          fieldsToUpdate[field] =
            updateData[field] === true || updateData[field] === "true";
        } else if (field === "scientificDomains") {
          let domains = updateData[field];

          if (typeof domains === "string") {
            try {
              domains = JSON.parse(domains);
            } catch (e) {
              domains = domains.split(",").map((d) => d.trim());
            }
          }

          if (Array.isArray(domains)) {
            const cleaned = domains
              .map((d) => {
                if (typeof d !== "string") return d;
                return d.replace(/^[\["'\s]+\vert{}[\]"'\s]+$/g, "").trim();
              })
              .filter((d) => d && d !== "[]");

            fieldsToUpdate[field] = Array.from(new Set(cleaned));
          } else {
            fieldsToUpdate[field] = [];
          }
        } else {
          fieldsToUpdate[field] = updateData[field];
        }
      }
    });

    if (file?.path) {
      fieldsToUpdate.logo = file.path;
    }

    const isLogoChanged = file?.path && file.path !== org.logo;
    const isNameChanged =
      updateData.name && updateData.name.trim() !== org.name;

    if (!org.isSystem && org.isVerified && (isLogoChanged || isNameChanged)) {
      fieldsToUpdate.isVerified = false;
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      cleanOrgId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true },
    );

    this.clearCache();

    await auditService.log({
      req,
      action: "ORG_PROFILE_UPDATED",
      category: "ORGANIZATION",
      severity: "info",
      targetEntity: {
        entityType: "Organization",
        entityId: updatedOrg._id,
        entityName: updatedOrg.name,
      },
      payload: {
        previousState: { name: org.name, isVerified: org.isVerified },
        newState: {
          name: updatedOrg.name,
          isVerified: updatedOrg.isVerified,
          updatedFields: Object.keys(fieldsToUpdate),
        },
      },
      organizationId: updatedOrg._id,
    });

    return updatedOrg;
  }

  async getPagedPendingRequests(orgId, { page = 1, limit = 8, search = "" }) {
    if (!orgId) {
      return {
        items: [],
        currentPage: Number(page),
        totalPages: 1,
        totalItems: 0,
      };
    }

    const cleanOrgId = orgId._id ? orgId._id.toString() : orgId.toString();
    const skip = (page - 1) * limit;

    const basePipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(cleanOrgId) } },
      { $unwind: { path: "$joinRequests", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "users",
          localField: "joinRequests.userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: "$userData" },
    ];

    if (search.trim()) {
      basePipeline.push({
        $match: {
          $or: [
            { "userData.name": { $regex: search.trim(), $options: "i" } },
            { "userData.email": { $regex: search.trim(), $options: "i" } },
          ],
        },
      });
    }

    const countPipeline = [...basePipeline, { $count: "total" }];
    const countResult = await Organization.aggregate(countPipeline);
    const totalItems = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const itemsPipeline = [
      ...basePipeline,
      { $sort: { "joinRequests.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: "$joinRequests._id",
          createdAt: "$joinRequests.createdAt",
          user: {
            _id: "$userData._id",
            name: "$userData.name",
            email: "$userData.email",
            image: "$userData.image",
          },
        },
      },
    ];

    const items = await Organization.aggregate(itemsPipeline);

    return {
      items,
      currentPage: Number(page),
      totalPages,
      totalItems,
    };
  }

  async acceptJoinRequest(orgId, userId, req = null) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      const error = new Error("Організацію не знайдено чи доступ обмежено");
      error.statusCode = 404;
      throw error;
    }

    organization.joinRequests = organization.joinRequests.filter(
      (r) => r.userId.toString() !== userId.toString(),
    );

    await organization.save();

    const user = await User.findById(userId);
    if (user) {
      user.organizationId = orgId;
      if (user.role === "reviewer") {
        user.isReviewerActive = true;
      }
      await user.save();
    }

    await auditService.log({
      req,
      action: "ORG_JOIN_APPROVED",
      category: "ORGANIZATION",
      severity: "info",
      targetEntity: {
        entityType: "User",
        entityId: userId,
        entityName: user?.name || "Користувач",
      },
      organizationId: orgId,
    });

    try {
      await notificationService.createNotification({
        recipientId: userId,
        title: "Запит на вступ схвалено!",
        message: `Ваш запит на приєднання до установи "${organization.name}" успішно підтверджено. Ласкаво просимо!`,
        type: "ORG_JOIN_APPROVED",
        link: "/organization/dashboard",
      });
    } catch (notifErr) {
      console.error(
        "Помилка створення сповіщення acceptJoinRequest:",
        notifErr,
      );
    }

    if (user && user.role === "reviewer") {
      projectService
        .reassignUnassignedProjects(orgId)
        .catch((err) =>
          console.error(
            "Помилка авто-перерозподілу при прийнятті в установу:",
            err,
          ),
        );
    }
  }

  async rejectJoinRequest(orgId, userId, req = null) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    organization.joinRequests = organization.joinRequests.filter(
      (r) => r.userId.toString() !== userId.toString(),
    );
    await organization.save();

    const user = await User.findById(userId);
    if (user) {
      if (user.organizationId?.toString() === orgId.toString()) {
        user.organizationId = null;
      }
      if (user.pendingJoinRequestOrgId?.toString() === orgId.toString()) {
        user.pendingJoinRequestOrgId = null;
      }
      await user.save();
    }

    await auditService.log({
      req,
      action: "ORG_JOIN_REJECTED",
      category: "ORGANIZATION",
      severity: "info",
      targetEntity: {
        entityType: "User",
        entityId: userId,
        entityName: user?.name || "Користувач",
      },
      organizationId: orgId,
    });

    try {
      await notificationService.createNotification({
        recipientId: userId,
        title: "Запит на вступ відхилено",
        message: `На жаль, ваш запит на приєднання до установи "${organization.name}" було відхилено адміністратором.`,
        type: "ORG_JOIN_REJECTED",
      });
    } catch (notifErr) {
      console.error(
        "Помилка створення сповіщення rejectJoinRequest:",
        notifErr,
      );
    }
  }

  async kickMember(orgId, adminUser, targetUserId, req = null) {
    if (!targetUserId) {
      const error = new Error("ID учасника не вказано");
      error.statusCode = 400;
      throw error;
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      const error = new Error("Установу не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const isSuperAdmin = adminUser.role === "superadmin";
    const creatorIdStr = org.creatorId ? org.creatorId.toString() : null;
    const adminIdStr = String(adminUser._id || adminUser.id || "");
    const targetUserIdStr = targetUserId.toString();

    const isCreator = creatorIdStr && creatorIdStr === adminIdStr;
    if (!isCreator && !isSuperAdmin) {
      const error = new Error(
        "Тільки засновник або суперадмін може виключати учасників",
      );
      error.statusCode = 403;
      throw error;
    }

    if (creatorIdStr && targetUserIdStr === creatorIdStr) {
      const error = new Error("Не можна виключити засновника організації");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(targetUserId);
    if (user) {
      user.organizationId = null;
      user.pendingJoinRequestOrgId = null;

      if (user.role !== "superadmin") {
        if (user.role === "reviewer") {
          user.isReviewerActive = false;
          user.allowedDomains = [];
          user.allowedTypes = [];
          user.academicDegree = "Немає / Дослідник";
        }
        user.role = "user";
      }

      await user.save();
    }

    await auditService.log({
      req,
      action: "ORG_MEMBER_KICKED",
      category: "ORGANIZATION",
      severity: "warning",
      targetEntity: {
        entityType: "User",
        entityId: targetUserId,
        entityName: user?.name || "Учасник",
      },
      organizationId: orgId,
    });

    try {
      await notificationService.createNotification({
        recipientId: targetUserId,
        title: "Зміна статусу в установі",
        message: `Вас було виключено зі складу учасників установи "${org.name}".`,
        type: "SYSTEM_INFO",
        link: "/profile",
      });
    } catch (notifErr) {
      console.error("Помилка створення сповіщення kickMember:", notifErr);
    }
  }

  async updateMemberRole(
    orgId,
    adminUserId,
    targetUserId,
    newRole,
    extraData = {},
    req = null,
  ) {
    const cleanOrgId = orgId?._id ? orgId._id.toString() : orgId?.toString();

    const org = await Organization.findById(cleanOrgId);
    if (!org) {
      const error = new Error("Установу не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (org.creatorId.toString() !== String(adminUserId)) {
      const error = new Error(
        "Тільки засновник організації може змінювати ролі учасників",
      );
      error.statusCode = 403;
      throw error;
    }

    if (targetUserId.toString() === org.creatorId.toString()) {
      const error = new Error("Не можна змінити роль засновника організації");
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser || targetUser.organizationId?.toString() !== cleanOrgId) {
      const error = new Error("Користувач не є членом цієї організації");
      error.statusCode = 404;
      throw error;
    }

    const previousRole = targetUser.role;

    if (
      targetUser &&
      targetUser.role === "reviewer" &&
      newRole !== "reviewer"
    ) {
      const Project = mongoose.model("Project");
      await Project.updateMany(
        {
          reviewerId: targetUserId,
          status: { $in: ["На розгляді", "На доопрацюванні"] },
        },
        {
          $set: {
            reviewerId: null,
            reviewStatus: "Не призначено",
          },
        },
      );
    }

    if (newRole === "reviewer") {
      await User.findByIdAndUpdate(
        targetUserId,
        {
          $set: {
            role: newRole,
            isReviewerActive: true,
            academicDegree: extraData.academicDegree || "Немає / Дослідник",
            allowedDomains: Array.isArray(extraData.allowedDomains)
              ? extraData.allowedDomains
              : [],
            allowedTypes: Array.isArray(extraData.allowedTypes)
              ? extraData.allowedTypes
              : [],
          },
        },
        { overwriteDiscriminatorKey: true },
      );
    } else {
      await User.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(targetUserId) },
        {
          $set: { role: newRole },
          $unset: {
            academicDegree: "",
            allowedDomains: "",
            allowedTypes: "",
            isReviewerActive: "",
          },
        },
      );
    }

    const updatedUser = await User.findById(targetUserId)
      .select("-password")
      .lean();

    if (newRole !== "reviewer" && updatedUser) {
      delete updatedUser.academicDegree;
      delete updatedUser.allowedDomains;
      delete updatedUser.allowedTypes;
      delete updatedUser.isReviewerActive;
    }

    await auditService.log({
      req,
      action: "USER_ROLE_UPDATED",
      category: "USER_MGMT",
      severity: "warning",
      targetEntity: {
        entityType: "User",
        entityId: targetUserId,
        entityName: targetUser.name,
      },
      payload: {
        previousState: { role: previousRole },
        newState: {
          role: newRole,
          allowedDomains: extraData.allowedDomains || [],
          allowedTypes: extraData.allowedTypes || [],
        },
      },
      organizationId: cleanOrgId,
    });

    try {
      await notificationService.createNotification({
        recipientId: targetUserId,
        title: "Вам надано нову роль!",
        message: `Вашу роль в установі "${org.name}" оновлено на: "${newRole}".`,
        type: "SYSTEM_INFO",
        link: "/profile",
        sendEmail: true,
      });
    } catch (notifErr) {
      console.error("Помилка створення сповіщення updateMemberRole:", notifErr);
    }

    return updatedUser;
  }

  async transferOwnership(orgId, currentOwnerId, newOwnerId, req = null) {
    const org = await Organization.findById(orgId);
    if (!org) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (org.creatorId.toString() !== String(currentOwnerId)) {
      const error = new Error(
        "Тільки засновник організації може передати права власності!",
      );
      error.statusCode = 403;
      throw error;
    }

    const newOwner = await User.findById(newOwnerId);

    if (!newOwner || newOwner.organizationId?.toString() !== orgId.toString()) {
      const error = new Error(
        "Новий власник повинен бути членом цієї організації!",
      );
      error.statusCode = 400;
      throw error;
    }

    org.creatorId = newOwnerId;
    await org.save();

    await User.findByIdAndUpdate(
      newOwnerId,
      {
        role: "admin",
        organizationId: orgId,
      },
      { overwriteDiscriminatorKey: true },
    );

    const currentOwner = await User.findById(currentOwnerId);
    if (currentOwner && currentOwner.role !== "superadmin") {
      currentOwner.role = "user";
      await currentOwner.save();
    }

    await auditService.log({
      req,
      action: "ORG_OWNERSHIP_TRANSFERRED",
      category: "ORGANIZATION",
      severity: "critical",
      targetEntity: {
        entityType: "Organization",
        entityId: org._id,
        entityName: org.name,
      },
      payload: {
        previousState: { ownerId: currentOwnerId },
        newState: { ownerId: newOwnerId },
      },
      organizationId: org._id,
    });

    try {
      await notificationService.createNotification({
        recipientId: newOwnerId,
        title: "Вам передано права власності!",
        message: `Вам успішно передано права власності на установу "${org.name}". Тепер ви є її керівником.`,
        type: "SYSTEM_INFO",
        link: "/organization/dashboard",
      });

      await notificationService.createNotification({
        recipientId: currentOwnerId,
        title: "Права власності передано успішно!",
        message: `Права власності на установу "${org.name}" було успішно передано іншому учасникові.`,
        type: "SYSTEM_INFO",
        link: "/profile",
      });
    } catch (notifErr) {
      console.error(
        "Помилка створення сповіщення transferOwnership:",
        notifErr,
      );
    }
  }

  async toggleVerified(id, req = null) {
    const org = await Organization.findById(id);
    if (!org) return null;

    org.isVerified = !org.isVerified;
    await org.save();

    await auditService.log({
      req,
      action: "ORG_VERIFIED_TOGGLED",
      category: "ORGANIZATION",
      severity: "warning",
      targetEntity: {
        entityType: "Organization",
        entityId: org._id,
        entityName: org.name,
      },
      payload: {
        newState: { isVerified: org.isVerified },
      },
      organizationId: org._id,
    });

    return org;
  }

  async toggleFeatured(id, req = null) {
    const org = await Organization.findById(id);
    if (!org) return null;

    org.isFeatured = !org.isFeatured;
    await org.save();

    await auditService.log({
      req,
      action: "ORG_FEATURED_TOGGLED",
      category: "ORGANIZATION",
      severity: "info",
      targetEntity: {
        entityType: "Organization",
        entityId: org._id,
        entityName: org.name,
      },
      payload: {
        newState: { isFeatured: org.isFeatured },
      },
      organizationId: org._id,
    });

    return org;
  }

  async getAll(filters = {}, page = 1, limit = 6) {
    const query = this.#buildFilterQuery(filters);
    const skip = (page - 1) * limit;

    const organizations = await Organization.find(query)
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Organization.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return { organizations, totalPages, currentPage: Number(page) };
  }

  async updateStatus(id, status, req = null) {
    const org = await Organization.findById(id);
    if (!org) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = org.status;
    org.status = status;
    this.clearCache();

    const creatorUserId = org.creatorId._id || org.creatorId;

    if (status === "approved") {
      org.isVerified = true;

      if (org.edrpou.includes("-rejected-")) {
        org.edrpou = org.edrpou.split("-rejected-")[0];
      }
      org.name = org.name.replace(/\s*\(Відхилено\)/g, "").trim();

      await User.findByIdAndUpdate(
        creatorUserId,
        {
          $set: {
            role: "admin",
            organizationId: org._id,
          },
          $unset: {
            pendingOrganizationId: 1,
          },
        },
        {
          new: true,
          runValidators: false,
          overwriteDiscriminatorKey: true,
        },
      );

      try {
        await notificationService.createNotification({
          recipientId: creatorUserId,
          title: "Установу підтверджено!",
          message: `Вітаємо! Вашу заявку на реєстрацію установи "${org.name}" успішно схвалено. Вам надано роль Адміністратора.`,
          type: "ORG_CREATED_APPROVED",
          link: "/organization/dashboard",
        });
      } catch (notifErr) {
        console.error(
          "Помилка створення сповіщення updateStatus approved:",
          notifErr,
        );
      }
    }

    if (status === "rejected") {
      org.isVerified = false;
      org.edrpou = `${org.edrpou}-rejected-${Date.now()}`;
      org.name = `${org.name} (Відхилено)`;

      await User.findByIdAndUpdate(creatorUserId, {
        $unset: { pendingOrganizationId: 1 },
      });

      try {
        await notificationService.createNotification({
          recipientId: creatorUserId,
          title: "Заявку на реєстрацію установи відхилено",
          message: `На жаль, вашу заявку на реєстрацію установи "${org.name}" було відхилено адміністратором платформи.`,
          type: "ORG_CREATED_REJECTED",
          link: "/profile",
        });
      } catch (notifErr) {
        console.error(
          "Помилка створення сповіщення updateStatus rejected:",
          notifErr,
        );
      }
    }

    await org.save();

    await auditService.log({
      req,
      action: status === "approved" ? "ORG_APPROVED" : "ORG_REJECTED",
      category: "ORGANIZATION",
      severity: "warning",
      targetEntity: {
        entityType: "Organization",
        entityId: org._id,
        entityName: org.name,
      },
      payload: {
        previousState: { status: previousStatus },
        newState: { status: org.status, isVerified: org.isVerified },
      },
      organizationId: org._id,
    });

    return org;
  }

  async deleteOrganization(orgId, requestUserId, userRole, req = null) {
    const org = await Organization.findById(orgId).select(
      "creatorId logo isSystem name",
    );
    if (!org) {
      const error = new Error("Установу не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (org.isSystem) {
      const error = new Error(
        "Системну організацію 'Science Platform' заборонено видаляти!",
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      org.creatorId.toString() !== requestUserId.toString() &&
      userRole !== "superadmin"
    ) {
      const error = new Error("Немає прав на видалення цієї організації");
      error.statusCode = 403;
      throw error;
    }

    try {
      const orgMembers = await User.find({ organizationId: orgId }).select(
        "_id",
      );
      const membersToNotify = orgMembers
        .map((m) => m._id)
        .filter((mId) => mId.toString() !== requestUserId.toString());

      for (const memberId of membersToNotify) {
        await notificationService.createNotification({
          recipientId: memberId,
          title: "Установу розформовано",
          message: `Установу, в якій ви перебували, було видалено. Ваш профіль переведено у статус звичайного дослідника.`,
          type: "SYSTEM_INFO",
          link: "/profile",
          sendEmail: true,
        });
      }
    } catch (notifErr) {
      console.error(
        "Помилка сповіщення членів при видаленні організації:",
        notifErr,
      );
    }

    try {
      const programs = await Program.find({ organizationId: orgId }).select(
        "_id",
      );
      const programIds = programs.map((p) => p._id);

      if (programIds.length > 0) {
        await projectService.handleProgramDeletion(programIds);

        const Project = mongoose.model("Project");
        await Project.updateMany(
          {
            programId: { $in: programIds },
            status: { $in: ["На розгляді", "Прийнято"] },
          },
          {
            $set: {
              programId: null,
              reviewerId: null,
              reviewStatus: "Не призначено",
            },
          },
        );

        await Program.deleteMany({ organizationId: orgId });
      }
    } catch (err) {
      console.error(
        "Помилка при каскадному видаленні наукових програм/проєктів:",
        err,
      );
    }

    try {
      await User.updateMany(
        { organizationId: orgId, role: "reviewer" },
        { $set: { isReviewerActive: false } },
      );

      await User.updateMany(
        { organizationId: orgId },
        { $set: { organizationId: null } },
      );

      const managers = await User.find({
        organizationId: orgId,
        role: "content-manager",
      });
      for (const manager of managers) {
        manager.role = "user";
        manager.organizationId = null;
        await manager.save();
      }

      await User.findByIdAndUpdate(
        org.creatorId,
        {
          $set: { role: "user", organizationId: null },
          $unset: { pendingOrganizationId: 1 },
        },
        {
          overwriteDiscriminatorKey: true,
          runValidators: true,
        },
      );
    } catch (err) {
      console.error("Помилка при скиданні зв'язків користувачів:", err);
    }

    this.clearCache();

    if (org.logo) {
      await this.#deleteImageFromCloudinary(org.logo);
    }

    await auditService.log({
      req,
      action: "ORG_DELETED",
      category: "ORGANIZATION",
      severity: "critical",
      targetEntity: {
        entityType: "Organization",
        entityId: org._id,
        entityName: org.name,
      },
      payload: {
        metadata: { deletedByRole: userRole },
      },
      organizationId: org._id,
    });

    await Organization.findByIdAndDelete(orgId);
  }

  async getOrganizationReviewers(organizationId) {
    const User = mongoose.model("User");

    const orgStr = String(organizationId);
    let orgObjId = null;
    if (mongoose.Types.ObjectId.isValid(orgStr)) {
      orgObjId = new mongoose.Types.ObjectId(orgStr);
    }

    const reviewers = await User.find({
      organizationId: { $in: [orgStr, orgObjId] },
      role: "reviewer",
      isBanned: false,
      isReviewerActive: { $ne: false },
    }).select(
      "_id name email academicDegree allowedDomains allowedTypes isReviewerActive image",
    );

    return reviewers;
  }
}

module.exports = new OrganizationService();
