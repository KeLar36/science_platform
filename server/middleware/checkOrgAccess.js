const mongoose = require("mongoose");

const checkOrgAccess = async (req, res, next) => {
  try {
    if (req.user?.role === "superadmin") return next();

    if (!req.user || !req.user.organizationId) {
      return res.status(403).json({
        error:
          "Ваш профіль не прив'язано до жодної організації. Дія заборонена.",
      });
    }

    const userOrgStr = String(req.user.organizationId);

    const targetId = req.params.id || req.params.orgId;

    if (targetId && req.baseUrl.includes("programs")) {
      const ProgramModel = mongoose.model("Program");
      const program = await ProgramModel.findById(targetId);

      if (!program) {
        return res.status(404).json({ error: "Програму не знайдено" });
      }

      if (
        !program.organizationId ||
        String(program.organizationId) !== userOrgStr
      ) {
        return res.status(403).json({
          error:
            "Ви можете переглядати/редагувати тільки програми вашої організації.",
        });
      }

      return next();
    }

    const targetOrgId =
      req.params.orgId || req.query.organizationId || req.body?.organizationId;

    if (targetOrgId && String(targetOrgId) !== userOrgStr) {
      return res.status(403).json({
        error: "Ви маєте доступ лише до матеріалів вашої організації.",
      });
    }

    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkOrgAccess;
