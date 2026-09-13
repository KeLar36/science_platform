import axiosInstance from "@/shared/api/axios";

export const projectApi = {
  getArchive: async (filters = {}, page = 1, limit = 8) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.domain &&
        filters.domain !== "Всі галузі" && { domain: filters.domain }),
      ...(filters.type &&
        filters.type !== "Всі типи" && { type: filters.type }),
    });

    const response = await axiosInstance.get(
      `/projects/archive?${params.toString()}`,
    );
    return response.data;
  },
  getById: async (id) => {
    const res = await axiosInstance.get(`/projects/${id}`);
    return res.data;
  },

  getAll: async (filters = {}, page = 1, limit = 8) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== null && value !== "",
        ),
      ),
    });

    const res = await axiosInstance.get(`/projects?${params.toString()}`);
    return res.data;
  },

  getMyProjects: async (filters = {}, page = 1, limit = 8) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== null && value !== "",
        ),
      ),
    });

    const res = await axiosInstance.get(`/projects/my?${params.toString()}`);
    return res.data;
  },

  create: async (formData) => {
    const res = await axiosInstance.post("/projects", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  uploadNewVersion: async (projectId, formData) => {
    const res = await axiosInstance.post(
      `/projects/${projectId}/version`,
      formData,
    );
    return res.data;
  },

  assignReviewer: async (projectId, reviewerId) => {
    const res = await axiosInstance.patch(
      `/projects/${projectId}/assign-reviewer`,
      { reviewerId },
    );
    return res.data;
  },

  updateStatus: async (projectId, status) => {
    const res = await axiosInstance.patch(`/projects/${projectId}/status`, {
      status,
    });
    return res.data;
  },

  delete: async (id) => {
    const res = await axiosInstance.delete(`/projects/${id}`);
    return res.data;
  },
};
