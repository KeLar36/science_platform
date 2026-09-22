const AuditLog = require("../models/AuditLog");
const notificationService = require("./notificationService");

class AuditService {
  static sanitizePayload(data) {
    if (!data || typeof data !== "object") return data;

    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = [
      "password",
      "token",
      "refreshToken",
      "creditCard",
      "ssn",
    ];

    const cleanObject = (obj) => {
      for (const key in obj) {
        if (sensitiveKeys.includes(key.toLowerCase())) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          cleanObject(obj[key]);
        }
      }
    };

    cleanObject(sanitized);
    return sanitized;
  }

  static async log({
    req = null,
    action,
    category,
    severity = "info",
    targetEntity,
    payload = {},
    organizationId = null,
    isBlindProtected = false,
    notify = false,
    notificationData = null,
  }) {
    try {
      let actor = {
        userId: null,
        email: "SYSTEM_PROCESS",
        role: "system",
        ipAddress: "",
        userAgent: "",
      };

      if (req) {
        actor.userId = req.user?._id || req.user?.id || null;
        actor.email = req.user?.email || "ANONYMOUS_USER";
        actor.role = req.user?.role || "guest";
        actor.ipAddress =
          req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "";
        actor.userAgent = req.headers?.["user-agent"] || "";
      }

      const orgId =
        organizationId ||
        req?.user?.organizationId ||
        payload?.newState?.organizationId ||
        null;

      const cleanPayload = {
        previousState: this.sanitizePayload(payload.previousState || null),
        newState: this.sanitizePayload(payload.newState || null),
        metadata: this.sanitizePayload(payload.metadata || {}),
      };

      const auditEntry = await AuditLog.create({
        actor,
        action,
        category,
        severity,
        organizationId: orgId,
        targetEntity: {
          entityType: targetEntity?.entityType || "Unknown",
          entityId: targetEntity?.entityId || null,
          entityName: targetEntity?.entityName || "",
        },
        payload: cleanPayload,
        isBlindProtected,
      });

      if (notify && notificationData && notificationService) {
        await notificationService
          .createNotification(notificationData)
          .catch((err) => {
            console.error("Audit -> Notification Dispatch Error:", err.message);
          });
      }

      return auditEntry;
    } catch (error) {
      console.error("CRITICAL: Failed to write AuditLog:", error.message);
      return null;
    }
  }

  static async getLogs({
    page = 1,
    limit = 20,
    organizationId = null,
    category = null,
    severity = null,
    action = null,
    entityType = null,
    search = "",
  }) {
    const query = {};

    if (organizationId) query.organizationId = organizationId;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (action) query.action = action;
    if (entityType) query["targetEntity.entityType"] = entityType;

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { "actor.email": { $regex: search, $options: "i" } },
        { "targetEntity.entityName": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, totalItems] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("actor.userId", "name email role image")
        .populate("organizationId", "name code")
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
    };
  }
}

module.exports = AuditService;
