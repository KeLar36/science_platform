const mongoose = require("mongoose");

const checkOrgAccess = async (req, res, next) => {
  try {
    if (req.user.role === "superadmin") return next();

    const userId = req.user._id || req.user.id;
    const User = mongoose.model("User");

    const freshUser = await User.findById(userId).select("organizationId role");

    if (!freshUser || !freshUser.organizationId) {
      return res.status(403).json({
        error:
          "Ваш профіль не прив'язано до жодної організації. Дія заборонена.",
      });
    }

    req.user.organizationId = freshUser.organizationId;

    const targetOrgId =
      req.params.id || req.params.orgId || req.query.organizationId;

    if (
      targetOrgId &&
      String(targetOrgId) !== String(freshUser.organizationId)
    ) {
      return res.status(403).json({
        error: "Ви маєте доступ лише до матеріалів вашої організації.",
      });
    }

    if (req.params.id && req.baseUrl.includes("programs")) {
      const ProgramModel = mongoose.model("Program");
      const program = await ProgramModel.findById(req.params.id);

      if (!program) {
        return res.status(404).json({ error: "Програму не знайдено" });
      }

      if (
        !program.organizationId ||
        String(program.organizationId) !== String(freshUser.organizationId)
      ) {
        return res.status(403).json({
          error: "Ви можете переглядати тільки програми вашої організації",
        });
      }
    }

    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkOrgAccess;
