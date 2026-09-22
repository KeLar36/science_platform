const auditService = require("../services/auditService");

class AuditController {
  async getLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        severity,
        action,
        entityType,
        search,
      } = req.query;

      let organizationId = null;
      if (req.user.role === "superadmin") {
        organizationId = req.query.organizationId || null;
      } else {
        organizationId = req.user.organizationId;
      }

      const result = await auditService.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        organizationId,
        category,
        severity,
        action,
        entityType,
        search,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
