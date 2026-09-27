const authService = require("../services/authService");

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: "Будь ласка, заповніть усі обов'язкові поля" });
      }

      await authService.register(req.body, req);
      res.status(201).json({ message: "Користувача успішно створено!" });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Введіть email та пароль" });
      }

      const { token, user } = await authService.login(email, password, req);

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  logout(req, res) {
    res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "lax" });
    res.json({ message: "Вихід із системи успішний" });
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Вкажіть ваш Email" });

      await authService.forgotPassword(email, req);
      res.json({ message: "Лист для відновлення надіслано!" });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { password } = req.body;
      const { token } = req.params;

      await authService.resetPassword(token, password, req);
      res.json({ message: "Пароль успішно змінено!" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
