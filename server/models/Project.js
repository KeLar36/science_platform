const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    domain: {
      type: String,
      required: true,
      default: "Інше",
    },

    status: {
      type: String,
      default: "На розгляді",
      enum: ["На розгляді", "Прийнято", "На доопрацюванні", "Відхилено"],
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    programTitle: {
      type: String,
      required: true,
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewerComments: {
      type: String,
      default: "",
    },

    reviewStatus: {
      type: String,
      default: "Не призначено",
      enum: ["Не призначено", "В процесі", "Завершено", "На доопрацюванні"],
    },

    accessLevel: {
      type: String,
      enum: ["public", "restricted", "private"],
      default: "public",
      index: true,
    },

    metadata: {
      type: Object,
      default: {},
    },

    reviewerRecommendation: {
      type: String,
      default: "Немає",
    },

    versions: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String },
        authorComment: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ProjectSchema.virtual("fileUrl").get(function () {
  if (this.versions && this.versions.length > 0) {
    return this.versions[this.versions.length - 1].fileUrl;
  }
  return null;
});

ProjectSchema.virtual("fileName").get(function () {
  if (this.versions && this.versions.length > 0) {
    return this.versions[this.versions.length - 1].fileName;
  }
  return null;
});

module.exports = mongoose.model("Project", ProjectSchema);
