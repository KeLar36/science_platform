import React, { useState, useEffect } from "react";
import { BookOpen, Clock, Archive, ArchiveRestore, Search } from "lucide-react";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Pagination from "@/shared/ui/Pagination";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";
import { useAdminData } from "@/features/admin/hooks/useAdminData";

export default function SuperadminProgramsTab() {
  const {
    programs = [],
    loading = false,
    programsPagination,
    pagination: fallbackPagination,
    fetchPrograms,
    toggleProgramStatus,
  } = useAdminData();

  const pagination = programsPagination ||
    fallbackPagination || { currentPage: 1, totalPages: 1 };

  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: "" });
    }, 5000);
  };

  // Debounce для пошукового інпута (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Запит на сервер надсилається тільки після затримки debouncedSearch
  useEffect(() => {
    if (typeof fetchPrograms === "function") {
      fetchPrograms({
        page: currentPage,
        search: debouncedSearch.trim(),
        active: statusFilter === "all" ? undefined : statusFilter === "active",
      });
    }
  }, [currentPage, debouncedSearch, statusFilter, fetchPrograms]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleArchive = async (prog) => {
    try {
      const result = await toggleProgramStatus(prog._id);
      if (result?.success) {
        showFeedback(
          "success",
          result.message || `Статус програми "${prog.title}" успішно змінено.`,
        );
        fetchPrograms({
          page: currentPage,
          search: debouncedSearch.trim(),
          active:
            statusFilter === "all" ? undefined : statusFilter === "active",
        });
      } else if (result?.error) {
        showFeedback("danger", result.error);
      }
    } catch (err) {
      showFeedback("danger", "Не вдалося змінити статус програми.");
    }
  };

  const headers = [
    "Назва програми",
    "Тип",
    "Організація / Галузь",
    "Дедлайн",
    "Статус",
    "Дії (Superadmin)",
  ];

  return (
    <div className="space-y-4 text-left">
      {feedback.type && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback({ type: null, message: "" })}
        >
          {feedback.message}
        </Alert>
      )}

      {/* ФІЛЬТРИ ТА ПОШУК (Завжди присутні в DOM) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <Input
            placeholder="Шукати за назвою чи галуззю..."
            icon={Search}
            value={search}
            onChange={handleSearchChange}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={[
              { label: "Всі статуси", value: "all" },
              { label: "Активні", value: "active" },
              { label: "В архіві", value: "archived" },
            ]}
          />
        </div>
      </div>

      {/* ТАБЛИЦЯ / СКЕЛЕТОН / ПОРОЖНІЙ СТАН */}
      {loading && (!programs || programs.length === 0) ? (
        <Skeleton variant="rectangle" height="250px" />
      ) : programs.length === 0 ? (
        <Card className="p-8 text-center space-y-2 bg-bg-secondary/40 border-dashed">
          <BookOpen className="mx-auto text-text-muted" size={32} />
          <p className="text-xs font-mono text-text-muted">
            За вказаними параметрами програм не знайдено.
          </p>
        </Card>
      ) : (
        <>
          <Table headers={headers} className="[&_table]:min-w-[1000px]">
            {programs.map((prog) => (
              <TableRow key={prog._id}>
                <TableCell className="px-8 py-5 min-w-[280px]">
                  <div>
                    <span className="font-bold text-sm text-text-primary block">
                      {prog.title}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-8 py-5">
                  <Badge status="default">{prog.type || "Програма"}</Badge>
                </TableCell>

                <TableCell className="px-8 py-5 min-w-[200px]">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-primary">
                      {prog.organizationId?.name ||
                        prog.organizer ||
                        "Платформа"}
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      {prog.domain || "Загальна"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-8 py-5 whitespace-nowrap">
                  <span className="text-xs font-mono flex items-center gap-1.5 text-purple-600 font-semibold">
                    <Clock size={13} />
                    {prog.deadline
                      ? new Date(prog.deadline).toLocaleDateString("uk-UA")
                      : "—"}
                  </span>
                </TableCell>

                <TableCell className="px-8 py-5">
                  <Badge status={prog.active ? "success" : "danger"}>
                    {prog.active ? "Активна" : "Архів"}
                  </Badge>
                </TableCell>

                <TableCell className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={prog.active ? Archive : ArchiveRestore}
                      onClick={() => handleToggleArchive(prog)}
                      className="text-xs text-text-muted hover:text-amber-500 hover:border-amber-500/40"
                      title={prog.active ? "Деактивувати" : "Відновити"}
                    >
                      {prog.active ? "Архів" : "Відновити"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>

          {pagination && (
            <Pagination
              currentPage={pagination.currentPage || 1}
              totalPages={pagination.totalPages || 1}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      )}
    </div>
  );
}
