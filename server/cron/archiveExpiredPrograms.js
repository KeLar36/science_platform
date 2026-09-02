const cron = require("node-cron");
const Program = require("../models/Program");
const programService = require("../services/programService");

const initDeadlineScheduler = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();
      const expiredPrograms = await Program.find({
        active: true,
        deadline: { $lt: now },
      }).select("_id");

      for (const prog of expiredPrograms) {
        await programService.handleDeadlineReached(prog._id);
      }
    } catch (err) {
      console.error(" [CRON] Помилка авто-архівації програм:", err);
    }
  });
};

module.exports = initDeadlineScheduler;
