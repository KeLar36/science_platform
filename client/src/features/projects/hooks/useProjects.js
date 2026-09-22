import { useState, useEffect, useCallback } from "react";
import { projectApi } from "../api/projectApi";

export function useProjects(
  initialFilters = {},
  limit = 8,
  isArchiveMode = false,
  organizationId = null,
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
        let data;
        const apiFilters = {
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
        };

        if (organizationId) {
          data = await projectApi.getOrganizationProjects(
            organizationId,
            apiFilters,
            pageToFetch,
            limit,
          );
        } else if (isArchiveMode) {
          data = await projectApi.getArchive(apiFilters, pageToFetch, limit);
        } else {
          // Інакше викликаємо загальний getAll
          data = await projectApi.getAll(apiFilters, pageToFetch, limit);
        }

        let items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.projects)) {
          items = data.projects;
        }

        setProjects(items);
        setPagination({
          currentPage: data?.currentPage || pageToFetch || 1,
          totalPages: data?.totalPages || 1,
          totalItems: data?.totalItems || items.length,
        });
      } catch (err) {
        console.error("Помилка завантаження проєктів:", err);
        setError(
          err.response?.data?.message || "Не вдалося завантажити проєкти",
        );
      } finally {
        setLoading(false);
      }
    },
    [organizationId, isArchiveMode, limit], // 👈 3. Додано в масив залежностей
  );

  useEffect(() => {
    fetchProjects(pagination.currentPage, filters);
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
