const superadminService = require("../services/superadminService");
const notificationService = require("../services/notificationService");

class SuperadminController {
  async getAnalytics(req, res, next) {
    try {
      const data = await superadminService.getFullDashboardAnalytics();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async sendBroadcast(req, res, next) {
    try {
      const { title, message, link } = req.body;
      const result = await notificationService.sendSystemBroadcast({
        title,
        message,
        link,
        senderId: req.user.id,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPrograms(req, res, next) {
    try {
      const data = await superadminService.getProgramsList(req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SuperadminController();
