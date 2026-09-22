import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Mail, MapPin, Shield } from "lucide-react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import Tabs from "@/shared/ui/Tabs";
import Avatar from "@/shared/ui/Avatar";
import Skeleton from "@/shared/ui/Skeleton";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import { useAuth } from "@/shared/lib/context/AuthContext";
import { useOrganizationDashboard } from "@/features/organization/hooks/useOrganizationDashboard";
import OrganizationOverview from "@/features/organization/components/OrganizationOverview";
import OrganizationSettings from "@/features/organization/components/OrganizationSettings";
import ChangeRoleModal from "@/features/organization/components/ChangeRoleModal";
import OrganizationMembers from "@/shared/lib/components/OrganizationMembers";
import OrganizationPrograms from "@/shared/lib/components/OrganizationPrograms";
import OrganizationJoinRequests from "@/shared/lib/components/OrganizationJoinRequests";
import CreateProgramForm from "@/shared/lib/components/CreateProgramForm";
import OrganizationPosts from "@/shared/lib/components/OrganizationPosts";
import OrganizationSubmittedProjects from "@/shared/lib/components/OrganizationSubmittedProjects";
import ProjectDetailModal from "@/features/projects/components/ProjectDetailModal";
import ProjectChatModal from "@/features/projects/components/ProjectChatModal";
import AuditLogTable from "@/features/audit/components/AuditLogTable";

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const orgId = user?.organizationId?._id || user?.organizationId;

  const {
    orgData,
    members,
    membersPagination,
    programs,
    programsPagination,
    requests,
    requestsPagination,
    posts = [],
    postsPagination,
    submittedProjects = [],
    submittedProjectsPagination,
    loadingOrg,
    loadingMembers,
    loadingPrograms,
    loadingRequests,
    loadingPosts = false,
    loadingSubmittedProjects = false,
    actionLoading,
    fetchOrgDetails,
    fetchMembers,
    fetchPrograms,
    fetchPosts,
    fetchSubmittedProjects,
    handleCreateProgram,
    handleUpdateOrg,
    fetchPendingRequests,
    handleAcceptRequest,
    handleRejectRequest,
    handleUpdateProgram,
    handleToggleProgramStatus,
    handleTransferOwnership,
    handleDeleteProgram,
    handleDeletePost,
    handleKickMember,
    handleAssignReviewer,
  } = useOrganizationDashboard(orgId);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] =
    useState(null);
  const [selectedProjectForChat, setSelectedProjectForChat] = useState(null);

  const isOrgAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canManageContent = isOrgAdmin || user?.role === "content-manager";
  const navigate = useNavigate();

  useEffect(() => {
    if (orgId) {
      fetchOrgDetails();
    }
  }, [orgId, fetchOrgDetails]);

  useEffect(() => {
    if (!orgId) return;

    if (activeTab === "members" && members.length === 0) {
      fetchMembers(1);
    } else if (activeTab === "programs" && programs.length === 0) {
      fetchPrograms(1);
    } else if (
      activeTab === "requests" &&
      isOrgAdmin &&
      requests.length === 0
    ) {
      fetchPendingRequests(1);
    } else if (
      activeTab === "posts" &&
      canManageContent &&
      posts.length === 0
    ) {
      fetchPosts?.(1);
    } else if (
      activeTab === "submitted-projects" &&
      isOrgAdmin &&
      submittedProjects.length === 0
    ) {
      fetchSubmittedProjects?.(1);
      if (members.length === 0) fetchMembers(1);
    }
  }, [
    orgId,
    activeTab,
    isOrgAdmin,
    canManageContent,
    members.length,
    programs.length,
    requests.length,
    posts.length,
    submittedProjects.length,
    fetchMembers,
    fetchPrograms,
    fetchPendingRequests,
    fetchPosts,
    fetchSubmittedProjects,
  ]);

  const breadcrumbItems = [
    { label: "Особистий кабінет", href: "/profile" },
    { label: `Кабінет ${orgData?.name || "установи"}`, active: true },
  ];

  const dashboardTabs = [
    { id: "overview", label: "Огляд" },
    { id: "members", label: "Учасники" },
    { id: "programs", label: "Програми" },
    ...(isOrgAdmin
      ? [{ id: "submitted-projects", label: "Подані проєкти" }]
      : []),
    ...(canManageContent ? [{ id: "posts", label: "Блог / Новини" }] : []),
    ...(isOrgAdmin
      ? [
          { id: "requests", label: "Заявки на вступ" },
          {
            id: "create-program",
            label: editingProgram ? "Редагування програми" : "+ Нова програма",
          },
        ]
      : []),
    ...(isOrgAdmin
      ? [{ id: "audit", label: "Журнал аудиту", icon: Shield }]
      : []),
    ...(isOrgAdmin ? [{ id: "settings", label: "Налаштування" }] : []),
  ];

  const handleStartCreatePost = () => {
    navigate(`/content-manager/posts/create?orgId=${orgId}`);
  };

  const handleStartEditPost = (post) => {
    navigate(`/content-manager/posts/edit/${post._id}?orgId=${orgId}`);
  };

  const handleStartEditProgram = (program) => {
    setEditingProgram(program);
    setActiveTab("create-program");
  };

  if (loadingOrg && !orgData) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4 mt-20">
        <Skeleton variant="rectangle" height="120px" />
        <Skeleton variant="rectangle" height="300px" />
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl py-5 mx-auto px-3 lg:px-0 space-y-6 text-left my-20">
        <Breadcrumbs items={breadcrumbItems} />

        <Card className="p-6 bg-bg-secondary/60 border-border-color backdrop-blur-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={orgData?.logo}
                name={orgData?.name || "Science Platform"}
                size="lg"
                className="w-16 h-16 text-xl rounded-xl shrink-0"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black font-sans uppercase text-text-primary">
                    {orgData?.name || "Наукова установа"}
                  </h1>
                  {orgData?.isVerified && (
                    <Badge status="success">Верифіковано</Badge>
                  )}
                  <Badge status="default">{orgData?.type || "Установа"}</Badge>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-text-muted flex-wrap">
                  <span>ЄДРПОУ: {orgData?.edrpou}</span>
                  {orgData?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {orgData.city}
                    </span>
                  )}
                  {orgData?.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {orgData.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isOrgAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setEditingProgram(null);
                  setActiveTab("create-program");
                }}
              >
                Створити програму
              </Button>
            )}
          </div>
        </Card>

        <Tabs
          tabs={dashboardTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && <OrganizationOverview orgData={orgData} />}

        {activeTab === "members" && (
          <OrganizationMembers
            members={members}
            loading={loadingMembers}
            isOrgAdmin={isOrgAdmin}
            currentUserId={user?._id}
            creatorId={orgData?.ownerId || orgData?.creatorId}
            onOpenRoleModal={(member) => {
              setSelectedMember(member);
              setIsRoleModalOpen(true);
            }}
            onKickMember={handleKickMember}
            currentPage={membersPagination?.currentPage || 1}
            totalPages={membersPagination?.totalPages || 1}
            onPageChange={(p) => fetchMembers(p)}
          />
        )}

        {activeTab === "programs" && (
          <OrganizationPrograms
            programs={programs}
            loading={loadingPrograms}
            isOrgAdmin={isOrgAdmin}
            onCreateClick={() => {
              setEditingProgram(null);
              setActiveTab("create-program");
            }}
            onEditClick={handleStartEditProgram}
            onToggleArchiveClick={handleToggleProgramStatus}
            onDeleteClick={handleDeleteProgram}
            currentPage={programsPagination?.currentPage || 1}
            totalPages={programsPagination?.totalPages || 1}
            onPageChange={(p) => fetchPrograms(p)}
          />
        )}

        {activeTab === "submitted-projects" && isOrgAdmin && (
          <OrganizationSubmittedProjects
            projects={submittedProjects}
            loading={loadingSubmittedProjects}
            currentPage={submittedProjectsPagination?.currentPage || 1}
            totalPages={submittedProjectsPagination?.totalPages || 1}
            onViewDetails={(project) => setSelectedProjectForDetail(project)}
            onOpenChat={(project) => setSelectedProjectForChat(project)}
            onReviewClick={(project) => setSelectedProjectForChat(project)}
            onPageChange={(p) => fetchSubmittedProjects(p)}
            members={members}
            onAssignReviewer={handleAssignReviewer}
            orgId={orgId}
          />
        )}

        {activeTab === "posts" && canManageContent && (
          <OrganizationPosts
            posts={posts}
            loading={loadingPosts}
            canManage={canManageContent}
            onCreateClick={handleStartCreatePost}
            onEditClick={handleStartEditPost}
            onDeleteClick={handleDeletePost}
            currentPage={postsPagination?.currentPage || 1}
            totalPages={postsPagination?.totalPages || 1}
            onPageChange={(p) => fetchPosts(p)}
          />
        )}

        {activeTab === "create-program" && isOrgAdmin && (
          <CreateProgramForm
            key={editingProgram?._id || "new-program"}
            initialData={editingProgram}
            orgName={orgData?.name || "Організація"}
            onSubmit={async (formData) => {
              if (editingProgram) {
                return await handleUpdateProgram(editingProgram._id, formData);
              } else {
                return await handleCreateProgram(formData);
              }
            }}
            onSuccess={() => {
              setEditingProgram(null);
              setActiveTab("programs");
            }}
          />
        )}

        {activeTab === "requests" && isOrgAdmin && (
          <OrganizationJoinRequests
            requests={requests}
            loading={loadingRequests}
            actionLoading={actionLoading}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
            currentPage={requestsPagination?.currentPage || 1}
            totalPages={requestsPagination?.totalPages || 1}
            onPageChange={(p) => fetchPendingRequests(p)}
          />
        )}

        {activeTab === "audit" && isOrgAdmin && (
          <AuditLogTable initialFilters={{ organizationId: orgId }} />
        )}

        {activeTab === "settings" && isOrgAdmin && (
          <OrganizationSettings
            orgData={orgData}
            onUpdate={handleUpdateOrg}
            onTransferOwnership={handleTransferOwnership}
            currentUserId={user?._id}
          />
        )}

        {selectedMember && (
          <ChangeRoleModal
            isOpen={isRoleModalOpen}
            onClose={() => setIsRoleModalOpen(false)}
            member={selectedMember}
            orgId={orgId}
            onSuccess={() => fetchMembers(membersPagination.currentPage)}
          />
        )}

        {selectedProjectForDetail && (
          <ProjectDetailModal
            project={selectedProjectForDetail}
            onClose={() => setSelectedProjectForDetail(null)}
          />
        )}

        {selectedProjectForChat && (
          <ProjectChatModal
            project={selectedProjectForChat}
            onClose={() => setSelectedProjectForChat(null)}
          />
        )}
      </div>

      <Footer />
    </>
  );
}
