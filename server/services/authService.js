const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const notificationService = require("./notificationService");
const auditService = require("./auditService");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to,
    from: `"Science Platform" <${process.env.EMAIL_USER}>`,
    subject,
    text,
    html,
  });
};

class AuthService {
  async register(userData, req = null) {
    const { name, email, password, city, topics, bio } = userData;
    const sanitizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
      // Аудит невдалої спроби реєстрації (дублікат email)
      await auditService.log({
        req,
        action: "USER_REGISTER_FAILED",
        category: "AUTH",
        severity: "warning",
        targetEntity: {
          entityType: "User",
          entityId: null,
          entityName: sanitizedEmail,
        },
        payload: {
          metadata: {
            reason: "Email вже зареєстровано",
            email: sanitizedEmail,
          },
        },
      });

      const error = new Error("Цей Email вже зареєстровано");
      error.statusCode = 400;
      throw error;
    }

    const user = new User({
      name: name.trim(),
      email: sanitizedEmail,
      password,
      city: city || "",
      topics: Array.isArray(topics) ? topics : [],
      bio: bio || "",
      role: "user",
    });

    const savedUser = await user.save();

    await auditService.log({
      req,
      action: "USER_REGISTER",
      category: "AUTH",
      severity: "info",
      targetEntity: {
        entityType: "User",
        entityId: savedUser._id,
        entityName: savedUser.name,
      },
      payload: {
        newState: {
          email: savedUser.email,
          role: savedUser.role,
          city: savedUser.city,
        },
      },
    });

    try {
      await notificationService.createNotification({
        recipientId: savedUser._id,
        title: "Ласкаво просимо на Science Platform!",
        message: `Вітаємо, ${savedUser.name}! Ваш акаунт успішно створено. Доповніть профіль, приєднайтеся до своєї установи або створюйте власні наукові матеріали.`,
        type: "SYSTEM_INFO",
        link: "/profile",
      });
    } catch (notifErr) {
      console.error("Помилка створення вітального сповіщення:", notifErr);
    }

    return savedUser;
  }

  async login(email, password, req = null) {
    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      await auditService.log({
        req,
        action: "USER_LOGIN_FAILED",
        category: "AUTH",
        severity: "security",
        targetEntity: {
          entityType: "User",
          entityId: null,
          entityName: sanitizedEmail,
        },
        payload: {
          metadata: {
            reason: "Користувача не знайдено",
            email: sanitizedEmail,
          },
        },
      });

      const error = new Error("Користувача з таким Email не знайдено");
      error.statusCode = 400;
      throw error;
    }

    if (user.isBanned === true) {
      await auditService.log({
        req,
        action: "USER_LOGIN_FAILED",
        category: "AUTH",
        severity: "security",
        targetEntity: {
          entityType: "User",
          entityId: user._id,
          entityName: user.name,
        },
        payload: {
          metadata: { reason: "Спроба входу в заблокований акаунт" },
        },
      });

      const error = new Error("Ваш акаунт заблоковано");
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await auditService.log({
        req,
        action: "USER_LOGIN_FAILED",
        category: "AUTH",
        severity: "security",
        targetEntity: {
          entityType: "User",
          entityId: user._id,
          entityName: user.name,
        },
        payload: {
          metadata: { reason: "Невірний пароль" },
        },
      });

      const error = new Error("Невірний пароль");
      error.statusCode = 400;
      throw error;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "30d",
    });

    await auditService.log({
      req,
      action: "USER_LOGIN",
      category: "AUTH",
      severity: "info",
      targetEntity: {
        entityType: "User",
        entityId: user._id,
        entityName: user.name,
      },
      organizationId: user.organizationId || null,
      payload: {
        metadata: { role: user.role, email: user.email },
      },
    });

    return { token, user: { id: user._id, name: user.name, role: user.role } };
  }

  async forgotPassword(email, req = null) {
    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      const error = new Error("Користувача не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await auditService.log({
      req,
      action: "PASSWORD_RESET_REQUESTED",
      category: "AUTH",
      severity: "warning",
      targetEntity: {
        entityType: "User",
        entityId: user._id,
        entityName: user.name,
      },
      payload: {
        metadata: { email: user.email },
      },
    });

    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    const mailText = `Вітаємо, ${user.name}!\n\nВи попросили скинути пароль для SciencePlatform.\nПерейдіть за посиланням: ${resetUrl}\n\nЯкщо ви цього не робили, ігноруйте цей лист. Посилання дійсне 1 годину.`;

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
          .link-alt { word-break: break-all; color: #8b5cf6; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">Science<span class="brand">Platform</span></span>
          </div>
          
          <div class="content">
            <div class="title">Відновлення доступу</div>
            <p class="text">
              Вітаємо, <strong>${user.name}</strong>!<br>
              Ми отримали запит на скидання пароля для вашого облікового запису. Натисніть кнопку нижче, щоб задати новий пароль.
            </p>
            
            <div class="button-wrapper">
              <a href="${resetUrl}" class="button" target="_blank">Відновити пароль</a>
            </div>

            <p class="text" style="font-size: 11px; margin-bottom: 8px;">
              Якщо кнопка не працює, скопіюйте це посилання у браузер:
            </p>
            <p class="text"><a href="${resetUrl}" class="link-alt">${resetUrl}</a></p>
          </div>

          <div class="footer">
            Посилання дійсне протягом 60 хвилин.<br>
            Якщо ви не запитували зміну пароля, просто ігноруйте цей лист.
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      user.email,
      "Відновлення пароля | SciencePlatform",
      mailText,
      mailHtml,
    );
  }

  async resetPassword(token, newPassword, req = null) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error("Токен недійсний або його термін дії вичерпано");
      error.statusCode = 400;
      throw error;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await auditService.log({
      req,
      action: "PASSWORD_RESET_COMPLETED",
      category: "AUTH",
      severity: "security",
      targetEntity: {
        entityType: "User",
        entityId: user._id,
        entityName: user.name,
      },
      payload: {
        metadata: { message: "Пароль успішно змінено через токен відновлення" },
      },
    });

    try {
      await notificationService.createNotification({
        recipientId: user._id,
        title: "Пароль оновлено",
        message:
          "Пароль до вашого акаунту було успішно змінено. Якщо ви цього не робили, негайно зверніться до підтримки.",
        type: "SYSTEM_INFO",
        link: "/profile",
      });
    } catch (notifErr) {
      console.error("Помилка створення сповіщення зміни пароля:", notifErr);
    }
  }
}

module.exports = new AuthService();
