import { useState, useEffect, useCallback } from "react";
import { reviewerApi } from "../api/reviewerApi";

export function useReviewerQueue(initialFilters = {}, limit = 8) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    reviewStatus: "Всі",
    ...initialFilters,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);

    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchQueue = useCallback(
    async (pageToFetch, currentFilters) => {
      setLoading(true);
      setError(null);
      try {
        const data = await reviewerApi.getQueue(
          {
            search: currentFilters.search,
            reviewStatus:
              currentFilters.reviewStatus !== "Всі"
                ? currentFilters.reviewStatus
                : undefined,
          },
          pageToFetch,
          limit,
        );

        setProjects(data.projects || []);
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalItems: data.totalItems || 0,
        });
      } catch (err) {
        console.error("Помилка завантаження черги рецензента:", err);
        setError(
          err.response?.data?.message ||
            "Не вдалося завантажити чергу проєктів",
        );
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchQueue(pagination.currentPage, filters);
  }, [
    pagination.currentPage,
    filters.reviewStatus,
    debouncedSearch,
    fetchQueue,
  ]);

  const submitReview = useCallback(async (projectId, reviewData) => {
    setSubmittingReview(true);
    try {
      const updatedProject = await reviewerApi.submitReview(
        projectId,
        reviewData,
      );

      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? updatedProject : p)),
      );
      return { success: true, data: updatedProject };
    } catch (err) {
      console.error("Помилка при збереженні рецензії:", err);
      const msg = err.response?.data?.message || "Не вдалося зберегти рецензію";
      return { success: false, error: msg };
    } finally {
      setSubmittingReview(false);
    }
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const changePage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        setPagination((prev) => ({ ...prev, currentPage: page }));
      }
    },
    [pagination.totalPages],
  );

  return {
    projects,
    loading,
    submittingReview,
    error,
    filters,
    pagination,
    updateFilter,
    changePage,
    submitReview,
    refreshQueue: () => fetchQueue(pagination.currentPage, filters),
  };
}
