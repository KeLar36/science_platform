import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/lib/context/AuthContext";
import { authApi } from "@/features/auth/api/authApi";

export const useAuthForms = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [location.pathname]);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  const formatErrorMessage = (err, fallbackMessage) => {
    const rawMsg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      fallbackMessage;

    if (
      typeof rawMsg === "string" &&
      rawMsg.includes("User validation failed")
    ) {
      const parts = rawMsg.split(":");
      return parts[parts.length - 1]?.trim() || fallbackMessage;
    }

    return rawMsg;
  };

  const handleLoginSubmit = async (email, password) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.login(email, password);
      await checkAuth(true);
      setTimeout(() => navigate("/profile"), 600);
    } catch (err) {
      const errorMsg = formatErrorMessage(err, "Невірний email або пароль");
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.register(formData);
      localStorage.setItem("registeredEmail", formData.email.trim());
      localStorage.setItem(
        "registrationSuccess",
        "Обліковий запис створено! Можна входити.",
      );
      navigate("/login");
    } catch (err) {
      const errorMsg = formatErrorMessage(
        err,
        "Помилка реєстрації. Перевірте введені дані.",
      );
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (email) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await authApi.forgotPassword(email);
      const msg = "Інструкції щодо скидання пароля надіслано на вашу пошту! 📩";
      setSuccessMessage(msg);
    } catch (err) {
      const errorMsg = formatErrorMessage(
        err,
        "Користувача з такою поштою не знайдено",
      );
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (password) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      setIsResetSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const errorMsg = formatErrorMessage(
        err,
        "Токен застарів або некоректний",
      );
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    successMessage,
    isResetSuccess,
    clearError,
    clearSuccess,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleForgotSubmit,
    handleResetSubmit,
  };
};
