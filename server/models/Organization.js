const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Назва організації є обов'язковою"],
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
        "ДУ/КЗ", // Державна установа / Комунальний заклад (університети, класичні НДІ)
        "КНП", // Комунальне некомерційне підприємство (університетські клініки, лікарні)
        "ДП", // Державне підприємство (науково-виробничі комплекси, бюро)
        "ТОВ", // Товариство з обмеженою відповідальністю (приватні лабораторії, видавництва)
        "ФОП", // Фізична особа-підприємець (окремі незалежні дослідники, розробники)
        "ГО", // Громадська організація (наукові спілки, академії наук як громадські об'єднання)
        "БФ/БО", // Благодійний фонд / Благодійна організація (грантові спонсори)
        "ПП", // Приватне підприємство
        "ПрАТ", // Приватне акціонерне товариство
        "АТ", // Акціонерне товариство
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

module.exports = mongoose.model("Organization", OrganizationSchema);
