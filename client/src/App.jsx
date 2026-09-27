/* eslint-disable react-hooks/exhaustive-deps */
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import ScrollToTop from "@/shared/lib/components/ScrollToTop";
import { AuthProvider } from "@/shared/lib/context/AuthContext";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import Loader from "@/shared/ui/Loader";
const ContentManagerPage = lazy(
  () => import("@/features/content-manager/pages/ContentManagerPage"),
);
const SubmitProjectPage = lazy(
  () => import("@/features/user/pages/SubmitProjectPage"),
);
const CreatePostPage = lazy(
  () => import("@/features/content-manager/pages/CreatePostPage"),
);
const OrganizationDashboardPage = lazy(
  () => import("@/features/organization/pages/OrganizationDashboard"),
);
const OrganizationDetailsPage = lazy(
  () => import("@/features/organization/pages/OrganizationDetails"),
);
const OrganizationsPage = lazy(
  () => import("@/features/organization/pages/OrganizationsPage"),
);
const HomePage = lazy(() => import("@/pages/homePage"));
const AboutPage = lazy(() => import("@/pages/aboutPage"));
const RulesPage = lazy(() => import("@/pages/RulesPage"));
const ArchivePage = lazy(() => import("@/features/projects/pages/ArchivePage"));
const ReviewerPage = lazy(
  () => import("@/features/reviewer/pages/ReviewerPage"),
);
const ProjectDetailPage = lazy(
  () => import("@/features/projects/pages/ProjectDetailPage"),
);
const ProgramsPage = lazy(
  () => import("@/features/programs/pages/ProgramsPage"),
);
const ProgramDetailsPage = lazy(
  () => import("@/features/programs/pages/ProgramDetails"),
);
const Blog = lazy(() => import("@/features/blog/pages/BlogPage"));
const PostDetail = lazy(() => import("@/features/blog/pages/PostDetail"));
const AuthPage = lazy(() => import("@/features/auth/pages/AuthPage"));
const ProfilePage = lazy(() => import("@/features/user/pages/ProfilePage"));

const AdminDashboardPage = lazy(
  () => import("@/features/admin/pages/AdminDashboardPage"),
);
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* ================================================================ */}
          {/* 1. ПУБЛІЧНИЙ ШАР (Вільний доступ для всіх відвідувачів)         */}
          {/* ================================================================ */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:id" element={<ProgramDetailsPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<PostDetail />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route
            path="/organizations/:id"
            element={<OrganizationDetailsPage />}
          />

          {/* ================================================================ */}
          {/* 2. ШАР АВТОРИЗАЦІЇ (Доступні лише неавторизованим)              */}
          {/* ================================================================ */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<AuthPage />} />
          <Route path="/reset-password/:token" element={<AuthPage />} />

          {/* ================================================================ */}
          {/* 3. РУТИ ДЛЯ АВТОРИЗОВАНИХ КОРИСТУВАЧІВ                           */}
          {/* ================================================================ */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/submit"
            element={
              <ProtectedRoute>
                <SubmitProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/dashboard"
            element={
              <ProtectedRoute>
                <OrganizationDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* ================================================================ */}
          {/* 4. СПЕЦІАЛІЗОВАНІ ДАШБОРДИ (Рецензент, Контент, Суперадмін)     */}
          {/* ================================================================ */}
          <Route
            path="/reviewer-dashboard"
            element={
              <ProtectedRoute allowedRoles={["reviewer", "superadmin"]}>
                <ReviewerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["content-manager", "admin", "superadmin"]}
              >
                <ContentManagerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/content-manager/posts/create"
            element={
              <ProtectedRoute
                allowedRoles={["content-manager", "admin", "superadmin"]}
              >
                <CreatePostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-manager/posts/edit/:id"
            element={
              <ProtectedRoute
                allowedRoles={["content-manager", "admin", "superadmin"]}
              >
                <CreatePostPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
