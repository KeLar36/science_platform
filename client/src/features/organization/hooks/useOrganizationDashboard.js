import { useState, useCallback } from "react";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { programApi } from "@/features/programs/api/programApi";
import { projectApi } from "@/features/projects/api/projectApi";
import { contentManagerApi } from "@/features/content-manager/api/contentManagerApi";
import { useContentManager } from "@/features/content-manager/hooks/useContentManager";

export function useOrganizationDashboard(orgId) {
  const [orgData, setOrgData] = useState(null);

  // УЧАСНИКИ ТА РЕЦЕНЗЕНТИ
  const [members, setMembers] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [orgReviewers, setOrgReviewers] = useState([]);

  // ПРОГРАМИ
  const [programs, setPrograms] = useState([]);
  const [programsPagination, setProgramsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // НОВИНИ / ПОСТИ
  const [posts, setPosts] = useState([]);
  const [postsPagination, setPostsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // ПОДАНІ ПРОЄКТИ
  const [submittedProjects, setSubmittedProjects] = useState([]);
  const [submittedProjectsPagination, setSubmittedProjectsPagination] =
    useState({
      currentPage: 1,
      totalPages: 1,
    });

  // ЗАЯВКИ
  const [requests, setRequests] = useState([]);
  const [requestsPagination, setRequestsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSubmittedProjects, setLoadingSubmittedProjects] =
    useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    createPost: contentCreatePost,
    updatePost: contentUpdatePost,
    deletePost: contentDeletePost,
  } = useContentManager();

  const fetchOrgDetails = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoadingOrg(true);
      const data = await organizationApi.getById(orgId);
      setOrgData(data);
    } catch (err) {
      console.error("Помилка завантаження організації:", err);
    } finally {
      setLoadingOrg(false);
    }
  }, [orgId]);

  const fetchMembers = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      try {
        setLoadingMembers(true);
        const res = await organizationApi.getUsers(orgId, page);
        setMembers({
          items: res.items || res.members || [],
          totalPages: res.totalPages || 1,
          currentPage: res.currentPage || page,
        });
      } catch (err) {
        console.error("Помилка завантаження учасників:", err);
      } finally {
        setLoadingMembers(false);
      }
    },
    [orgId],
  );

  // 👈 Отримання рецензентів лише цієї організації
  const fetchOrgReviewers = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoadingReviewers(true);
      const res = await organizationApi.getReviewers(orgId);
      setOrgReviewers(res || []);
    } catch (err) {
      console.error("Помилка завантаження рецензентів організації:", err);
    } finally {
      setLoadingReviewers(false);
    }
  }, [orgId]);

  const fetchPrograms = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      try {
        setLoadingPrograms(true);
        const res = await programApi.getByOrganization(orgId, page);
        setPrograms(res.items || res.programs || res || []);
        setProgramsPagination({
          currentPage: res.currentPage || page,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error("Помилка завантаження програм:", err);
      } finally {
        setLoadingPrograms(false);
      }
    },
    [orgId],
  );

  const fetchPosts = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      try {
        setLoadingPosts(true);
        const res = await contentManagerApi.getDashboardData(
          { organizationId: orgId },
          page,
        );
        setPosts(res.posts || res.items || []);
        setPostsPagination({
          currentPage: res.currentPage || page,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error("Помилка завантаження постів організації:", err);
      } finally {
        setLoadingPosts(false);
      }
    },
    [orgId],
  );

  const fetchSubmittedProjects = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      setLoadingSubmittedProjects(true);
      try {
        const data = await projectApi.getOrganizationProjects(
          orgId,
          {},
          page,
          8,
        );

        setSubmittedProjects(data.projects || []);
        setSubmittedProjectsPagination({
          currentPage: data.currentPage || page || 1,
          totalPages: data.totalPages || 1,
        });
      } catch (error) {
        console.error("Помилка при завантаженні проєктів організації:", error);
      } finally {
        setLoadingSubmittedProjects(false);
      }
    },
    [orgId],
  );

  const fetchPendingRequests = useCallback(
    async (page = 1, search = "") => {
      if (!orgId) return;
      try {
        setLoadingRequests(true);
        const res = await organizationApi.getPendingRequests(
          orgId,
          page,
          search,
        );
        setRequests(res.items || []);
        setRequestsPagination({
          currentPage: res.currentPage || page,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error("Помилка завантаження заявок:", err);
      } finally {
        setLoadingRequests(false);
      }
    },
    [orgId],
  );

  const handleUpdateOrg = async (updatedFields) => {
    if (!orgId) return;
    try {
      setActionLoading(true);
      await organizationApi.updateOrganization(orgId, updatedFields);
      await fetchOrgDetails();
    } catch (err) {
      console.error("Помилка оновлення організації:", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!orgId) return { success: false, error: "ID організації відсутній" };
    try {
      setActionLoading(true);
      const res = await organizationApi.transferOwnership(orgId, newOwnerId);
      return { success: true, message: res.message };
    } catch (err) {
      console.error("Помилка передачі прав власності:", err);
      return {
        success: false,
        error:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Не вдалося передати права власності",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMemberRole = async (userId, roleData) => {
    if (!orgId) return;
    try {
      setActionLoading(true);
      const res = await organizationApi.updateMemberRole(
        orgId,
        userId,
        roleData,
      );
      await Promise.all([
        fetchMembers(),
        fetchOrgReviewers(),
        fetchSubmittedProjects(),
      ]);
      return { success: true, message: res.message };
    } catch (err) {
      console.error("Помилка зміни ролі учасника:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Не вдалося змінити роль",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProgram = async (programData) => {
    if (!orgId) return;
    try {
      setActionLoading(true);
      const newProgram = await programApi.create({
        ...programData,
        organizationId: orgId,
      });
      await fetchPrograms();
      return { success: true, data: newProgram };
    } catch (err) {
      console.error("Помилка створення програми:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Не вдалося створити програму",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProgram = async (programId, programData) => {
    try {
      setActionLoading(true);
      const updatedProgram = await programApi.update(programId, programData);
      await fetchPrograms();
      return { success: true, data: updatedProgram };
    } catch (err) {
      console.error("Помилка оновлення програми:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Не вдалося оновити програму",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProgramStatus = async (programId) => {
    try {
      setActionLoading(true);
      const res = await programApi.toggleStatus(programId);
      await fetchPrograms();
      return { success: true, message: res.message, program: res.program };
    } catch (err) {
      console.error("Помилка зміни статусу програми:", err);
      return {
        success: false,
        error:
          err.response?.data?.error || "Не вдалося змінити статус програми",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    try {
      setActionLoading(true);
      const res = await programApi.delete(programId);
      await fetchPrograms();
      return { success: true, message: res.message };
    } catch (err) {
      console.error("Помилка видалення програми:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Не вдалося видалити програму",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    if (!orgId) return;
    try {
      setActionLoading(true);
      const res = await contentCreatePost({
        ...postData,
        organizationId: orgId,
      });
      if (res?.success) await fetchPosts();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePost = async (postId, postData) => {
    try {
      setActionLoading(true);
      const res = await contentUpdatePost(postId, {
        ...postData,
        organizationId: orgId,
      });
      if (res?.success) await fetchPosts();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setActionLoading(true);
      const res = await contentDeletePost(postId);
      if (res?.success) await fetchPosts();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      setActionLoading(true);
      await organizationApi.acceptRequest(userId);
      await fetchPendingRequests();
      await fetchMembers();
    } catch (err) {
      console.error("Помилка прийняття заявки:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      setActionLoading(true);
      await organizationApi.rejectRequest(userId);
      await fetchPendingRequests();
    } catch (err) {
      console.error("Помилка відхилення заявки:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleKickMember = async (targetUserId) => {
    if (!orgId) return;
    try {
      setActionLoading(true);
      const res = await organizationApi.kickMember(orgId, targetUserId);
      await Promise.all([
        fetchMembers(),
        fetchOrgReviewers(),
        fetchSubmittedProjects(),
      ]);
      return { success: true, message: res.message };
    } catch (err) {
      console.error("Помилка виключення користувача:", err);
      return {
        success: false,
        error: err.response?.data?.error || "Не вдалося виключити користувача",
      };
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignReviewer = async (projectId, reviewerId) => {
    try {
      setActionLoading(true);
      const updatedProject = await projectApi.assignReviewer(
        projectId,
        reviewerId,
      );
      await fetchSubmittedProjects(submittedProjectsPagination.currentPage);
      return { success: true, data: updatedProject };
    } catch (err) {
      console.error("Помилка при ручному призначенні рецензента:", err);
      return {
        success: false,
        error:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Не вдалося призначити рецензента",
      };
    } finally {
      setActionLoading(false);
    }
  };

  return {
    orgData,
    members: members.items || members,
    membersPagination: {
      currentPage: members.currentPage || 1,
      totalPages: members.totalPages || 1,
    },
    orgReviewers,
    programs,
    programsPagination,
    posts,
    postsPagination,
    submittedProjects,
    submittedProjectsPagination,
    requests,
    requestsPagination,
    loadingOrg,
    loadingMembers,
    loadingReviewers,
    loadingPrograms,
    loadingPosts,
    loadingSubmittedProjects,
    loadingRequests,
    actionLoading,
    handleUpdateOrg,
    handleTransferOwnership,
    handleUpdateMemberRole,
    fetchOrgDetails,
    fetchPrograms,
    fetchMembers,
    fetchOrgReviewers,
    fetchPosts,
    fetchSubmittedProjects,
    fetchPendingRequests,
    handleAcceptRequest,
    handleRejectRequest,
    handleCreateProgram,
    handleUpdateProgram,
    handleToggleProgramStatus,
    handleDeleteProgram,
    handleCreatePost,
    handleUpdatePost,
    handleDeletePost,
    handleKickMember,
    handleAssignReviewer,
  };
}
