const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Notification = require("../models/Notification");
const projectService = require("./projectService");
const auditService = require("./auditService");

class ProgramService {
  getProgramModel() {
    return mongoose.model("Program");
  }

  #buildFilterQuery(filters = {}) {
    const query = {};

    if (filters.active !== undefined) {
      query.active = filters.active === true || filters.active === "true";
    }

    if (query.active === true) {
      query.deadline = { $gte: new Date() };
    }

    if (filters.type && filters.type !== "Всі") {
      query.type = filters.type;
    }

    if (filters.organizationId) {
      query.organizationId = filters.organizationId;
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: "i" };
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    return query;
  }

  async #processInBatches(items, batchSize, fn) {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(fn));
    }
  }

  async getAll(queryFilters = {}, page = 1, limit = 8) {
    const ProgramModel = this.getProgramModel();
    const query = this.#buildFilterQuery(queryFilters);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const skip = (pageNum - 1) * limitNum;

    const [programs, total] = await Promise.all([
      ProgramModel.find(query)
        .populate("organizationId", "name logo isSystem")
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProgramModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      programs,
      totalPages,
      currentPage: pageNum,
      totalItems: total,
    };
  }

  async getArchive(queryFilters = {}, page = 1, limit = 8) {
    const ProgramModel = this.getProgramModel();
    const query = this.#buildFilterQuery({ ...queryFilters, active: false });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const skip = (pageNum - 1) * limitNum;

    const [archived, total] = await Promise.all([
      ProgramModel.find(query)
        .populate("organizationId", "name logo")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProgramModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      archived,
      totalPages,
      currentPage: pageNum,
      totalItems: total,
    };
  }

  async getById(id) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(id).populate(
      "organizationId",
      "name logo description contactEmail website",
    );
    if (!program) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }
    return program;
  }

  async create(programData, type, req = null) {
    const ProgramModel = this.getProgramModel();
    const OrganizationModel = mongoose.model("Organization");

    if (programData.organizationId) {
      const org = await OrganizationModel.findById(
        programData.organizationId,
      ).select("name isSystem");
      if (org) {
        programData.organizer = org.name;
        if (org.isSystem) {
          programData.isFeatured = true;
        }
      }
    }

    const modelsMap = {
      "Науковий журнал": ProgramModel.JournalProgram,
      Грант: ProgramModel.GrantProgram,
      Конференція: ProgramModel.ConferenceProgram,
      Датасет: ProgramModel.DatasetProgram,
      Курс: ProgramModel.CourseProgram,
      Стаття: ProgramModel.ArticleProgram,
    };

    const TargetModel = modelsMap[type] || ProgramModel;
    const newProgram = new TargetModel(programData);
    const savedProgram = await newProgram.save();

    await auditService.log({
      req,
      action: "PROGRAM_CREATED",
      category: "PROGRAM",
      severity: "info",
      targetEntity: {
        entityType: "Program",
        entityId: savedProgram._id,
        entityName: savedProgram.title,
      },
      payload: {
        newState: {
          type: type || savedProgram.type,
          deadline: savedProgram.deadline,
          domain: savedProgram.domain,
          active: savedProgram.active,
        },
      },
      organizationId: savedProgram.organizationId || null,
    });

    if (savedProgram.organizationId) {
      try {
        const reviewers = await User.find({
          organizationId: savedProgram.organizationId,
          role: "reviewer",
          isBanned: false,
          isReviewerActive: true,
        }).select("_id");

        if (reviewers.length > 0) {
          const notifications = reviewers.map((r) => ({
            recipientId: r._id,
            title: "Нова програма в установі",
            message: `Ваша установа відкрила нову програму "${savedProgram.title}" (${type}). Будьте готові до рецензування майбутніх робіт.`,
            type: "SYSTEM_INFO",
            link: `/programs/${savedProgram._id}`,
          }));

          await Notification.insertMany(notifications);
        }
      } catch (notifErr) {
        console.error(
          "Помилка надсилання сповіщень рецензентам про нову програму:",
          notifErr,
        );
      }
    }

    return savedProgram;
  }

  async toggleStatus(programId, status, req = null) {
    const ProgramModel = this.getProgramModel();

    const program = await ProgramModel.findById(programId);
    if (!program) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = program.active;

    if (status !== undefined) {
      program.active = status === "active" || status === true;
    } else {
      program.active = !program.active;
    }

    await program.save();

    await auditService.log({
      req,
      action: "PROGRAM_TOGGLED",
      category: "PROGRAM",
      severity: "warning",
      targetEntity: {
        entityType: "Program",
        entityId: program._id,
        entityName: program.title,
      },
      payload: {
        previousState: { active: previousStatus },
        newState: { active: program.active },
      },
      organizationId: program.organizationId || null,
    });

    try {
      const ProjectModel = mongoose.model("Project");
      const projects = await ProjectModel.find({ programId }).select(
        "authorId",
      );
      const authorIds = [
        ...new Set(
          projects.filter((p) => p.authorId).map((p) => p.authorId.toString()),
        ),
      ];

      if (authorIds.length > 0) {
        const statusText = program.active ? "активовано" : "деактивовано";
        const notifications = authorIds.map((authorId) => ({
          recipientId: authorId,
          title: "Зміна статусу програми",
          message: `Статус програми "${program.title}" змінено на: ${statusText}.`,
          type: "SYSTEM_INFO",
          link: `/programs/${program._id}`,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.error(
        "Помилка при надсиланні сповіщень про зміну статусу:",
        error,
      );
    }

    return program;
  }

  async update(id, programData, req = null) {
    const ProgramModel = this.getProgramModel();
    const currentProgram = await ProgramModel.findById(id);

    if (!currentProgram) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const updatedProgram = await ProgramModel.findByIdAndUpdate(
      id,
      { $set: programData },
      { new: true },
    );

    await auditService.log({
      req,
      action: "PROGRAM_UPDATED",
      category: "PROGRAM",
      severity: "info",
      targetEntity: {
        entityType: "Program",
        entityId: updatedProgram._id,
        entityName: updatedProgram.title,
      },
      payload: {
        previousState: {
          title: currentProgram.title,
          deadline: currentProgram.deadline,
        },
        newState: {
          title: updatedProgram.title,
          deadline: updatedProgram.deadline,
          updatedFields: Object.keys(programData),
        },
      },
      organizationId: updatedProgram.organizationId || null,
    });

    return updatedProgram;
  }

  async delete(id, req = null) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(id);

    if (!program) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }

    await projectService.handleProgramDeletion([id]);
    await ProgramModel.findByIdAndDelete(id);

    await auditService.log({
      req,
      action: "PROGRAM_DELETED",
      category: "PROGRAM",
      severity: "critical",
      targetEntity: {
        entityType: "Program",
        entityId: id,
        entityName: program.title,
      },
      organizationId: program.organizationId || null,
    });

    return program;
  }

  async handleDeadlineReached(programId, req = null) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(programId);

    if (!program) return;

    program.active = false;
    await program.save();

    await auditService.log({
      req,
      action: "PROGRAM_DEADLINE_REACHED",
      category: "PROGRAM",
      severity: "warning",
      targetEntity: {
        entityType: "Program",
        entityId: program._id,
        entityName: program.title,
      },
      payload: {
        metadata: { deadline: program.deadline, trigger: "SYSTEM_DEADLINE" },
      },
      organizationId: program.organizationId || null,
    });

    const ProjectModel = mongoose.model("Project");

    try {
      const allProjects = await ProjectModel.find({ programId }).select(
        "authorId",
      );
      const authorIds = [
        ...new Set(
          allProjects
            .filter((p) => p.authorId)
            .map((p) => p.authorId.toString()),
        ),
      ];

      if (authorIds.length > 0) {
        const notifications = authorIds.map((authorId) => ({
          recipientId: authorId,
          title: "Завершення дедлайну програми",
          message: `Дедлайн прийому заявок для програми "${program.title}" завершився. Прийом заявок закрито.`,
          type: "SYSTEM_INFO",
          link: `/programs/${program._id}`,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.error("Помилка при надсиланні сповіщень про дедлайн:", error);
    }

    const trashProjects = await ProjectModel.find({
      programId: programId,
      status: "Відхилено",
    }).select("_id");

    if (trashProjects.length > 0) {
      await this.#processInBatches(trashProjects, 5, (proj) =>
        projectService.clearRejectedProjectFiles(proj._id),
      );
    }
  }

  async finalCleanupAndClose(programId, req = null) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(programId);

    if (!program) return;

    const ProjectModel = mongoose.model("Project");

    const nonApprovedProjects = await ProjectModel.find({
      programId: programId,
      status: { $ne: "Прийнято" },
    }).select("_id authorId");

    if (nonApprovedProjects.length > 0) {
      await this.#processInBatches(nonApprovedProjects, 5, (proj) =>
        projectService.clearRejectedProjectFiles(proj._id),
      );
    }

    program.active = false;
    await program.save();

    await auditService.log({
      req,
      action: "PROGRAM_CLEANUP_AND_CLOSED",
      category: "PROGRAM",
      severity: "critical",
      targetEntity: {
        entityType: "Program",
        entityId: program._id,
        entityName: program.title,
      },
      payload: {
        metadata: { cleanedNonApprovedCount: nonApprovedProjects.length },
      },
      organizationId: program.organizationId || null,
    });

    try {
      const allProjects = await ProjectModel.find({ programId }).select(
        "authorId",
      );
      const authorIds = [
        ...new Set(
          allProjects
            .filter((p) => p.authorId)
            .map((p) => p.authorId.toString()),
        ),
      ];

      if (authorIds.length > 0) {
        const notifications = authorIds.map((authorId) => ({
          recipientId: authorId,
          title: "Програму закрито",
          message: `Програму "${program.title}" закрито адміністратором.`,
          type: "SYSTEM_INFO",
          link: `/programs/${program._id}`,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.error(
        "Помилка при надсиланні сповіщень про закриття програми:",
        error,
      );
    }
  }
}

module.exports = new ProgramService();
