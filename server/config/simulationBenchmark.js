require("dotenv").config();
const mongoose = require("mongoose");
const { performance } = require("perf_hooks");

const User = require("../models/User");
const Program = require("../models/Program");
const Project = require("../models/Project");
const Organization = require("../models/Organization");

const projectService = require("../services/projectService");
const userService = require("../services/userService");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/science_platform_benchmark";

const TEST_DOMAIN = "Математика та комп'ютерні науки";
const TEST_PROGRAM_TYPE = "Стаття";

async function runSafeBenchmark() {
  try {
    console.log("[1/5] Підключення до бази даних...");
    await mongoose.connect(MONGO_URI);

    await Project.deleteMany({ title: { $regex: /^Бенчмарк-Тест/ } });

    console.log(
      "[2/5] Перевірка тестової інфраструктури (суперадміни та існуючі користувачі НЕ видаляються)...",
    );

    let anyUser = await User.findOne({ isAnonymized: false });
    if (!anyUser) {
      console.log("⚙️  Акаунтів не знайдено, створюємо тестового автора...");
      anyUser = new User({
        name: "Бенчмарк Тестовий Автор",
        email: "benchmark_author@test.local",
        password: "BenchmarkPassword123!",
        role: "user",
      });
      await anyUser.save();
    }

    let org = await Organization.findOne({ name: "Бенчмарк Тестовий НДІ" });
    if (!org) {
      org = new Organization({
        name: "Бенчмарк Тестовий НДІ",
        edrpou: "99999999",
        city: "Ужгород",
        creatorId: anyUser._id,
        status: "approved",
        isVerified: true,
        scientificDomains: [TEST_DOMAIN],
      });
      await org.save();
    }

    let program = await Program.findOne({
      title: "Бенчмарк Журнал з комп'ютерних наук",
    });
    if (!program) {
      program = new Program.ArticleProgram({
        title: "Бенчмарк Журнал з комп'ютерних наук",
        description: "Тестова програма для автоматичного вимірювання швидкодії",
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        domain: TEST_DOMAIN,
        organizationId: org._id,
        createdBy: anyUser._id,
        active: true,
        doi: "10.9999/benchmark.2026",
      });
      await program.save();
    }

    let benchmarkReviewers = await User.find({
      email: { $regex: /^benchmark_reviewer_/ },
    });

    if (benchmarkReviewers.length < 50) {
      const needed = 50 - benchmarkReviewers.length;
      console.log(
        `Створюємо ${needed} ізольованих рецензентів для бенчмарку...`,
      );

      const newReviewers = [];
      for (let i = benchmarkReviewers.length + 1; i <= 50; i++) {
        newReviewers.push({
          name: `Бенчмарк Рецензент #${i}`,
          email: `benchmark_reviewer_${i}@test.local`,
          password: "BenchmarkPassword123!",
          role: "reviewer",
          organizationId: org._id,
          isBanned: false,
          isReviewerActive: true,
          academicDegree: "Кандидат наук / PhD",
          allowedDomains: [TEST_DOMAIN],
          allowedTypes: [TEST_PROGRAM_TYPE],
        });
      }
      await User.insertMany(newReviewers);
      benchmarkReviewers = await User.find({
        email: { $regex: /^benchmark_reviewer_/ },
      });
    }

    console.log(
      `Готово: Використовується ${benchmarkReviewers.length} рецензентів у галузі "${TEST_DOMAIN}".`,
    );

    // --------------------------------------------------------------------------
    console.log(
      "\n [3/5] ПОЧАТОК ЕКСПЕРИМЕНТУ: Послідовне створення та відбір для 1000 праць...",
    );
    const executionTimes = [];
    const createdProjectIds = [];

    for (let j = 1; j <= 10000; j++) {
      const projectData = {
        title: `Бенчмарк-Тест Наукова Робота #${j}`,
        description: `Автоматичне оцінювання продуктивності алгоритму призначення #${j}`,
        domain: TEST_DOMAIN,
        authorId: anyUser._id,
        programId: program._id,
        versions: [
          {
            fileUrl: `https://res.cloudinary.com/demo/image/upload/v1/benchmark_${j}.pdf`,
            fileName: `benchmark_article_${j}.pdf`,
          },
        ],
      };

      const startTime = performance.now();

      const createdProject = await projectService.create(projectData);

      const endTime = performance.now();

      executionTimes.push(endTime - startTime);
      createdProjectIds.push(createdProject._id);
    }

    const totalTime = executionTimes.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / executionTimes.length;
    const minTime = Math.min(...executionTimes);
    const maxTime = Math.max(...executionTimes);

    const variance =
      executionTimes.reduce((acc, t) => acc + Math.pow(t - avgTime, 2), 0) /
      executionTimes.length;
    const stdDev = Math.sqrt(variance);

    // --------------------------------------------------------------------------
    console.log(
      "\n [4/5] ТЕСТУВАННЯ МЕХАНІЗМУ КАСКАДНОГО ОЧИЩЕННЯ (updateBanStatus)...",
    );

    const targetReviewers = benchmarkReviewers.slice(0, 5);

    const cascadeStartTime = performance.now();

    for (const rev of targetReviewers) {
      await userService.updateBanStatus(rev._id, true);
    }

    const cascadeEndTime = performance.now();
    const cascadeDuration = cascadeEndTime - cascadeStartTime;

    const unassignedCount = await Project.countDocuments({
      _id: { $in: createdProjectIds },
      reviewerId: null,
      reviewStatus: "Не призначено",
    });

    console.log(
      "\n================  ОТРИМАНІ МЕТРИКИ ДЛЯ СТАТТІ ================",
    );
    console.log(`• Обсяг тестової вибірки: 10000 наукових праць`);
    console.log(`• Галузь / Тип: "${TEST_DOMAIN}" / "${TEST_PROGRAM_TYPE}"`);
    console.log(`• Кількість активних експертів: 50 осіб`);
    console.log(
      `• Загальний час обробки (Total Time): ${totalTime.toFixed(2)} мс`,
    );
    console.log(
      `• Середній час на 1 призначення (τ_avg): ${avgTime.toFixed(2)} мс`,
    );
    console.log(
      `• Мінімальний / Максимальний час: ${minTime.toFixed(2)} мс / ${maxTime.toFixed(2)} мс`,
    );
    console.log(`• Стандартне відхилення (σ): ${stdDev.toFixed(2)} мс`);

    console.log(
      "\n================ 🛡️ МЕТРИКИ КАСКАДНОГО ОЧИЩЕННЯ ================",
    );
    console.log(`• Кількість заблокованих рецензентів: 5 акаунтів`);
    console.log(
      `• Час каскадного скидання завдань: ${cascadeDuration.toFixed(2)} мс`,
    );
    console.log(`• Кількість повернених у чергу робіт: ${unassignedCount} од.`);

    for (const rev of targetReviewers) {
      await userService.updateBanStatus(rev._id, false);
    }

    await Project.deleteMany({ title: { $regex: /^Бенчмарк-Тест/ } });
    console.log("\n [5/5] Тимчасові тестові проєкти прибрано. База в безпеці!");
  } catch (error) {
    console.error(" Помилка під час бенчмарку:", error);
  } finally {
    await mongoose.disconnect();
    console.log(" Експеримент успішно завершено.");
  }
}

runSafeBenchmark();
