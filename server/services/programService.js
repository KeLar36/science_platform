const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const projectService = require("./projectService");
const notificationService = require("./notificationService");

class ProgramService {
  getProgramModel() {
    return mongoose.model("Program");
  }

  #buildFilterQuery(filters = {}) {
    const query = {};

    if (filters.active !== undefined) {
      query.active = filters.active === true || filters.active === "true";
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

  async getAll(queryFilters = {}, page = 1, limit = 8) {
    const ProgramModel = this.getProgramModel();
    const query = this.#buildFilterQuery(queryFilters);
    const skip = (page - 1) * limit;

    const programs = await ProgramModel.find(query)
      .populate("organizationId", "name logo isSystem")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProgramModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      programs,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async getArchive(queryFilters = {}, page = 1, limit = 8) {
    const ProgramModel = this.getProgramModel();
    const query = this.#buildFilterQuery({ ...queryFilters, active: false });
    const skip = (page - 1) * limit;

    const archived = await ProgramModel.find(query)
      .populate("organizationId", "name logo")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProgramModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      archived,
      totalPages,
      currentPage: Number(page),
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

  async create(programData, type) {
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

    if (savedProgram.organizationId) {
      try {
        const reviewers = await User.find({
          organizationId: savedProgram.organizationId,
          role: "reviewer",
          isBanned: false,
          isReviewerActive: true,
        }).select("_id");

        for (const reviewer of reviewers) {
          await notificationService.createNotification({
            recipientId: reviewer._id,
            title: "Нова програма в установі",
            message: `Ваша установа відкрила нову програму "${savedProgram.title}" (${type}). Будьте готові до рецензування майбутніх робіт.`,
            type: "SYSTEM_INFO",
            link: `/programs/${savedProgram._id}`,
            sendEmail: false,
          });
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

  async toggleStatus(programId, status) {
    const ProgramModel = this.getProgramModel();

    const program = await ProgramModel.findById(programId);
    if (!program) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (status !== undefined) {
      program.active = status === "active";
    } else {
      program.active = !program.active;
    }

    await program.save();

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

      const statusText = program.active ? "активовано" : "деактивовано";
      for (const authorId of authorIds) {
        await notificationService.createNotification({
          recipientId: authorId,
          title: "Зміна статусу програми",
          message: `Статус програми "${program.title}" змінено на: ${statusText}.`,
          type: "SYSTEM_INFO",
          link: `/programs/${program._id}`,
          sendEmail: false,
        });
      }
    } catch (error) {
      console.error(
        "Помилка при надсиланні сповіщень про зміну статусу:",
        error,
      );
    }

    return program;
  }

  async update(id, programData) {
    const ProgramModel = this.getProgramModel();
    const updatedProgram = await ProgramModel.findByIdAndUpdate(
      id,
      { $set: programData },
      { new: true },
    );
    if (!updatedProgram) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }
    return updatedProgram;
  }

  async delete(id) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(id);

    if (!program) {
      const error = new Error("Програму не знайдено");
      error.statusCode = 404;
      throw error;
    }

    await projectService.handleProgramDeletion([id]);

    await ProgramModel.findByIdAndDelete(id);
    return program;
  }

  async handleDeadlineReached(programId) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(programId);

    if (!program) return;

    program.active = false;
    await program.save();

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

      for (const authorId of authorIds) {
        await notificationService.createNotification({
          recipientId: authorId,
          title: "Завершення дедлайну програми",
          message: `Дедлайн прийому заявок для програми "${program.title}" завершився. Прийом заявок закрито.`,
          type: "SYSTEM_INFO",
          link: `/programs/${program._id}`,
          sendEmail: true,
        });
      }
    } catch (error) {
      console.error("Помилка при надсиланні сповіщень про дедлайн:", error);
    }

    const trashProjects = await ProjectModel.find({
      programId: programId,
      status: "Відхилено",
    }).select("_id");

    if (trashProjects.length > 0) {
      for (const proj of trashProjects) {
        await projectService.clearRejectedProjectFiles(proj._id);
      }
    }

    console.log(
      `Дедлайн програми ${programId}. Файли відхилених робіт видалено з Cloudinary. Картки та активні проєкти збережено.`,
    );
  }

  async finalCleanupAndClose(programId) {
    const ProgramModel = this.getProgramModel();
    const program = await ProgramModel.findById(programId);

    if (!program) return;

    const ProjectModel = mongoose.model("Project");

    const nonApprovedProjects = await ProjectModel.find({
      programId: programId,
      status: { $ne: "Прийнято" },
    }).select("_id authorId");

    if (nonApprovedProjects.length > 0) {
      for (const proj of nonApprovedProjects) {
        await projectService.clearRejectedProjectFiles(proj._id);
      }
    }

    program.active = false;
    await program.save();

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

      for (const authorId of authorIds) {
        await notificationService.createNotification({
          recipientId: authorId,
          title: "Програму закрито",
          message: `Програму "${program.title}" закрито адміністратором.`,
          type: "SYSTEM_INFO",
          link: `/programs/${program._id}`,
          sendEmail: true,
        });
      }
    } catch (error) {
      console.error(
        "Помилка при надсиланні сповіщень про закриття програми:",
        error,
      );
    }

    console.log(
      `Програму ${programId} примусово закрито суперадміном. Неприйняті файли видалено з Cloudinary, картки збережено для історії.`,
    );
  }
}

module.exports = new ProgramService();
