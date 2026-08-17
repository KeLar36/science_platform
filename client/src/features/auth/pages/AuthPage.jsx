import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/lib/context/AuthContext";
import { ChevronLeft, Sparkles } from "lucide-react";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Tabs from "@/shared/ui/Tabs";
import { useAuthForms } from "@/features/auth/hooks/useAuthForms";
import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  const {
    isSubmitting,
    error,
    successMessage,
    isResetSuccess,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleForgotSubmit,
    handleResetSubmit,
  } = useAuthForms();

  useEffect(() => {
    if (user && !loading) navigate("/profile");
  }, [user, loading, navigate]);

  const currentPath = location.pathname;
  const isResetMode = currentPath.startsWith("/reset-password");
  const isForgotMode = currentPath === "/forgot-password";
  const isHubMode = currentPath === "/login" || currentPath === "/register";
  const activeTab = currentPath === "/register" ? "register" : "login";

  const authTabs = [
    { id: "login", label: "Вхід у кабінет" },
    { id: "register", label: "Створити профіль" },
  ];

  const handleTabChange = (tabId) => {
    navigate(tabId === "register" ? "/register" : "/login");
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 z-0 pointer-events-none bg-[radial-gradient(var(--color-text-muted)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div
          className={`w-full relative z-10 transition-all duration-300 ${
            activeTab === "register" && isHubMode ? "max-w-xl" : "max-w-md"
          }`}
          data-aos="fade-up"
        >
          {!isResetMode && (
            <button
              onClick={() => (isHubMode ? navigate("/") : navigate("/login"))}
              className="flex items-center gap-2 text-text-muted hover:text-brand text-[10px] font-bold uppercase tracking-widest mb-6 transition-all group bg-transparent border-none cursor-pointer font-mono"
            >
              <ChevronLeft
                size={14}
                className="group-hover:-translate-x-1 transition-transform"
              />
              {isHubMode ? "На головну" : "Назад до входу"}
            </button>
          )}

          <div className="bg-bg-secondary border border-border-color p-8 md:p-10 shadow-popup relative rounded-lg">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-brand/30" />

            {isHubMode && (
              <div className="mb-6">
                <Tabs
                  tabs={authTabs}
                  activeTab={activeTab}
                  onChange={handleTabChange}
                />
              </div>
            )}

            {isHubMode && activeTab === "login" && (
              <LoginForm
                onSubmit={handleLoginSubmit}
                isSubmitting={isSubmitting}
                error={error}
                onForgotPasswordClick={() => navigate("/forgot-password")}
              />
            )}

            {isHubMode && activeTab === "register" && (
              <RegisterForm
                onSubmit={handleRegisterSubmit}
                isSubmitting={isSubmitting}
                error={error}
              />
            )}

            {isForgotMode && (
              <ForgotPasswordForm
                onSubmit={handleForgotSubmit}
                isSubmitting={isSubmitting}
                error={error}
                successMessage={successMessage}
                onBackToLoginClick={() => navigate("/login")}
              />
            )}

            {isResetMode && (
              <ResetPasswordForm
                onSubmit={handleResetSubmit}
                isSubmitting={isSubmitting}
                isSuccess={isResetSuccess}
                error={error}
                onBackToLoginClick={() => navigate("/login")}
              />
            )}
          </div>

          {isForgotMode && (
            <div className="mt-6 flex justify-center animate-reveal">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-color rounded shadow-sm">
                <Sparkles size={12} className="text-brand" />
                <span className="text-[9px] font-mono uppercase tracking-tight text-text-muted">
                  SciencePlatform Security
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
