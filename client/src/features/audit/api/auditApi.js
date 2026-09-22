import axiosInstance from "@/shared/api/axios";

export const auditApi = {
  getLogs: async (filters = {}, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== null && value !== "",
        ),
      ),
    });

    const res = await axiosInstance.get(`/audit-logs?${params.toString()}`);
    return res.data;
  },
};
