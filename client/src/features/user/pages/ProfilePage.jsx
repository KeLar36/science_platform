import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Tabs from "@/shared/ui/Tabs";
import Alert from "@/shared/ui/Alert";
import ProfileHeader from "@/features/user/components/ProfileHeader";
import MyProjectsTab from "@/features/user/components/MyProjectsTab";
import SavedPostsTab from "@/features/user/components/SavedPostsTab";
import SettingsTab from "@/features/user/components/SettingsTab";
import ProfileStats from "@/features/user/components/ProfileStats";
import ProjectChatModal from "@/features/projects/components/ProjectChatModal";
import { useProfile } from "@/features/user/hooks/useProfile";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("projects");
  const [activeChatProject, setActiveChatProject] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || null,
  );

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const {
    user,
    myProjects,
    savedPosts,
    loadingProjects,
    loadingSaved,
    updating,
    fetchMyProjects,
    fetchSavedPosts,
    updateProfile,
    refreshProfile,
    toggleBookmark,
    deleteAccount,
    stats,
  } = useProfile();

  useEffect(() => {
    if (activeTab === "projects") fetchMyProjects();
    if (activeTab === "saved") fetchSavedPosts();
  }, [activeTab, fetchMyProjects, fetchSavedPosts]);

  const breadcrumbItems = [{ label: "Особистий кабінет", active: true }];

  const profileTabs = [
    { id: "projects", label: "Мої наукові праці" },
    { id: "saved", label: "Збережені матеріали" },
    { id: "settings", label: "Налаштування акаунту" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-3 lg:px-0 max-w-5xl mx-auto w-full space-y-6 relative z-10">
        <Breadcrumbs items={breadcrumbItems} />

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <ProfileHeader
          user={user}
          onUpdateProfile={updateProfile}
          updating={updating}
          onRefreshProfile={refreshProfile}
        />

        <ProfileStats stats={stats} loading={loadingProjects} />

        <Tabs
          tabs={profileTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "projects" && (
          <MyProjectsTab
            projects={myProjects}
            loading={loadingProjects}
            onOpenChat={(project) => setActiveChatProject(project)}
            onPageChange={(page) => fetchMyProjects(page)}
          />
        )}

        {activeTab === "saved" && (
          <SavedPostsTab
            savedPosts={savedPosts}
            loading={loadingSaved}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab onDeleteAccount={deleteAccount} />
        )}
      </main>

      {activeChatProject && (
        <ProjectChatModal
          project={activeChatProject}
          onClose={() => setActiveChatProject(null)}
        />
      )}

      <Footer />
    </div>
  );
}
