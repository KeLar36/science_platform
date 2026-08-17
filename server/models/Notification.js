const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Заголовок сповіщення є обов'язковим"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Текст сповіщення є обов'язковим"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "ORG_JOIN_APPROVED",
        "ORG_JOIN_REJECTED",
        "ORG_CREATED_APPROVED",
        "ORG_CREATED_REJECTED",
        "PROJECT_CREATED",
        "PROJECT_ASSIGNED",
        "PROJECT_REVIEWED",
        "PROJECT_STATUS_CHANGED",
        "POST_COMMENT",
        "SYSTEM_BROADCAST",
        "SYSTEM_INFO",
      ],
      default: "SYSTEM_INFO",
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
