const mongoose = require("mongoose");

const BaseReviewSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recommendation: {
      type: String,
      required: true,
      enum: [
        "Прийняти без змін",
        "Прийняти після незначних правок",
        "Повторне рецензування (суттєві правки)",
        "Відхилити",
      ],
    },
    hasConflictOfInterest: {
      type: Boolean,
      default: false,
    },
    ethicalCompliance: {
      type: Boolean,
      default: true,
    },
    publicComment: {
      type: String,
      required: [true, "Зауваження для автора є обов'язковими"],
      trim: true,
    },
    privateComment: {
      type: String,
      default: "", // Тільки для редактора / адміна
      trim: true,
    },
    totalScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    discriminatorKey: "programType",
    timestamps: true,
    collection: "reviews",
  },
);

BaseReviewSchema.index({ projectId: 1, reviewerId: 1 }, { unique: true });

const Review =
  mongoose.models.Review || mongoose.model("Review", BaseReviewSchema);

// Хелпер, який гарантовано запобігає повторній компіляції дискримінаторів
const getDiscriminator = (name, schema) => {
  if (Review.discriminators && Review.discriminators[name]) {
    return Review.discriminators[name];
  }
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }
  return Review.discriminator(name, schema);
};

// 1. Науковий журнал
const JournalReview = getDiscriminator(
  "Науковий журнал",
  new mongoose.Schema({
    scores: {
      novelty: { type: Number, min: 1, max: 5, required: true },
      methodology: { type: Number, min: 1, max: 5, required: true },
      abstractQuality: { type: Number, min: 1, max: 5, required: true },
      citationQuality: { type: Number, min: 1, max: 5, required: true },
    },
  }),
);

// 2. Грант
const GrantReview = getDiscriminator(
  "Грант",
  new mongoose.Schema({
    scores: {
      impact: { type: Number, min: 1, max: 5, required: true },
      teamCompetence: { type: Number, min: 1, max: 5, required: true },
      budgetReasoning: { type: Number, min: 1, max: 5, required: true },
      riskManagement: { type: Number, min: 1, max: 5, required: true },
    },
  }),
);

// 3. Конференція
const ConferenceReview = getDiscriminator(
  "Конференція",
  new mongoose.Schema({
    scores: {
      relevance: { type: Number, min: 1, max: 5, required: true },
      originality: { type: Number, min: 1, max: 5, required: true },
      clarity: { type: Number, min: 1, max: 5, required: true },
    },
  }),
);

// 4. Стаття
const ArticleReview = getDiscriminator(
  "Стаття",
  new mongoose.Schema({
    scores: {
      argumentsValidity: { type: Number, min: 1, max: 5, required: true },
      literatureReview: { type: Number, min: 1, max: 5, required: true },
    },
  }),
);

// 5. Датасет
const DatasetReview = getDiscriminator(
  "Датасет",
  new mongoose.Schema({
    scores: {
      dataCompleteness: { type: Number, min: 1, max: 5, required: true },
      documentationQuality: { type: Number, min: 1, max: 5, required: true },
      fairCompliance: { type: Number, min: 1, max: 5, required: true },
    },
  }),
);

// 6. Курс
const CourseReview = getDiscriminator(
  "Курс",
  new mongoose.Schema({
    scores: {
      pedagogicalStructure: { type: Number, min: 1, max: 5, required: true },
      practicalValue: { type: Number, min: 1, max: 5, required: true },
      accessibility: { type: Number, min: 1, max: 5, required: true },
    },
  }),
);

Review.JournalReview = JournalReview;
Review.GrantReview = GrantReview;
Review.ConferenceReview = ConferenceReview;
Review.ArticleReview = ArticleReview;
Review.DatasetReview = DatasetReview;
Review.CourseReview = CourseReview;

module.exports = Review;
