const organizationService = require("../services/organizationService");

class OrganizationController {
  async getOrganizationUsers(req, res, next) {
    try {
      const id = req.params.id || req.params.orgId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const isSuperAdmin = req.user.role === "superadmin";
      const userOrgId = req.user.organizationId;

      const isMemberOfOrg =
        userOrgId && String(userOrgId._id || userOrgId) === String(id);

      if (!isSuperAdmin && !isMemberOfOrg) {
        return res.status(403).json({
          error: "Доступ заборонено: ви не належите до цієї установи",
        });
      }

      const result = await organizationService.getOrganizationUsers(
        id,
        page,
        limit,
      );

      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getOrganizationPrograms(req, res, next) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const result = await organizationService.getOrganizationPrograms(
        id,
        page,
        limit,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;

      const filters = {
        status: req.query.status,
        search: req.query.search,
        type: req.query.type,
        city: req.query.city,
        scientificDomains: req.query.scientificDomains,
      };

      const result = await organizationService.getAll(filters, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPublicList(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        city: req.query.city,
        scientificDomains: req.query.scientificDomains,
        search: req.query.search,
      };

      const list = await organizationService.getPublicList(filters);
      res.json(list);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const org = await organizationService.getById(req.params.id);
      res.json(org);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const {
        name,
        edrpou,
        description,
        website,
        email,
        type,
        legalForm,
        city,
      } = req.body;

      if (!name || !edrpou) {
        return res
          .status(400)
          .json({ error: "Назва установи та код ЄДРПОУ є обов'язковими" });
      }

      let scientificDomains = [];
      if (req.body.scientificDomains) {
        try {
          scientificDomains =
            typeof req.body.scientificDomains === "string"
              ? JSON.parse(req.body.scientificDomains)
              : req.body.scientificDomains;
        } catch (e) {
          scientificDomains = Array.isArray(req.body.scientificDomains)
            ? req.body.scientificDomains
            : [req.body.scientificDomains];
        }
      }

      const logoUrl = req.file ? req.file.path : null;

      const organizationData = {
        name,
        edrpou,
        description,
        website,
        email,
        type,
        legalForm,
        city,
        scientificDomains,
        logo: logoUrl,
      };

      const newOrg = await organizationService.create(
        req.user.id,
        organizationData,
      );
      res.status(201).json(newOrg);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const updatedOrg = await organizationService.update(
        id,
        req.body,
        req.file,
      );

      res.json({
        message: "Дані організації успішно оновлено",
        organization: updatedOrg,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Невалідний статус модерації" });
      }

      const updatedOrg = await organizationService.updateStatus(
        req.params.id,
        status,
      );
      res.json(updatedOrg);
    } catch (err) {
      next(err);
    }
  }

  async joinRequest(req, res, next) {
    try {
      const { organizationId } = req.body;
      if (!organizationId) {
        return res.status(400).json({ error: "ID установи не передано" });
      }
      await organizationService.requestToJoin(organizationId, req.user.id);
      res.json({ message: "Запит на вступ успішно надіслано" });
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "ID користувача є обов'язковим" });
      }

      const adminOrgId =
        req.body?.organizationId ||
        req.query?.organizationId ||
        req.params?.id ||
        req.user.organizationId;

      if (!adminOrgId) {
        return res.status(403).json({
          error:
            "Ви не належите до жодної установи та не вказали organizationId",
        });
      }

      await organizationService.acceptJoinRequest(adminOrgId, userId);
      res.json({ message: "Користувача успішно зараховано до установи" });
    } catch (err) {
      next(err);
    }
  }

  async rejectRequest(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "ID користувача є обов'язковим" });
      }

      const adminOrgId =
        req.body?.organizationId ||
        req.query?.organizationId ||
        req.params?.id ||
        req.user.organizationId;

      if (!adminOrgId) {
        return res.status(403).json({
          error:
            "Ви не належите до жодної установи та не вказали organizationId",
        });
      }

      await organizationService.rejectJoinRequest(adminOrgId, userId);
      res.json({ message: "Запит на вступ відхилено" });
    } catch (err) {
      next(err);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const { id: orgId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const search = req.query.search || "";

      let adminOrgId =
        req.user.role === "superadmin"
          ? orgId || req.user.organizationId
          : req.user.organizationId;

      if (!adminOrgId) {
        return res
          .status(403)
          .json({ error: "Ви не належите до жодної установи" });
      }

      const result = await organizationService.getPagedPendingRequests(
        adminOrgId,
        { page, limit, search },
      );

      res.json({
        items: result.items,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      });
    } catch (err) {
      next(err);
    }
  }

  async leave(req, res, next) {
    try {
      await organizationService.leaveOrganization(req.user.id);
      res.json({ message: "Ви успішно вийшли зі складу наукової установи" });
    } catch (err) {
      next(err);
    }
  }

  async kick(req, res, next) {
    try {
      const { id: orgId } = req.params;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res
          .status(400)
          .json({ error: "ID цільового користувача є обов'язковим" });
      }

      const adminOrgId =
        req.user.role === "superadmin"
          ? orgId || req.user.organizationId
          : req.user.organizationId;

      if (!adminOrgId) {
        return res
          .status(403)
          .json({ error: "Ви не належите до жодної установи" });
      }

      await organizationService.kickMember(adminOrgId, req.user, targetUserId);

      res.json({ message: "Користувача успішно виключено з організації" });
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const { id: paramOrgId, userId: targetUserId } = req.params;
      const { role, academicDegree, allowedDomains, allowedTypes } = req.body;

      const validRoles = ["user", "reviewer", "content-manager", "admin"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: "Передано некоректну роль" });
      }

      const rawOrgId = paramOrgId || req.user.organizationId;
      const cleanOrgId = rawOrgId?._id
        ? rawOrgId._id.toString()
        : rawOrgId?.toString();

      if (!cleanOrgId) {
        return res
          .status(400)
          .json({ error: "Ідентифікатор організації відсутній" });
      }

      const updatedUser = await organizationService.updateMemberRole(
        cleanOrgId,
        req.user.id,
        targetUserId,
        role,
        {
          academicDegree,
          allowedDomains,
          allowedTypes,
        },
      );

      res.json({
        message: "Роль користувача та параметри рецензування успішно оновлено",
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }

  async transferOrgOwnership(req, res, next) {
    try {
      const { id: orgId } = req.params;
      const { newOwnerId } = req.body;

      if (!newOwnerId) {
        return res
          .status(400)
          .json({ error: "ID нового власника є обов'язковим" });
      }

      await organizationService.transferOwnership(
        orgId,
        req.user.id,
        newOwnerId,
      );

      res.json({ message: "Права власності на установу успішно передано!" });
    } catch (err) {
      next(err);
    }
  }

  toggleVerified = async (req, res, next) => {
    try {
      const updatedOrg = await organizationService.toggleVerified(
        req.params.id,
      );
      if (!updatedOrg) {
        return res.status(404).json({ message: "Установу не знайдено" });
      }
      return res.json({
        success: true,
        message: `Статус верифікації змінено на ${updatedOrg.isVerified}`,
        organization: updatedOrg,
      });
    } catch (err) {
      if (typeof next === "function") return next(err);
      return res
        .status(500)
        .json({ message: err.message || "Серверна помилка" });
    }
  };

  toggleFeatured = async (req, res, next) => {
    try {
      const updatedOrg = await organizationService.toggleFeatured(
        req.params.id,
      );
      if (!updatedOrg) {
        return res.status(404).json({ message: "Установу не знайдено" });
      }
      return res.json({
        success: true,
        message: `Статус рекомендування (Featured) змінено на ${updatedOrg.isFeatured}`,
        organization: updatedOrg,
      });
    } catch (err) {
      if (typeof next === "function") return next(err);
      return res
        .status(500)
        .json({ message: err.message || "Серверна помилка" });
    }
  };

  async delete(req, res, next) {
    try {
      await organizationService.deleteOrganization(
        req.params.id,
        req.user.id,
        req.user.role,
      );
      res.json({ message: "Організацію успішно видалено" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationController();
