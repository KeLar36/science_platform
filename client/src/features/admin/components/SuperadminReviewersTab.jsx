import React, { useState, useEffect } from "react";
import { Search, UserCheck, Tag, BookOpen, Mail, MapPin } from "lucide-react";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import Input from "@/shared/ui/Input";
import Pagination from "@/shared/ui/Pagination";
import { useAdminData } from "@/features/admin/hooks/useAdminData";

export default function SuperadminReviewersTab() {
  const {
    users = [],
    loading = false,
    usersPagination: pagination,
    fetchUsers,
  } = useAdminData();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typeof fetchUsers === "function") {
      fetchUsers(pagination?.currentPage || 1, {
        search: debouncedSearch.trim(),
        role: "reviewer",
      });
    }
  }, [pagination?.currentPage, debouncedSearch, fetchUsers]);

  const reviewerList = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-6 text-left">
      {/* ФІЛЬТРИ ТА ПОШУК (Фіксований блок у DOM) */}
      <div className="bg-bg-secondary p-3 rounded-xl border border-border-color">
        <Input
          placeholder="Шукати рецензента за ім'ям або email..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && reviewerList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rectangle" height="300px" />
          ))}
        </div>
      ) : reviewerList.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-bg-secondary/40 border-dashed">
          <UserCheck className="mx-auto text-text-muted opacity-50" size={48} />
          <p className="text-sm font-mono text-text-muted">
            Наразі рецензентів у системі не знайдено.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviewerList.map((rev) => {
            const domains = rev.allowedDomains || [];
            const types = rev.allowedTypes || [];

            return (
              <Card
                key={rev._id}
                className="flex flex-col p-5 border-border-color hover:border-purple-600/40 transition-all bg-bg-secondary/50 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-600 text-base shrink-0 overflow-hidden">
                    {rev.image ? (
                      <img
                        src={rev.image}
                        alt={rev.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      rev.name?.charAt(0)?.toUpperCase() || "R"
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-text-primary truncate group-hover:text-purple-600 transition-colors">
                      {rev.name}
                    </h3>
                    <span className="text-xs font-mono text-purple-600 font-semibold block truncate">
                      {rev.academicDegree || "Дослідник"}
                    </span>
                  </div>

                  <Badge
                    status={
                      rev.isBanned
                        ? "danger"
                        : rev.isReviewerActive
                          ? "success"
                          : "warning"
                    }
                  >
                    {rev.isBanned
                      ? "Banned"
                      : rev.isReviewerActive
                        ? "Активний"
                        : "Неактивний"}
                  </Badge>
                </div>

                <div className="space-y-3 flex-grow text-xs font-mono">
                  <div className="space-y-1 bg-bg-tertiary/40 p-2.5 rounded-lg border border-border-color/40">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail size={12} className="text-text-muted shrink-0" />
                      <span className="truncate">{rev.email}</span>
                    </div>
                    {rev.city && (
                      <div className="flex items-center gap-2 text-text-muted">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{rev.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold flex items-center gap-1">
                      <Tag size={11} className="text-purple-600" /> Наукові
                      галузі:
                    </span>
                    {domains.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {domains.map((d, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-md border border-border-color/60 font-mono"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-text-muted italic">
                        Не вказано (усі)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold flex items-center gap-1">
                      <BookOpen size={11} className="text-purple-600" /> Типи
                      робіт:
                    </span>
                    {types.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {types.map((t, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-md border border-purple-500/20 font-mono font-bold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-text-muted italic">
                        Не вказано (усі)
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {reviewerList.length > 0 && pagination && (
        <Pagination
          currentPage={pagination.currentPage || 1}
          totalPages={pagination.totalPages || 1}
          onPageChange={(page) =>
            fetchUsers(page, {
              search: debouncedSearch.trim(),
              role: "reviewer",
            })
          }
        />
      )}
    </div>
  );
}
