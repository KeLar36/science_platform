const mongoose = require("mongoose");

const AUDIT_CATEGORIES = [
  "AUTH", // Вхід, вихід, зміна пароля, відхилення токена
  "PROJECT", // Подання, завантаження v2/v3, зміна статусу
  "REVIEW", // Призначення kr, винесення рецензії, конфлікт інтересів
  "PROGRAM", // Створення/редагування конкурсу чи журналу
  "ORGANIZATION", // Верифікація за ЄДРПОУ, зміна членів
  "USER_MGMT", // Зміна ролей, зміна allowedDomains, бан/розбан
  "SYSTEM", // Авто-перерозподіл, фонові тригери
];

const AUDIT_SEVERITY = ["info", "warning", "security", "critical"];

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },
      email: { type: String, default: "SYSTEM_PROCESS" },
      role: { type: String, default: "system" },
      ipAddress: { type: String, default: "" },
      userAgent: { type: String, default: "" },
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: AUDIT_CATEGORIES,
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: AUDIT_SEVERITY,
      default: "info",
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    targetEntity: {
      entityType: {
        type: String,
        required: true,
        index: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      entityName: { type: String, default: "" },
    },

    payload: {
      previousState: { type: mongoose.Schema.Types.Mixed, default: null },
      newState: { type: mongoose.Schema.Types.Mixed, default: null },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    isBlindProtected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, severity: 1 });
auditLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 31536000,
    partialFilterExpression: { severity: "info" },
  },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
