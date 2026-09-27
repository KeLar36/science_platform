const projectService = require("../services/projectService");

class ProjectController {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const filters = {
        search: req.query.search,
        status: req.query.status,
        domain: req.query.domain,
        reviewStatus: req.query.reviewStatus,
        programId: req.query.programId,
      };

      let result;

      if (req.user.role === "user") {
        result = await projectService.getAuthorProjects(
          req.user.id,
          filters,
          page,
          limit,
        );
      } else if (req.user.role === "reviewer") {
        result = await projectService.getReviewerQueue(
          req.user.id,
          filters,
          page,
          limit,
        );
      } else {
        result = await projectService.getAll(filters, page, limit);
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getOrganizationProjects(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const { orgId } = req.params;

      const filters = {
        search: req.query.search,
        status: req.query.status,
        domain: req.query.domain,
        reviewStatus: req.query.reviewStatus,
        programId: req.query.programId,
      };

      const result = await projectService.getOrganizationProjects(
        orgId,
        filters,
        page,
        limit,
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMyProjects(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const filters = {
        search: req.query.search,
        status: req.query.status,
        domain: req.query.domain,
      };

      const result = await projectService.getAuthorProjects(
        req.user.id,
        filters,
        page,
        limit,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id, req.user);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      res.json(project);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const {
        title,
        description,
        domain,
        programId,
        authorComment,
        metadata,
        accessLevel,
      } = req.body;

      if (!title || !description || !programId) {
        return res.status(400).json({
          message: "Заповніть обов'язкові поля: назва, опис та програма",
        });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Будь ласка, завантажте файл роботи (PDF/Docx)" });
      }

      let parsedMetadata = {};
      if (metadata) {
        try {
          parsedMetadata =
            typeof metadata === "string" ? JSON.parse(metadata) : metadata;
        } catch (e) {
          parsedMetadata = {};
        }
      }

      const initialVersion = {
        fileUrl: req.file.path,
        fileName: req.file.originalname || "document",
        authorComment: authorComment || "Перша версія роботи",
        createdAt: new Date(),
      };

      const projectData = {
        title: title.trim(),
        description: description.trim(),
        domain: domain || "Інше",
        accessLevel: accessLevel || "public",
        authorId: req.user.id,
        programId,
        metadata: parsedMetadata,
        versions: [initialVersion],
      };

      const newProject = await projectService.create(projectData);
      res.status(201).json(newProject);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updatedProject = await projectService.update(
        req.params.id,
        req.body,
      );
      if (!updatedProject) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      res.json(updatedProject);
    } catch (err) {
      next(err);
    }
  }

  async uploadNewVersion(req, res, next) {
    try {
      const { authorComment } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Файл не завантажено" });
      }

      const fileData = {
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        authorComment: authorComment || "",
        createdAt: new Date(),
      };

      const updatedProject = await projectService.addVersion(
        req.params.id,
        fileData,
      );

      if (!updatedProject) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }

      res.json(updatedProject);
    } catch (err) {
      next(err);
    }
  }

  async assignReviewer(req, res, next) {
    try {
      const { reviewerId } = req.body;
      if (!reviewerId) {
        return res.status(400).json({ message: "Не вказано ID рецензента" });
      }

      const updatedProject = await projectService.update(req.params.id, {
        reviewerId,
        reviewStatus: "В процесі",
      });

      res.json(updatedProject);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Не вказано статус проєкту" });
      }

      const updatedProject = await projectService.update(req.params.id, {
        status,
      });
      res.json(updatedProject);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const project = await projectService.getById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }

      const authorId = project.authorId?._id || project.authorId;

      if (
        req.user.role !== "superadmin" &&
        authorId.toString() !== req.user.id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Ви не маєте прав на видалення цього проєкту!" });
      }

      await projectService.delete(req.params.id);
      res.json({ message: "Проєкт та всі його версії успішно видалено" });
    } catch (err) {
      next(err);
    }
  }

  async getArchive(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const filters = {
        search: req.query.search,
        domain: req.query.domain,
      };

      const result = await projectService.getArchive(
        req.user || null,
        filters,
        page,
        limit,
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("💥 Помилка при отриманні архіву:", error);
      next(error);
    }
  }

  async getReviewerQueue(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const filters = {
        search: req.query.search,
        reviewStatus: req.query.reviewStatus,
      };

      const result = await projectService.getReviewerQueue(
        req.user.id,
        filters,
        page,
        limit,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async submitReview(req, res, next) {
    try {
      const {
        scores,
        recommendation,
        publicComment,
        privateComment,
        hasConflictOfInterest,
        ethicalCompliance,
        status,
      } = req.body;

      const reviewerId = req.user.id;

      const result = await projectService.submitReview(
        req.params.id,
        reviewerId,
        {
          scores,
          recommendation,
          publicComment,
          privateComment,
          hasConflictOfInterest,
          ethicalCompliance,
          status,
        },
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getReview(req, res, next) {
    try {
      const review = await projectService.getProjectReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Рецензію ще не додано" });
      }
      res.json(review);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProjectController();
