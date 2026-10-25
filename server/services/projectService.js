const Project = require("../models/Project");
const User = require("../models/User");
const Program = require("../models/Program");
const cloudinary = require("cloudinary").v2;
const notificationService = require("./notificationService");
const auditService = require("./auditService");
const mongoose = require("mongoose");

class ProjectService {
  async #deleteFileFromCloudinary(fileUrl) {
    if (!fileUrl || !fileUrl.includes("cloudinary.com")) return;
    try {
      const parts = fileUrl.split("/upload/");
      if (parts.length < 2) return;

      const publicIdWithExtension = parts[1].replace(/^v\d+\//, "");
      const publicId = publicIdWithExtension.substring(
        0,
        publicIdWithExtension.lastIndexOf("."),
      );

      await cloudinary.uploader
        .destroy(publicId, { resource_type: "raw" })
        .catch(() => {});
      await cloudinary.uploader
        .destroy(publicId, { resource_type: "image" })
        .catch(() => {});
    } catch (err) {
      console.error("Помилка видалення файлу проєкту з Cloudinary:", err);
    }
  }

  #buildFilterQuery(filters = {}) {
    const query = {};

    if (filters.status && filters.status !== "Всі") {
      query.status = filters.status;
    }

    if (filters.reviewStatus && filters.reviewStatus !== "Всі") {
      query.reviewStatus = filters.reviewStatus;
    }

    if (filters.domain && filters.domain !== "Всі") {
      query.domain = filters.domain;
    }

    if (filters.programId) {
      query.programId = filters.programId;
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: "i" };
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    return query;
  }

  async getAuthorProjects(authorId, filters = {}, page = 1, limit = 8) {
    if (!authorId) {
      const error = new Error("Не вказано ID автора");
      error.statusCode = 400;
      throw error;
    }

    const query = this.#buildFilterQuery(filters);
    query.authorId = authorId;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const skip = (pageNum - 1) * limitNum;

    const [
      projects,
      total,
      acceptedCount,
      pendingCount,
      revisionCount,
      rejectedCount,
    ] = await Promise.all([
      Project.find(query)
        .populate("programId", "title type organizationId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(query),
      Project.countDocuments({ authorId, status: "Прийнято" }),
      Project.countDocuments({
        authorId,
        $or: [{ status: "На розгляді" }, { status: { $exists: false } }],
      }),
      Project.countDocuments({ authorId, status: "На доопрацюванні" }),
      Project.countDocuments({ authorId, status: "Відхилено" }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    const stats = {
      total,
      accepted: acceptedCount,
      pending: pendingCount,
      needsRevision: revisionCount,
      rejected: rejectedCount,
    };

    if (projects.length === 0) {
      return {
        projects: [],
        totalPages: 1,
        currentPage: pageNum,
        totalItems: 0,
        stats,
      };
    }

    const Review = require("../models/Review");
    const projectIds = projects.map((p) => p._id);

    const reviews = await Review.find({ projectId: { $in: projectIds } })
      .select(
        "projectId totalScore scores publicComment recommendation createdAt",
      )
      .lean();

    const projectsWithReviews = projects.map((project) => {
      const review = reviews.find(
        (r) => r.projectId.toString() === project._id.toString(),
      );

      return {
        ...project,
        review: review || null,
        reviewerComments:
          review?.publicComment || project.reviewerComments || "",
        reviewerRecommendation:
          review?.recommendation || project.reviewerRecommendation || "",
      };
    });

    return {
      projects: projectsWithReviews,
      totalPages,
      currentPage: pageNum,
      totalItems: total,
      stats,
    };
  }

  async getReviewerQueue(reviewerId, filters = {}, page = 1, limit = 8) {
    if (!reviewerId) {
      const error = new Error("Не вказано ID рецензента");
      error.statusCode = 400;
      throw error;
    }

    const query = this.#buildFilterQuery(filters);
    query.reviewerId = reviewerId;

    if (!filters.reviewStatus) {
      query.reviewStatus = {
        $in: ["Не призначено", "В процесі", "На доопрацюванні"],
      };
    }

    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate("programId", "title type deadline")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      projects,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async submitReview(projectId, reviewerId, reviewData, req = null) {
    const Review = require("../models/Review");

    const project = await Project.findById(projectId).populate(
      "programId",
      "type title organizationId",
    );
    if (!project) {
      const error = new Error("Проєкт не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (project.reviewerId?.toString() !== reviewerId.toString()) {
      const error = new Error(
        "Ви не є призначеним рецензентом для цього проєкту",
      );
      error.statusCode = 403;
      throw error;
    }

    const programType = project.programId?.type || "Науковий журнал";

    let totalScore = 0;
    if (reviewData.scores && typeof reviewData.scores === "object") {
      const scoreValues = Object.values(reviewData.scores).map(Number);
      if (scoreValues.length > 0) {
        const sum = scoreValues.reduce((acc, curr) => acc + curr, 0);
        totalScore = Number((sum / scoreValues.length).toFixed(2));
      }
    }

    const newReview = new Review({
      projectId,
      reviewerId,
      programType,
      scores: reviewData.scores || {},
      totalScore: totalScore || 5,
      recommendation: reviewData.recommendation || "Прийняти без змін",
      hasConflictOfInterest: Boolean(reviewData.hasConflictOfInterest),
      ethicalCompliance:
        reviewData.ethicalCompliance !== undefined
          ? Boolean(reviewData.ethicalCompliance)
          : true,
      publicComment:
        reviewData.publicComment ||
        reviewData.reviewerComments ||
        "Без зауважень",
      privateComment: reviewData.privateComment || "",
    });

    await newReview.save();

    const previousStatus = project.status;
    if (reviewData.status) project.status = reviewData.status;

    if (reviewData.status === "На доопрацюванні") {
      project.reviewStatus = "На доопрацюванні";
    } else {
      project.reviewStatus = "Завершено";
      // 👈 Зменшуємо лічильник активних робіт рецензента при завершенні
      await User.findByIdAndUpdate(reviewerId, {
        $inc: { assignedProjectsCount: -1 },
      });
    }

    project.reviewerComments =
      reviewData.publicComment || reviewData.reviewerComments || "";
    project.reviewerRecommendation = reviewData.recommendation || "";

    const savedProject = await project.save();

    await auditService.log({
      req,
      action: "REVIEW_SUBMITTED",
      category: "REVIEW",
      severity: "info",
      targetEntity: {
        entityType: "Project",
        entityId: savedProject._id,
        entityName: savedProject.title,
      },
      payload: {
        previousState: { status: previousStatus },
        newState: {
          status: savedProject.status,
          reviewStatus: savedProject.reviewStatus,
          totalScore,
          recommendation: newReview.recommendation,
        },
      },
      organizationId: project.programId?.organizationId || null,
    });

    if (project.authorId) {
      try {
        await notificationService.createNotification({
          recipientId: project.authorId,
          title: "Результат рецензування",
          message: `Рецензент розглянув ваш проєкт "${project.title}". Підсумковий бал: ${totalScore}/5. Статус: "${project.status}".`,
          type: "PROJECT_REVIEWED",
          link: `/projects/${project._id}`,
          sendEmail: true,
        });
      } catch (err) {
        console.error("Помилка надсилання сповіщення про рецензію:", err);
      }
    }

    return {
      project: savedProject,
      review: newReview,
    };
  }

  async getProjectReview(projectId) {
    const Review = require("../models/Review");
    return await Review.findOne({ projectId })
      .populate("reviewerId", "name email academicDegree image")
      .sort({ createdAt: -1 });
  }

  async getOrganizationProjects(orgId, filters = {}, page = 1, limit = 8) {
    if (!orgId) {
      const error = new Error("Не вказано ID організації");
      error.statusCode = 400;
      throw error;
    }

    const programs = await Program.find({ organizationId: orgId }).select(
      "_id",
    );
    const programIds = programs.map((p) => p._id);

    const query = this.#buildFilterQuery(filters);

    delete query.organizationId;
    delete query.organization;

    query.programId = { $in: programIds };

    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate("authorId", "name email image")
      .populate("programId", "title type")
      .populate("reviewerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      projects,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async getAll(queryFilters = {}, page = 1, limit = 8) {
    const query = this.#buildFilterQuery(queryFilters);
    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate("authorId", "name email")
      .populate("programId", "title type")
      .populate("reviewerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      projects,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async getById(id, currentUser = null) {
    const Review = require("../models/Review");

    const project = await Project.findById(id)
      .populate("authorId", "name email image role")
      .populate("programId", "title type description organizationId")
      .lean();

    if (!project) {
      const error = new Error("Проєкт не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const isAssignedReviewer =
      currentUser &&
      project.reviewerId &&
      project.reviewerId.toString() === currentUser.id.toString();

    const isManagement =
      currentUser &&
      (currentUser.role === "superadmin" || currentUser.role === "admin");

    const review = await Review.findOne({ projectId: id }).lean();

    const result = {
      ...project,
      review: review || null,
      reviewerComments: review?.publicComment || project.reviewerComments || "",
      reviewerRecommendation:
        review?.recommendation || project.reviewerRecommendation || "",
    };

    if (isAssignedReviewer || isManagement) {
      if (project.reviewerId) {
        const reviewerUser = await User.findById(project.reviewerId)
          .select("name email allowedDomains academicDegree image")
          .lean();
        result.reviewer = reviewerUser || null;
      }
    } else {
      delete result.reviewerId;
    }

    return result;
  }

  async getArchive(currentUser = null, queryFilters = {}, page = 1, limit = 8) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const skip = (pageNum - 1) * limitNum;

    // 1. Дозволені типи програм для НАУКОВОГО АРХІВУ (без "Грант" та "Курс")
    const allowedTypes = [
      "Науковий журнал",
      "Стаття",
      "Датасет",
      "Конференція",
    ];

    // 2. Знаходимо ID всіх програм дозволених типів
    const validPrograms = await Program.find({
      type: { $in: allowedTypes },
    }).select("_id organizationId");

    const validProgramIds = validPrograms.map((p) => p._id);

    const query = this.#buildFilterQuery(queryFilters);

    // 3. 🎯 КЛЮЧОВИЙ ФІЛЬТР: Примусово обмежуємо проєкти ТІЛЬКИ дозволеними програмами
    query.programId = { $in: validProgramIds };
    query.status = { $in: ["Прийнято", "approved"] };

    if (!currentUser) {
      query.$or = [
        { accessLevel: "public" },
        { accessLevel: { $exists: false } },
      ];
    } else if (currentUser.role !== "superadmin") {
      const userOrgId = currentUser.organizationId
        ? currentUser.organizationId.toString()
        : null;

      const userOrgProgramIds = validPrograms
        .filter(
          (p) => p.organizationId && p.organizationId.toString() === userOrgId,
        )
        .map((p) => p._id);

      query.$or = [
        { accessLevel: "public" },
        { accessLevel: { $exists: false } },
        {
          accessLevel: "restricted",
          programId: { $in: userOrgProgramIds },
        },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate("authorId", "name image email")
        .populate("programId", "title type organizationId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Project.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      projects,
      totalPages,
      currentPage: pageNum,
      totalItems: total,
    };
  }

  async create(projectData, req = null) {
    const program = await Program.findById(projectData.programId);
    if (!program) {
      const error = new Error("Наукову програму/грант не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const now = new Date();
    if (
      !program.active ||
      (program.deadline && new Date(program.deadline) < now)
    ) {
      const error = new Error(
        "Прийом заявок за цією програмою вже завершено (дедлайн минув або програма в архіві)",
      );
      error.statusCode = 400;
      throw error;
    }

    const projectDomains =
      typeof projectData.domain === "string"
        ? projectData.domain.split(",").map((d) => d.trim())
        : projectData.domain;

    const newProject = new Project({
      title: projectData.title,
      description: projectData.description,
      programTitle: program.title,
      domain: Array.isArray(projectDomains)
        ? projectDomains[0]
        : projectData.domain || "Інше",
      authorId: projectData.authorId,
      programId: projectData.programId,
      metadata: projectData.metadata || {},
      versions: projectData.versions || [],
    });

    try {
      const selectedReviewer = await User.findOne({
        role: "reviewer",
        organizationId: program.organizationId,
        isBanned: false,
        isReviewerActive: true,
        allowedDomains: {
          $in: Array.isArray(projectDomains)
            ? projectDomains
            : [projectData.domain],
        },
        allowedTypes: program.type,
      })
        .sort({ assignedProjectsCount: 1, lastAssignedAt: 1, updatedAt: 1 })
        .select("_id name");

      if (selectedReviewer) {
        newProject.reviewerId = selectedReviewer._id;
        newProject.reviewStatus = "В процесі";

        await User.findByIdAndUpdate(selectedReviewer._id, {
          $inc: { assignedProjectsCount: 1 },
          $set: { lastAssignedAt: new Date() },
        });
      } else {
        newProject.reviewStatus = "Не призначено";
      }
    } catch (err) {
      console.error(
        "Помилка автоматичного двоетапного підбору рецензента:",
        err,
      );
    }

    const savedProject = await newProject.save();

    await auditService.log({
      req,
      action: "PROJECT_SUBMITTED",
      category: "PROJECT",
      severity: "info",
      targetEntity: {
        entityType: "Project",
        entityId: savedProject._id,
        entityName: savedProject.title,
      },
      payload: {
        newState: {
          domain: savedProject.domain,
          programId: savedProject.programId,
          reviewStatus: savedProject.reviewStatus,
          reviewerAssigned: Boolean(savedProject.reviewerId),
        },
      },
      organizationId: program.organizationId || null,
    });

    try {
      await notificationService.createNotification({
        recipientId: savedProject.authorId,
        title: "Проєкт подано",
        message: `Ваш проєкт "${savedProject.title}" успішно подано до програми "${program.title}".`,
        type: "PROJECT_CREATED",
        link: `/projects/${savedProject._id}`,
        sendEmail: true,
      });

      if (savedProject.reviewerId) {
        await notificationService.createNotification({
          recipientId: savedProject.reviewerId,
          title: "Новий проєкт для рецензування",
          message: `Вам призначено новий проєкт для перевірки: "${savedProject.title}".`,
          type: "PROJECT_ASSIGNED",
          link: `/reviewer/queue`,
          sendEmail: true,
        });
      }
    } catch (err) {
      console.error(
        "Помилка надсилання сповіщення при створенні проєкту:",
        err,
      );
    }

    return savedProject;
  }

  /**
   * Фоновий процес авто-перерозподілу проєктів із черги "Не призначено"
   */
  async reassignUnassignedProjects(organizationId, req = null) {
    if (!organizationId) return;

    const orgPrograms = await Program.find({ organizationId }).select(
      "_id title type",
    );
    const programIds = orgPrograms.map((p) => p._id);

    if (programIds.length === 0) return;

    const unassignedProjects = await Project.find({
      programId: { $in: programIds },
      reviewStatus: "Не призначено",
      status: "На розгляді",
    });

    let reassignedCount = 0;

    for (const proj of unassignedProjects) {
      const program = orgPrograms.find(
        (p) => p._id.toString() === proj.programId.toString(),
      );
      if (!program) continue;

      const selectedReviewer = await User.findOne({
        role: "reviewer",
        organizationId: organizationId,
        isBanned: false,
        isReviewerActive: true,
        allowedDomains: proj.domain,
        allowedTypes: program.type,
      })
        .sort({ assignedProjectsCount: 1, lastAssignedAt: 1, updatedAt: 1 })
        .select("_id name");

      if (selectedReviewer) {
        proj.reviewerId = selectedReviewer._id;
        proj.reviewStatus = "В процесі";
        await proj.save();

        reassignedCount++;

        await User.findByIdAndUpdate(selectedReviewer._id, {
          $inc: { assignedProjectsCount: 1 },
          $set: { lastAssignedAt: new Date() },
        });

        await notificationService.createNotification({
          recipientId: selectedReviewer._id,
          title: "Новий проєкт для рецензування",
          message: `Вам автоматично призначено проєкт з черги: "${proj.title}".`,
          type: "PROJECT_ASSIGNED",
          link: `/reviewer/queue`,
          sendEmail: true,
        });
      }
    }

    if (reassignedCount > 0) {
      await auditService.log({
        req,
        action: "PROJECTS_AUTO_REASSIGNED",
        category: "PROJECT",
        severity: "info",
        payload: {
          metadata: { count: reassignedCount, organizationId },
        },
        organizationId,
      });
    }
  }

  async update(id, updateData, req = null) {
    const oldProject = await Project.findById(id);
    if (!oldProject) {
      const error = new Error("Проєкт не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (
      updateData.reviewerId &&
      (oldProject.status === "Відхилено" || oldProject.status === "Прийнято")
    ) {
      const error = new Error(
        `Неможливо призначити рецензента для проєкту зі статусом "${oldProject.status}".`,
      );
      error.statusCode = 400;
      throw error;
    }

    const isReassigned =
      updateData.reviewerId &&
      (!oldProject.reviewerId ||
        oldProject.reviewerId.toString() !== updateData.reviewerId.toString());

    if (isReassigned) {
      updateData.reviewStatus = "В процесі";

      // 👈 Зменшуємо лічильник для старого та збільшуємо для нового
      if (oldProject.reviewerId) {
        await User.findByIdAndUpdate(oldProject.reviewerId, {
          $inc: { assignedProjectsCount: -1 },
        });
      }
      await User.findByIdAndUpdate(updateData.reviewerId, {
        $inc: { assignedProjectsCount: 1 },
        $set: { lastAssignedAt: new Date() },
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    await auditService.log({
      req,
      action: isReassigned ? "PROJECT_REASSIGNED_MANUALLY" : "PROJECT_UPDATED",
      category: "PROJECT",
      severity: isReassigned ? "warning" : "info",
      targetEntity: {
        entityType: "Project",
        entityId: updatedProject._id,
        entityName: updatedProject.title,
      },
      payload: {
        previousState: {
          reviewerId: oldProject.reviewerId,
          status: oldProject.status,
        },
        newState: {
          reviewerId: updatedProject.reviewerId,
          status: updatedProject.status,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    if (isReassigned) {
      try {
        await notificationService.createNotification({
          recipientId: updateData.reviewerId,
          title: "Призначено новий проєкт",
          message: `Вам призначено проєкт "${updatedProject.title}" для рецензування.`,
          type: "PROJECT_ASSIGNED",
          link: `/reviewer/queue`,
          sendEmail: true,
        });

        await notificationService.createNotification({
          recipientId: updatedProject.authorId,
          title: "Рецензента призначено",
          message: `Для вашого проєкту "${updatedProject.title}" було призначено рецензента. Процес перевірки розпочато.`,
          type: "SYSTEM_INFO",
          link: `/projects/${updatedProject._id}`,
          sendEmail: true,
        });
      } catch (err) {
        console.error(
          "Помилка надсилання сповіщень при ручному призначенні:",
          err,
        );
      }
    }

    return updatedProject;
  }

  async addVersion(id, fileData, req = null) {
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $push: { versions: fileData },
        $set: {
          status: "На розгляді",
          reviewStatus: "В процесі",
        },
      },
      { new: true, runValidators: true },
    )
      .populate("authorId", "name email image")
      .populate("programId", "title");

    await auditService.log({
      req,
      action: "PROJECT_NEW_VERSION_UPLOADED",
      category: "PROJECT",
      severity: "info",
      targetEntity: {
        entityType: "Project",
        entityId: updatedProject._id,
        entityName: updatedProject.title,
      },
      payload: {
        newState: {
          versionCount: updatedProject.versions.length,
          fileName: fileData.fileName,
        },
      },
    });

    if (updatedProject && updatedProject.reviewerId) {
      try {
        await notificationService.createNotification({
          recipientId: updatedProject.reviewerId,
          title: "Оновлення версії проєкту",
          message: `Автор завантажив нову версію файлу для проєкту "${updatedProject.title}".`,
          type: "SYSTEM_INFO",
          link: `/reviewer/queue`,
          sendEmail: true,
        });
      } catch (err) {
        console.error(
          "Помилка надсилання сповіщення рецензенту про нову версію:",
          err,
        );
      }
    }

    return updatedProject;
  }

  async delete(id, req = null) {
    const project = await Project.findById(id);
    if (!project) {
      const error = new Error("Проєкт не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (project.reviewerId && project.reviewStatus === "В процесі") {
      await User.findByIdAndUpdate(project.reviewerId, {
        $inc: { assignedProjectsCount: -1 },
      });
    }

    if (project.versions && project.versions.length > 0) {
      for (const version of project.versions) {
        if (version.fileUrl) {
          await this.#deleteFileFromCloudinary(version.fileUrl);
        }
      }
    }

    await Project.findByIdAndDelete(id);

    await auditService.log({
      req,
      action: "PROJECT_DELETED",
      category: "PROJECT",
      severity: "critical",
      targetEntity: {
        entityType: "Project",
        entityId: id,
        entityName: project.title,
      },
    });
  }

  async handleProgramDeletion(programIds) {
    if (!Array.isArray(programIds) || programIds.length === 0) return;

    const trashProjects = await Project.find({
      programId: { $in: programIds },
      status: "Відхилено",
    });

    for (const proj of trashProjects) {
      await this.clearRejectedProjectFiles(proj._id);
    }

    await Project.updateMany(
      {
        programId: { $in: programIds },
        status: { $in: ["На розгляді", "Прийнято", "На доопрацюванні"] },
      },
      { $set: { programId: null } },
    );
  }

  async clearRejectedProjectFiles(id) {
    const project = await Project.findById(id);
    if (!project) return;

    if (project.versions && project.versions.length > 0) {
      for (const version of project.versions) {
        if (version.fileUrl) {
          await this.#deleteFileFromCloudinary(version.fileUrl);
        }
      }
    }

    project.versions = project.versions.map((v) => {
      const versionObj = v.toObject ? v.toObject() : v;
      return {
        ...versionObj,
        fileUrl: null,
      };
    });

    await project.save({ validateBeforeSave: false });
  }
}

module.exports = new ProjectService();
