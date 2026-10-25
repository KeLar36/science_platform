import React, { useState, useEffect } from "react";
import {
  Search,
  Building,
  CheckCircle,
  XCircle,
  Mail,
  Globe,
  MapPin,
  ShieldAlert,
  Users,
  UserPlus,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Pagination from "@/shared/ui/Pagination";
import Toggle from "@/shared/ui/Toggle";
import { useAdminData } from "@/features/admin/hooks/useAdminData";

export default function SuperadminOrganizationsTab() {
  const {
    organizations = [],
    loading = false,
    orgsPagination: pagination,
    fetchOrganizations,
    updateOrgStatus,
    toggleOrgVerified,
    toggleOrgFeatured,
  } = useAdminData();

  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const orgList = organizations || [];

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typeof fetchOrganizations === "function") {
      fetchOrganizations(
        pagination?.currentPage || 1,
        debouncedSearch.trim(),
        statusFilter,
      );
    }
  }, [
    pagination?.currentPage,
    debouncedSearch,
    statusFilter,
    fetchOrganizations,
  ]);

  const handleStatusUpdate = async (org, newStatus) => {
    const actionText = newStatus === "approved" ? "схвалити" : "відхилити";
    if (!confirm(`Ви дійсно бажаєте ${actionText} установу "${org.name}"?`))
      return;

    try {
      await updateOrgStatus(org._id, newStatus);
      showFeedback(
        "success",
        `Установу успішно ${newStatus === "approved" ? "схвалено" : "відхилено"}.`,
      );
      fetchOrganizations(
        pagination?.currentPage || 1,
        debouncedSearch.trim(),
        statusFilter,
      );
    } catch (err) {
      showFeedback("danger", "Помилка оновлення статусу.");
    }
  };

  const handleToggle = async (actionFn, orgId, successMsg) => {
    try {
      await actionFn(orgId);
      showFeedback("success", successMsg);
      fetchOrganizations(
        pagination?.currentPage || 1,
        debouncedSearch.trim(),
        statusFilter,
      );
    } catch (err) {
      showFeedback("danger", "Помилка оновлення статусу.");
    }
  };

  return (
    <div className="space-y-6 text-left">
      {feedback.type && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback({ type: null, message: "" })}
        >
          {feedback.message}
        </Alert>
      )}

      <div className="flex flex-col md:flex-row items-center gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color">
        <Input
          placeholder="Шукати за назвою, ЄДРПОУ чи описом..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 w-full"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: "Всі статуси", value: "" },
            { label: "Очікують модерації", value: "pending" },
            { label: "Схвалені", value: "approved" },
            { label: "Відхилені", value: "rejected" },
          ]}
          className="w-full md:w-48 shrink-0"
        />
      </div>

      {loading && orgList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rectangle" height="340px" />
          ))}
        </div>
      ) : orgList.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-bg-secondary/40 border-dashed">
          <Building className="mx-auto text-text-muted opacity-50" size={48} />
          <p className="text-sm font-mono text-text-muted">
            За вказаними параметрами установ не знайдено.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orgList.map((org) => {
            const membersCount = org.members?.length || 0;
            const requestsCount = org.joinRequests?.length || 0;
            const domains = org.scientificDomains || [];

            return (
              <Card
                key={org._id}
                className="flex flex-col p-5 border-border-color hover:border-purple-600/40 transition-all bg-bg-secondary/50 group"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="w-12 h-12 rounded-xl bg-bg-tertiary border border-border-color flex items-center justify-center overflow-hidden shrink-0">
                    {org.logo ? (
                      <img
                        src={org.logo}
                        alt="logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building size={20} className="text-text-muted" />
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge
                      status={
                        org.status === "approved"
                          ? "success"
                          : org.status === "pending"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {org.status === "approved"
                        ? "Схвалено"
                        : org.status === "pending"
                          ? "Очікує"
                          : "Відхилено"}
                    </Badge>

                    {org.isSystem && (
                      <span
                        className="text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1"
                        title="Системна організація"
                      >
                        <ShieldAlert size={12} /> SYSTEM
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex-grow max-h-56 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  <div>
                    <h3 className="font-bold text-base text-text-primary line-clamp-2 leading-tight mb-1.5 group-hover:text-purple-600 transition-colors">
                      {org.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-text-muted">
                      <span className="bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-color">
                        ЄДРПОУ:{" "}
                        {org.edrpou?.includes("-rejected")
                          ? org.edrpou.split("-rejected")[0]
                          : org.edrpou || "—"}
                      </span>
                      {org.legalForm && (
                        <span className="bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded border border-purple-500/20 font-semibold">
                          {org.legalForm}
                        </span>
                      )}
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-xs text-text-muted leading-relaxed border-l-2 border-purple-600/30 pl-2 italic">
                      {org.description}
                    </p>
                  )}

                  {domains.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
                        Наукові галузі:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {domains.map((domain, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-md border border-border-color/60 font-mono"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary bg-bg-tertiary/40 p-1.5 rounded-lg border border-border-color/40">
                      <Users size={13} className="text-purple-600" />
                      <span>{membersCount} учасників</span>
                    </div>
                    {requestsCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-amber-500 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                        <UserPlus size={13} />
                        <span>{requestsCount} заявок</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted bg-bg-tertiary/40 p-1.5 rounded-lg border border-border-color/40">
                        {org.allowPublicJoin ? (
                          <Unlock size={13} className="text-green-500" />
                        ) : (
                          <Lock size={13} className="text-red-400" />
                        )}
                        <span>
                          {org.allowPublicJoin ? "Вступ відкритий" : "Закрита"}
                        </span>
                      </div>
                    )}
                  </div>

                  {org.status === "rejected" && org.rejectionReason && (
                    <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20 font-mono">
                      <strong>Причина відмови:</strong> {org.rejectionReason}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-text-secondary font-mono pt-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-text-muted shrink-0" />
                      <span className="truncate">
                        {org.city || "Місто не вказано"},{" "}
                        {org.type || "Тип не вказано"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-text-muted shrink-0" />
                      <span className="truncate">{org.email || "—"}</span>
                    </div>

                    {org.website && (
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-text-muted shrink-0" />
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate hover:text-purple-600 hover:underline"
                        >
                          {org.website}
                        </a>
                      </div>
                    )}

                    {org.createdAt && (
                      <div className="flex items-center gap-2 text-[10px] text-text-muted pt-0.5">
                        <Calendar size={11} className="shrink-0" />
                        <span>
                          Створено:{" "}
                          {new Date(org.createdAt).toLocaleDateString("uk-UA")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border-color mt-auto flex flex-col gap-2">
                  {org.status === "approved" && (
                    <div className="bg-bg-tertiary/40 p-2 rounded-xl border border-border-color/60 space-y-1">
                      <Toggle
                        checked={!!org.isVerified}
                        onChange={() =>
                          handleToggle(
                            toggleOrgVerified,
                            org._id,
                            "Статус верифікації змінено",
                          )
                        }
                        label="Верифікована"
                        description="Офіційна підтверджена установа"
                      />
                      <div className="border-t border-border-color/40 my-1" />
                      <Toggle
                        checked={!!org.isFeatured}
                        onChange={() =>
                          handleToggle(
                            toggleOrgFeatured,
                            org._id,
                            "Статус Featured змінено",
                          )
                        }
                        label="В топі (Featured)"
                        description="Відображається вище у списках"
                      />
                    </div>
                  )}

                  {org.status === "pending" && (
                    <div className="grid grid-cols-2 gap-2 my-1">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={CheckCircle}
                        className="border-green-500/30 text-green-500 hover:bg-green-500/10 text-xs"
                        onClick={() => handleStatusUpdate(org, "approved")}
                      >
                        Схвалити
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={XCircle}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                        onClick={() => handleStatusUpdate(org, "rejected")}
                      >
                        Відхилити
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {orgList.length > 0 && pagination && (
        <Pagination
          currentPage={pagination.currentPage || 1}
          totalPages={pagination.totalPages || 1}
          onPageChange={(page) =>
            fetchOrganizations(page, debouncedSearch.trim(), statusFilter)
          }
        />
      )}
    </div>
  );
}
