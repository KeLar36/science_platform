import { useState, useEffect, useCallback } from "react";
import { auditApi } from "../api/auditApi";

export function useAuditLogs(initialFilters = {}, limit = 20) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    category: "Всі",
    severity: "Всі",
    action: "",
    entityType: "",
    ...initialFilters,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);

    return () => clearTimeout(handler);
  }, [filters.search]);

  // Основна функція фетчингу логів
  const fetchLogs = useCallback(
    async (pageToFetch, currentFilters) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = {
          ...currentFilters,
          search: currentFilters.search
            ? currentFilters.search.trim()
            : undefined,
          category:
            currentFilters.category !== "Всі"
              ? currentFilters.category
              : undefined,
          severity:
            currentFilters.severity !== "Всі"
              ? currentFilters.severity
              : undefined,
          action: currentFilters.action || undefined,
          entityType: currentFilters.entityType || undefined,
        };

        const data = await auditApi.getLogs(queryParams, pageToFetch, limit);

        setLogs(data.logs || []);
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalItems: data.totalItems || 0,
        });
      } catch (err) {
        console.error("Помилка завантаження журналу аудиту:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Не вдалося завантажити журнал аудиту",
        );
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchLogs(pagination.currentPage, filters);
  }, [
    pagination.currentPage,
    filters.category,
    filters.severity,
    filters.action,
    filters.entityType,
    filters.organizationId,
    debouncedSearch,
    fetchLogs,
  ]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "Всі",
      severity: "Всі",
      action: "",
      entityType: "",
      ...initialFilters,
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [initialFilters]);

  // Перемикання сторінки
  const changePage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        setPagination((prev) => ({ ...prev, currentPage: page }));
      }
    },
    [pagination.totalPages],
  );

  const refresh = useCallback(() => {
    fetchLogs(pagination.currentPage, filters);
  }, [pagination.currentPage, filters, fetchLogs]);

  return {
    logs,
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
