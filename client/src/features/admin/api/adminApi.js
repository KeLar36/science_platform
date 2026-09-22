import axiosInstance from "@/shared/api/axios";

export const adminApi = {
  getAllOrganizations: async (params) => {
    const res = await axiosInstance.get("/organizations/all", { params });
    return res.data;
  },
  updateOrgStatus: async (orgId, status) => {
    const res = await axiosInstance.patch(`/organizations/${orgId}/status`, {
      status,
    });
    return res.data;
  },
  toggleOrgVerified: async (orgId) => {
    const res = await axiosInstance.patch(`/organizations/${orgId}/verify`);
    return res.data;
  },
  toggleOrgFeatured: async (orgId) => {
    const res = await axiosInstance.patch(`/organizations/${orgId}/feature`);
    return res.data;
  },
  deleteOrganizationCascade: async (orgId) => {
    const res = await axiosInstance.delete(`/organizations/${orgId}`);
    return res.data;
  },

  getAllUsers: async (params) => {
    const res = await axiosInstance.get("/users/all", { params });
    return res.data;
  },
  getUsersCount: async () => {
    const res = await axiosInstance.get("/users/count");
    return res.data;
  },
  updateUserRole: async (userId, roleData) => {
    const payload =
      typeof roleData === "string" ? { role: roleData } : roleData;
    const res = await axiosInstance.patch(`/users/role/${userId}`, payload);
    return res.data;
  },
  banUser: async (userId, isBanned) => {
    const res = await axiosInstance.patch(`/users/ban/${userId}`, { isBanned });
    return res.data;
  },
  deleteUserCascade: async (userId) => {
    const res = await axiosInstance.delete(`/users/${userId}`);
    return res.data;
  },

  getAllProjects: async (params) => {
    const res = await axiosInstance.get("/projects", { params });
    return res.data;
  },
  assignReviewer: async (projectId, reviewerId) => {
    const res = await axiosInstance.patch(`/projects/${projectId}/assign`, {
      reviewerId,
    });
    return res.data;
  },
  deleteProject: async (projectId) => {
    const res = await axiosInstance.delete(`/projects/${projectId}`);
    return res.data;
  },

  getPrograms: async (params = {}) => {
    const res = await axiosInstance.get("/superadmin/programs", { params });
    return res.data;
  },
  createProgram: async (programData) => {
    const res = await axiosInstance.post("/programs", programData);
    return res.data;
  },
  toggleProgramStatus: async (programId) => {
    const res = await axiosInstance.patch(
      `/programs/${programId}/toggle-status`,
    );
    return res.data;
  },
  handleProgramDeadline: async (programId) => {
    const res = await axiosInstance.post(`/programs/${programId}/deadline`);
    return res.data;
  },
  forceCleanupProgram: async (programId) => {
    const res = await axiosInstance.post(
      `/programs/${programId}/final-cleanup`,
    );
    return res.data;
  },

  getAllPosts: async () => {
    const res = await axiosInstance.get("/posts");
    return res.data;
  },
  deletePost: async (postId) => {
    const res = await axiosInstance.delete(`/posts/${postId}`);
    return res.data;
  },
  getSuperadminAnalytics: async () => {
    const res = await axiosInstance.get("/superadmin/analytics");
    return res.data;
  },

  sendBroadcast: async (payload) => {
    const res = await axiosInstance.post("/superadmin/broadcast", payload);
    return res.data;
  },
};
