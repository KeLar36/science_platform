const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Пароль обов'язковий"],
      minLength: [8, "Пароль має бути не менше 8 символів"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxLength: 500,
    },
    topics: {
      type: [String],
      default: [],
    },
    city: {
      type: String,
      trim: true,
    },
    socials: {
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedIn: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["Online", "Away", "Offline"],
      default: "Offline",
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    bookmarks: { type: [String], default: [] },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin", "reviewer", "content-manager"],
      default: "user",
    },
    isBanned: { type: Boolean, default: false },
    isAnonymized: { type: Boolean, default: false },
  },
  {
    collection: "users",
    timestamps: true,
    discriminatorKey: "role",
  },
);

UserSchema.index({ role: 1, isBanned: 1, allowedDomains: 1, allowedTypes: 1 });
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

const ReviewerDiscriminator = User.discriminator(
  "reviewer",
  new mongoose.Schema({
    academicDegree: {
      type: String,
      enum: [
        "Немає / Дослідник",
        "Кандидат наук / PhD",
        "Доктор наук",
        "Доцент",
        "Професор",
        "Інше",
      ],
      default: "Немає / Дослідник",
    },
    allowedDomains: {
      type: [String],
      default: [],
    },
    allowedTypes: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          if (!Array.isArray(v) || v.length === 0) return true;
          const Program = mongoose.model("Program");
          const validTypes = Object.keys(Program.discriminators || {});
          return v.every((type) => validTypes.includes(type));
        },
        message: "Обраний тип програми не існує в системній моделі програм!",
      },
    },
    isReviewerActive: {
      type: Boolean,
      default: true,
    },
  }),
);

module.exports = User;
