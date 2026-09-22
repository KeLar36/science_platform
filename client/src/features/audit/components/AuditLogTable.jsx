import React, { useState } from "react";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Pagination from "@/shared/ui/Pagination";
import Skeleton from "@/shared/ui/Skeleton";
import { Shield, Search, Eye, RotateCcw } from "lucide-react";
import AuditDetailsModal from "./AuditDetailsModal";
import { useAuditLogs } from "../hooks/useAuditLogs";

export default function AuditLogTable({ initialFilters = {} }) {
  const {
    logs,
    loading,
    error,
    filters,
    pagination,
    updateFilter,
    handleResetFilters,
    changePage,
  } = useAuditLogs(initialFilters);

  const [selectedLog, setSelectedLog] = useState(null);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return <Badge status="danger">Критично</Badge>;
      case "warning":
        return <Badge status="warning">Попередження</Badge>;
      case "info":
      default:
        return <Badge status="info">Інфо</Badge>;
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color items-center">
        <div className="sm:col-span-2">
          <Input
            placeholder="Пошук за дією, email або назвою..."
            icon={Search}
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>
        <div>
          <Select
            value={filters.severity}
            onChange={(e) => updateFilter("severity", e.target.value)}
            options={[
              { label: "Всі рівня суворості", value: "Всі" },
              { label: "Інфо (info)", value: "info" },
              { label: "Попередження (warning)", value: "warning" },
              { label: "Критичні (critical)", value: "critical" },
            ]}
          />
        </div>
        <div>
          <Select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            options={[
              { label: "Всі категорії", value: "Всі" },
              { label: "Користувачі (USER)", value: "USER" },
              { label: "Безпека (SECURITY)", value: "SECURITY" },
              { label: "Проєкти (PROJECT)", value: "PROJECT" },
              { label: "Організації (ORGANIZATION)", value: "ORGANIZATION" },
            ]}
          />
        </div>
      </div>

      {(filters.search ||
        filters.severity !== "Всі" ||
        filters.category !== "Всі") && (
        <div className="flex justify-start">
          <button
            onClick={handleResetFilters}
            className="text-[10px] font-mono uppercase tracking-wider text-brand hover:underline cursor-pointer flex items-center gap-1"
          >
            <RotateCcw size={11} /> Скинути фільтри журналу
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton variant="rectangle" height="300px" />
      ) : logs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border-color rounded-2xl bg-bg-secondary/20 space-y-2">
          <Shield className="mx-auto text-text-muted" size={32} />
          <p className="text-xs font-mono text-text-muted">
            Записи аудиту відсутні або нічого не знайдено за вказаними
            фільтрами.
          </p>
        </div>
      ) : (
        <>
          <Table
            headers={[
              "Дата / Час",
              "Категорія",
              "Дія (Action)",
              "Ініціатор (Actor)",
              "Рівень",
              "Деталі",
            ]}
          >
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <span className="text-xs font-mono text-text-secondary whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("uk-UA")}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono font-bold text-text-primary">
                    {log.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-brand font-bold">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-bold text-text-primary">
                    {log.actor?.email || "SYSTEM"}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted">
                    {log.actor?.role}
                  </div>
                </TableCell>
                <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => setSelectedLog(log)}
                    className="!p-1.5"
                    title="Переглянути повний Payload"
                  />
                </TableCell>
              </TableRow>
            ))}
          </Table>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={changePage}
          />
        </>
      )}

      <AuditDetailsModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
