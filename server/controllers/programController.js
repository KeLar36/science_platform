const programService = require("../services/programService");

class ProgramController {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      let activeFilter;
      if (req.query.status === "active") activeFilter = true;
      if (req.query.status === "archived") activeFilter = false;

      const filters = {
        search: req.query.search,
        type: req.query.type !== "Всі типи" ? req.query.type : undefined,
        active: activeFilter,
      };

      if (req.user?.role === "admin" && req.user.organizationId) {
        filters.organizationId = req.user.organizationId;
      }

      const result = await programService.getAll(filters, page, limit);

      return res.status(200).json({
        items: result.programs,
        programs: result.programs,
        currentPage: result.currentPage,
        totalPages: result.totalPages || 1,
        totalItems: result.totalItems || 0,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPublicPrograms(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;

      const filters = {
        active: true,
        search: req.query.search,
        type: req.query.type !== "Всі типи" ? req.query.type : undefined,
      };

      const result = await programService.getAll(filters, page, limit);
      res.json(result);
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
        type: req.query.type !== "Всі типи" ? req.query.type : undefined,
        organizationId:
          req.query.orgId ||
          (req.user?.role === "admin" ? req.user.organizationId : undefined),
      };

      const result = await programService.getArchive(filters, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const program = await programService.getById(req.params.id);
      res.json(program);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const {
        title,
        description,
        deadline,
        domain,
        type,
        orgId,
        ...extraData
      } = req.body;

      if (!title || !description || !deadline || !type) {
        return res.status(400).json({
          error: "Будь ласка, заповніть усі обов'язкові поля, включаючи тип",
        });
      }

      const assignedOrgId =
        req.user.role === "superadmin"
          ? orgId || req.user.organizationId
          : req.user.organizationId;

      const programDataToSave = {
        title,
        description,
        deadline,
        domain,
        createdBy: req.user.id,
        organizationId: assignedOrgId,
        active: true,
        ...extraData,
      };

      const savedProgram = await programService.create(programDataToSave, type);

      res.status(201).json(savedProgram);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updatedProgram = await programService.update(
        req.params.id,
        req.body,
      );
      res.json(updatedProgram);
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const program = await programService.toggleStatus(req.params.id);
      res.json({
        message: `Статус змінено на ${program.active ? "Активний" : "Архівний"}`,
        program,
      });
    } catch (err) {
      next(err);
    }
  }

  async deletePermanent(req, res, next) {
    try {
      await programService.delete(req.params.id);
      res.json({
        message:
          "Програму та всі пов'язані з нею документи успішно видалено назавжди",
      });
    } catch (err) {
      next(err);
    }
  }

  async handleDeadline(req, res, next) {
    try {
      const { id } = req.params;
      await programService.handleDeadlineReached(id);
      res.json({ message: "Прийом заявок зупинено, чернетки очищено." });
    } catch (err) {
      next(err);
    }
  }

  async forceCleanup(req, res, next) {
    try {
      const { id } = req.params;

      await programService.finalCleanupAndClose(id);

      res.json({
        message:
          "Програму остаточно закрито. Неприйняті файли видалено з Cloudinary.",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProgramController();
