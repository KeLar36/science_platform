const Organization = require("../models/Organization");
const { containsBadWords } = require("../shared/profanityFilter");
const User = require("../models/User");
const Program = require("../models/Program");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const projectService = require("./projectService");
const notificationService = require("./notificationService");
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

  async create(userId, data) {
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
    return newOrg;
  }

  async requestToJoin(orgId, userId) {
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
      (req) => req.userId.toString() === userId.toString(),
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

  async leaveOrganization(userId) {
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

  async update(orgId, updateData, file) {
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
                return d.replace(/^[\["'\s]+|[\]"'\s]+$/g, "").trim();
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

  async acceptJoinRequest(orgId, userId) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      const error = new Error("Організацію не знайдено чи доступ обмежено");
      error.statusCode = 404;
      throw error;
    }

    organization.joinRequests = organization.joinRequests.filter(
      (req) => req.userId.toString() !== userId.toString(),
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

  async rejectJoinRequest(orgId, userId) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    organization.joinRequests = organization.joinRequests.filter(
      (req) => req.userId.toString() !== userId.toString(),
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

  async kickMember(orgId, adminUser, targetUserId) {
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
    const adminIdStr = (adminUser._id || adminUser.id)?.toString();
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
  ) {
    const cleanOrgId = orgId?._id ? orgId._id.toString() : orgId?.toString();

    const org = await Organization.findById(cleanOrgId);
    if (!org) {
      const error = new Error("Установу не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (org.creatorId.toString() !== adminUserId.toString()) {
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
      console.log(
        `Очищення черги: Активні проєкти користувача ${targetUserId} скинуто у статус "Не призначено".`,
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

  async transferOwnership(orgId, currentOwnerId, newOwnerId) {
    const org = await Organization.findById(orgId);
    if (!org) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (org.creatorId.toString() !== currentOwnerId.toString()) {
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

    console.log(
      `Права власності на організацію "${org.name}" успішно передано від ${currentOwnerId} до ${newOwnerId}`,
    );
  }

  async toggleVerified(id) {
    const org = await Organization.findById(id);
    if (!org) return null;

    org.isVerified = !org.isVerified;
    return await org.save();
  }

  async toggleFeatured(id) {
    const org = await Organization.findById(id);
    if (!org) return null;

    org.isFeatured = !org.isFeatured;
    return await org.save();
  }

  async getAll(filters = {}, page = 1, limit = 8) {
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

  async updateStatus(id, status) {
    const org = await Organization.findById(id);
    if (!org) {
      const error = new Error("Організацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    org.status = status;
    this.clearCache();

    const creatorUserId = org.creatorId._id || org.creatorId;

    if (status === "approved") {
      org.isVerified = true;

      if (org.edrpou.includes("-rejected-")) {
        org.edrpou = org.edrpou.split("-rejected-")[0];
      }
      org.name = org.name.replace(/\s*\(Відхилено\)/g, "").trim();

      const updatedUser = await User.findByIdAndUpdate(
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

      if (updatedUser) {
        console.log(`Роль засновника успішно змінено на ${updatedUser.role}!`);
      }

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
    return org;
  }

  async deleteOrganization(orgId, requestUserId, userRole) {
    const org = await Organization.findById(orgId).select(
      "creatorId logo isSystem",
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

    console.log(
      `Початок глобального каскадного видалення установи ${orgId}...`,
    );

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

        console.log(
          `  ↳ Наукові програми (${programIds.length} од.) успішно ліквідовано.`,
        );
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
      console.log(
        "  ↳ Усіх членів установи звільнено, роль засновника скинуто на 'user'.",
      );
    } catch (err) {
      console.error("Помилка при скиданні зв'язків користувачів:", err);
    }

    this.clearCache();

    if (org.logo) {
      await this.#deleteImageFromCloudinary(org.logo);
    }

    await Organization.findByIdAndDelete(orgId);
    console.log(
      `Установу ${orgId} повністю та безповоротно видалено з системи!`,
    );
  }
}

module.exports = new OrganizationService();
