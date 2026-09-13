const Notification = require("../models/Notification");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class NotificationService {
  async #sendEmailNotification(toEmail, userName, title, message, link) {
    if (!toEmail || !process.env.EMAIL_USER) return;

    const fullLink = link
      ? `${process.env.FRONTEND_URL || "http://localhost:5173"}${link}`
      : null;

    const mailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 40px 12px; }
          .container { max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b; }
          .logo { font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #f8fafc; text-decoration: none; }
          .brand { color: #8b5cf6; }
          .content { padding: 24px 0; }
          .title { font-size: 16px; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
          .text { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .button-wrapper { text-align: center; margin: 28px 0; }
          .button { background-color: #8b5cf6; color: #ffffff !important; padding: 12px 28px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; border-radius: 8px; display: inline-block; transition: background-color 0.2s; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 10px; color: #64748b; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">Science<span class="brand">Platform</span></span>
          </div>
          
          <div class="content">
            <div class="title">${title}</div>
            <p class="text">
              Вітаємо${userName ? `, <strong>${userName}</strong>` : ""}!<br><br>
              ${message}
            </p>
            
            ${
              fullLink
                ? `<div class="button-wrapper">
                    <a href="${fullLink}" class="button" target="_blank">Перейти на платформу</a>
                  </div>`
                : ""
            }
          </div>

          <div class="footer">
            Це автоматичне сповіщення від платформи SciencePlatform.<br>
            Будь ласка, не відповідайте на цей лист.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"Science Platform" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `${title} | SciencePlatform`,
        html: mailHtml,
      });
    } catch (err) {
      console.error(`Помилка надсилання Email для ${toEmail}:`, err);
    }
  }

  async createNotification({
    recipientId,
    userId,
    title,
    message,
    type,
    link,
    sendEmail = true,
  }) {
    const targetUserId = recipientId || userId;

    if (!targetUserId || !title || !message) {
      throw new Error("Недостатньо даних для створення сповіщення");
    }

    const notification = await Notification.create({
      recipientId: targetUserId,
      title,
      message,
      type: type || "SYSTEM_INFO",
      link: link || "",
    });

    if (sendEmail) {
      try {
        const user = await User.findById(targetUserId).select("email name");
        if (user && user.email) {
          this.#sendEmailNotification(
            user.email,
            user.name,
            title,
            message,
            link,
          );
        }
      } catch (err) {
        console.error("Помилка при пошуку користувача для Email:", err);
      }
    }

    return notification;
  }

  async sendSystemBroadcast({ title, message, link, senderId }) {
    if (!title || !message) {
      throw new Error("Вкажіть заголовок та текст системного сповіщення");
    }

    const users = await User.find({
      isAnonymized: false,
      isBanned: false,
    }).select("_id email name");

    if (users.length === 0) {
      return { count: 0, message: "Немає активних користувачів для розсилки" };
    }

    const notificationsDocs = users.map((u) => ({
      recipientId: u._id,
      title: title.trim(),
      message: message.trim(),
      type: "SYSTEM_BROADCAST",
      link: link || "",
    }));

    await Notification.insertMany(notificationsDocs);

    const BATCH_SIZE = 10;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((u) => {
          if (u.email) {
            return this.#sendEmailNotification(
              u.email,
              u.name,
              title,
              message,
              link,
            );
          }
          return Promise.resolve();
        }),
      );
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `Суперадмін (${senderId}) розіслав системне сповіщення та пошту для ${users.length} користувачів.`,
    );

    return {
      success: true,
      count: users.length,
      message: `Системне сповіщення та email-розсилка успішно надіслані ${users.length} користувачам`,
    };
  }

  async getUserNotifications(userId, page = 1, limit = 5) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipientId: userId });
    const totalPages = Math.ceil(total / limit) || 1;

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return {
      notifications,
      unreadCount,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true } },
      { new: true },
    );

    if (!notification) {
      const error = new Error("Сповіщення не знайдено");
      error.statusCode = 404;
      throw error;
    }

    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } },
    );

    return { success: true, message: "Усі сповіщення позначено як прочитані" };
  }

  async clearAllNotifications(userId) {
    await Notification.deleteMany({ recipientId: userId });
    return { success: true, message: "Усі сповіщення успішно видалено" };
  }
}

module.exports = new NotificationService();
