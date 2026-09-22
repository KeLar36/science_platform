import React, { useState } from "react";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Tabs from "@/shared/ui/Tabs";
import Card from "@/shared/ui/Card";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useAdminData } from "@/features/admin/hooks/useAdminData";
import {
  ShieldAlert,
  Sparkles,
  LayoutDashboard,
  Crown,
  FolderKanban,
  Building2,
  FileText,
  Users,
  UserCheck,
  Shield,
} from "lucide-react";

import SuperadminOverviewTab from "@/features/admin/components/SuperadminOverviewTab";
import SuperadminDangerZoneTab from "@/features/admin/components/SuperadminDangerZoneTab";
import SuperadminProgramsTab from "@/features/admin/components/SuperadminProgramsTab";
import SuperadminOrganizationsTab from "@/features/admin/components/SuperadminOrganizationsTab";
import SuperadminProjectsTab from "@/features/admin/components/SuperadminProjectsTab";
import SuperadminUsersTab from "@/features/admin/components/SuperadminUsersTab";
import SuperadminReviewersTab from "@/features/admin/components/SuperadminReviewersTab";
import AuditLogTable from "@/features/audit/components/AuditLogTable";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { analytics, fetchAnalytics, loading } = useAdminData();

  const handleCreateProgram = () => {
    console.log("Відкрити модалку створення програми");
  };

  const handleEditProgram = (program) => {
    console.log("Редагувати програму:", program);
  };

  const handleCreateOrganization = () => {
    console.log("Відкрити модалку створення організації");
  };

  const handleEditOrganization = (organization) => {
    console.log("Редагувати організацію:", organization);
  };

  const breadcrumbItems = [
    { label: "Особистий кабінет", href: "/profile" },
    { label: "Панель Суперадміністратора", active: true },
  ];

  const adminTabs = [
    { id: "overview", label: "Огляд", icon: LayoutDashboard },
    { id: "programs", label: "Програми", icon: FolderKanban },
    { id: "organizations", label: "Установи", icon: Building2 },
    { id: "projects", label: "Праці", icon: FileText },
    { id: "users", label: "Користувачі", icon: Users },
    { id: "reviewers", label: "Рецензенти", icon: UserCheck },
    { id: "audit", label: "Аудит", icon: Shield },
    { id: "danger_zone", label: "🚨 Danger Zone" },
  ];

  const isKnownTab = [
    "overview",
    "programs",
    "organizations",
    "projects",
    "users",
    "reviewers",
    "audit",
    "danger_zone",
  ].includes(activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-3 lg:px-0 max-w-7xl mx-auto w-full space-y-6 text-left">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="p-6 bg-bg-secondary/60 border border-border-color rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-600 font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Панель керування</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary flex items-center gap-2 font-sans">
              Вітаємо, {user?.name || "Суперадмін"}!{" "}
              <Crown
                size={22}
                className="text-purple-600 inline-block animate-pulse"
              />{" "}
            </h1>
            <p className="text-xs font-mono text-text-muted">
              Ви авторизовані з найвищим рівнем доступу (Superadmin). Оберіть
              необхідний розділ для роботи.
            </p>
          </div>

          <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-600 text-xs font-mono font-bold shrink-0 flex items-center gap-1.5">
            <ShieldAlert size={14} />
            <span>SUPERADMIN ACCESS</span>
          </div>
        </div>

        <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && (
          <SuperadminOverviewTab
            analytics={analytics}
            loading={loading}
            onFetchAnalytics={fetchAnalytics}
            onTabChange={setActiveTab}
            onCreateProgram={handleCreateProgram}
          />
        )}
        {activeTab === "programs" && (
          <SuperadminProgramsTab
            onCreateClick={handleCreateProgram}
            onEditClick={handleEditProgram}
          />
        )}

        {activeTab === "organizations" && (
          <SuperadminOrganizationsTab
            onCreateClick={handleCreateOrganization}
            onEditClick={handleEditOrganization}
          />
        )}

        {activeTab === "projects" && <SuperadminProjectsTab />}

        {activeTab === "users" && <SuperadminUsersTab />}

        {activeTab === "reviewers" && <SuperadminReviewersTab />}

        {activeTab === "audit" && <AuditLogTable />}

        {activeTab === "danger_zone" && <SuperadminDangerZoneTab />}

        {!isKnownTab && (
          <Card className="p-8 text-center text-xs font-mono text-text-muted bg-bg-secondary/20">
            Розділ <strong>"{activeTab}"</strong> у розробці. Ми підключимо його
            наступним кроком.
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
