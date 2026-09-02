import { useState, useEffect, useCallback } from "react";
import { projectApi } from "../api/projectApi";

export function useProjects(
  initialFilters = {},
  limit = 8,
  isArchiveMode = false,
) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    domain: "Всі галузі",
    type: "Всі типи",
    status: "Всі статуси",
    ...initialFilters,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);

    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchProjects = useCallback(
    async (pageToFetch, currentFilters) => {
      setLoading(true);
      setError(null);
      try {
        if (isArchiveMode) {
          const archiveData = await projectApi.getArchive();
          let items = Array.isArray(archiveData) ? archiveData : [];

          if (currentFilters.search) {
            const query = currentFilters.search.toLowerCase();
            items = items.filter(
              (p) =>
                p.title?.toLowerCase().includes(query) ||
                p.authorId?.name?.toLowerCase().includes(query),
            );
          }

          if (currentFilters.domain && currentFilters.domain !== "Всі галузі") {
            items = items.filter((p) => p.domain === currentFilters.domain);
          }

          if (currentFilters.type && currentFilters.type !== "Всі типи") {
            items = items.filter(
              (p) =>
                p.programId?.type === currentFilters.type ||
                p.type === currentFilters.type,
            );
          }

          setProjects(items);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: items.length,
          });
        } else {
          const data = await projectApi.getAll(
            {
              search: currentFilters.search,
              domain:
                currentFilters.domain !== "Всі галузі"
                  ? currentFilters.domain
                  : undefined,
              type:
                currentFilters.type !== "Всі типи"
                  ? currentFilters.type
                  : undefined,
              status:
                currentFilters.status !== "Всі статуси"
                  ? currentFilters.status
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
        }
      } catch (err) {
        console.error("Помилка завантаження проєктів:", err);
        setError(
          err.response?.data?.message || "Не вдалося завантажити проєкти",
        );
      } finally {
        setLoading(false);
      }
    },
    [limit, isArchiveMode],
  );

  useEffect(() => {
    fetchProjects(pagination.currentPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage,
    filters.domain,
    filters.type,
    filters.status,
    debouncedSearch,
    fetchProjects,
  ]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    const reset = {
      search: "",
      domain: "Всі галузі",
      type: "Всі типи",
      status: "Всі статуси",
      ...initialFilters,
    };
    setFilters(reset);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [initialFilters]);

  const changePage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        setPagination((prev) => ({ ...prev, currentPage: page }));
      }
    },
    [pagination.totalPages],
  );

  const refresh = useCallback(() => {
    fetchProjects(pagination.currentPage, filters);
  }, [pagination.currentPage, filters, fetchProjects]);

  return {
    projects,
    loading,
    error,
    filters,
    pagination,
    updateFilter,
    handleResetFilters,
    changePage,
    refresh,
  };
}
