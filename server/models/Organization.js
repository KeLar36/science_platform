const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Назва організації є обов'язковими"],
      trim: true,
      unique: true,
    },
    edrpou: {
      type: String,
      required: [true, "Код ЄДРПОУ/Ідентифікатор є обов'язковим"],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: [
        "Університет",
        "НДІ",
        "Наукове видавництво",
        "Державна структура",
        "Приватна компанія",
        "Інше",
      ],
      default: "Університет",
    },
    legalForm: {
      type: String,
      enum: [
        "ДУ/КЗ",
        "КНП",
        "ДП",
        "ТОВ",
        "ФОП",
        "ГО",
        "БФ/БО",
        "ПП",
        "ПрАТ",
        "АТ",
        "Інше",
      ],
      default: "ДУ/КЗ",
    },
    scientificDomains: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    city: {
      type: String,
      required: [true, "Місто розташування є обов'язковим"],
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Швидкий пошук організації за її засновником
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    allowPublicJoin: {
      type: Boolean,
      default: true,
    },
    joinRequests: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: "organizations",
  },
);

OrganizationSchema.index({ name: "text", city: "text" });

OrganizationSchema.index({ status: 1, isVerified: 1 });

OrganizationSchema.index({ scientificDomains: 1 });

module.exports = mongoose.model("Organization", OrganizationSchema);
