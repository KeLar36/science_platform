import { useState, useEffect, useMemo, useCallback } from "react";
import { programApi } from "@/features/programs/api/programApi";
import { organizationApi } from "@/features/organization/api/organizationApi";

export function usePrograms(programId = null) {
  const [items, setItems] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("Всі галузі");
  const [selectedType, setSelectedType] = useState("Всі типи");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentProgram, setCurrentProgram] = useState(null);

  useEffect(() => {
    if (programId) return;
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, programId]);

  useEffect(() => {
    if (programId) return;
    setPage(1);
  }, [debouncedSearch, selectedDomain, selectedType, programId]);

  useEffect(() => {
    if (programId) return;
    const fetchOrgs = async () => {
      try {
        const data = await organizationApi.getPublicList();
        setOrganizations(data || []);
      } catch (err) {
        console.error("Не вдалося завантажити організації:", err);
      }
    };
    fetchOrgs();
  }, [programId]);

  useEffect(() => {
    if (programId) return;
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const data = await programApi.getPublicList({
          page,
          limit: 6,
          search: debouncedSearch.trim() || undefined,
          type: selectedType !== "Всі типи" ? selectedType : undefined,
          domain: selectedDomain !== "Всі галузі" ? selectedDomain : undefined,
        });

        setItems(data.programs || data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
      } catch (err) {
        console.error("Помилка завантаження програм:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [page, debouncedSearch, selectedType, selectedDomain, programId]);

  const programsWithUrgency = useMemo(() => {
    if (programId) return [];
    const now = new Date();
    return items.map((prog) => {
      if (!prog.deadline) return { ...prog, isUrgent: false };
      const deadlineDate = new Date(prog.deadline);
      const diffTime = deadlineDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...prog, isUrgent: diffDays >= 0 && diffDays <= 7 };
    });
  }, [items, programId]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedType("Всі типи");
    setSelectedDomain("Всі галузі");
    setPage(1);
  }, []);

  useEffect(() => {
    if (!programId) return;
    const fetchProgramById = async () => {
      try {
        setLoading(true);
        const data = await programApi.getById(programId);
        setCurrentProgram(data);
      } catch (err) {
        console.error(`Помилка завантаження програми ${programId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramById();
  }, [programId]);

  return {
    programs: programsWithUrgency,
    organizations,
    page,
    totalPages,
    totalItems,
    setPage,
    searchTerm,
    setSearchTerm,
    selectedDomain,
    setSelectedDomain,
    selectedType,
    setSelectedType,
    handleResetFilters,
    currentProgram,
    loading,
  };
}
