import axiosInstance from "@/shared/api/axios";

export const reviewerApi = {
  getQueue: async (filters = {}, page = 1, limit = 8) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== null && value !== "",
        ),
      ),
    });

    const res = await axiosInstance.get(
      `/projects/reviewer/queue?${params.toString()}`,
    );
    return res.data;
  },

  submitReview: async (projectId, reviewData) => {
    const res = await axiosInstance.post(
      `/projects/${projectId}/review`,
      reviewData,
    );
    return res.data;
  },

  getReview: async (projectId) => {
    const res = await axiosInstance.get(`/projects/${projectId}/review`);
    return res.data;
  },
};
