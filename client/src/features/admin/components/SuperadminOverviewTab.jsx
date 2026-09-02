import React, { useEffect, useState } from "react";
import AnalyticsCard from "@/shared/ui/AnalyticsCard";
import Alert from "@/shared/ui/Alert";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";
import BroadcastModal from "@/features/admin/components/BroadcastModal";
import OverviewCharts from "@/features/admin/components/OverviewCharts";
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Plus,
  Send,
  Building2,
} from "lucide-react";

export default function SuperadminOverviewTab({
  analytics,
  loading,
  onFetchAnalytics,
  onTabChange,
  ц,
}) {
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  useEffect(() => {
    onFetchAnalytics?.();
  }, [onFetchAnalytics]);

  const kpis = analytics?.kpis || {};
  const hasPendingOrgs = (kpis.pendingOrganizations || 0) > 0;
  const hasUnassignedProjects = (kpis.unassignedProjects || 0) > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-3">
        {hasPendingOrgs && (
          <Alert
            variant="warning"
            title="Модерація установ"
            className="bg-amber-500/5 border-amber-500/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
              <span className="font-mono text-xs">
                У черзі перебуває{" "}
                <strong className="text-amber-500 font-bold">
                  {kpis.pendingOrganizations}
                </strong>{" "}
                нових установ, які очікують підтвердження коду ЄДРПОУ.
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRight}
                onClick={() => onTabChange?.("organizations")}
                className="shrink-0 font-mono text-[11px] uppercase tracking-wider"
              >
                До модерації
              </Button>
            </div>
          </Alert>
        )}

        {hasUnassignedProjects && (
          <Alert
            variant="danger"
            title="Черга авторозподілу рецензентів"
            className="bg-red-500/5 border-red-500/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
              <span className="font-mono text-xs">
                Увага!{" "}
                <strong className="text-red-500 font-bold">
                  {kpis.unassignedProjects}
                </strong>{" "}
                праць не отримали рецензента (відсутні активні експерти
                відповідного профілю).
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRight}
                onClick={() => onTabChange?.("projects")}
                className="shrink-0 font-mono text-[11px] uppercase tracking-wider"
              >
                Призначити ручно
              </Button>
            </div>
          </Alert>
        )}

        {!hasPendingOrgs && !hasUnassignedProjects && (
          <Alert variant="success" title="Система працює в штатному режимі">
            Усі заявки опраційовані, а роботи розподілені між активними
            рецензентами.
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton variant="line" className="w-1/2" />
              <Skeleton variant="rectangle" className="h-8 w-20" />
              <Skeleton variant="line" className="w-3/4" />
            </Card>
          ))
        ) : (
          <>
            <div
              onClick={() => onTabChange?.("users")}
              className="cursor-pointer"
            >
              <AnalyticsCard
                title="Дослідники"
                value={kpis.totalUsers || 0}
                trend={
                  kpis.bannedUsers ? `${kpis.bannedUsers} забанено` : "Активні"
                }
                trendType={kpis.bannedUsers ? "down" : "up"}
                description="Користувачі платформи"
              />
            </div>

            <div
              onClick={() => onTabChange?.("organizations")}
              className="cursor-pointer"
            >
              <AnalyticsCard
                title="Установи"
                value={kpis.approvedOrganizations || 0}
                trend={
                  hasPendingOrgs
                    ? `+${kpis.pendingOrganizations} у черзі`
                    : "Усі верифіковані"
                }
                trendType={hasPendingOrgs ? "down" : "up"}
                description="Офіційні заклади та НДІ"
              />
            </div>

            <div
              onClick={() => onTabChange?.("programs")}
              className="cursor-pointer"
            >
              <AnalyticsCard
                title="Програми"
                value={kpis.activePrograms || 0}
                description="Конкурси, гранти та журнали"
              />
            </div>

            <div
              onClick={() => onTabChange?.("projects")}
              className="cursor-pointer"
            >
              <AnalyticsCard
                title="Наукові праці"
                value={kpis.totalProjects || 0}
                trend={
                  hasUnassignedProjects
                    ? `${kpis.unassignedProjects} без рецензента`
                    : "В рецензії"
                }
                trendType={hasUnassignedProjects ? "down" : "up"}
                description="Подані роботи у систему"
              />
            </div>
          </>
        )}
      </div>

      <OverviewCharts
        domainData={analytics?.domainDistribution || []}
        programTypesData={analytics?.programTypesDistribution || []}
        kpis={kpis}
      />

      <Card className="p-6 bg-bg-secondary border-border-color space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand">
          <Sparkles size={14} />
          <span>Швидкі дії та системні інструменти</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            size="md"
            icon={Send}
            onClick={() => setIsBroadcastOpen(true)}
            className="font-mono text-xs uppercase tracking-wider border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            Створити системне сповіщення
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={Building2}
            onClick={() => onTabChange?.("organizations")}
            className="font-mono text-xs uppercase tracking-wider"
          >
            Реєстр установ
          </Button>

          <Button
            variant="danger"
            size="md"
            icon={ShieldAlert}
            onClick={() => onTabChange?.("danger_zone")}
            className="font-mono text-xs uppercase tracking-wider"
          >
            Danger Zone
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
          Останні подані наукові праці
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTabChange?.("projects")}
          className="font-mono text-[10px] uppercase"
        >
          Усі праці
        </Button>
      </div>

      <Table
        headers={["Назва праці", "Галузь", "Автор", "Статус рецензії", "Дата"]}
      >
        {analytics?.recentProjects?.length > 0 ? (
          analytics.recentProjects.map((proj) => (
            <TableRow key={proj._id}>
              <TableCell className="font-semibold text-text-primary max-w-xs truncate">
                {proj.title}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {proj.domain || "Інше"}
              </TableCell>
              <TableCell className="text-xs">
                {proj.authorId?.name || "Анонім"}
              </TableCell>
              <TableCell>
                <Badge
                  status={
                    proj.reviewStatus === "В процесі"
                      ? "warning"
                      : proj.reviewStatus === "Не призначено"
                        ? "danger"
                        : "success"
                  }
                >
                  {proj.reviewStatus}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-text-muted">
                {new Date(proj.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center font-mono text-xs py-4"
            >
              Наукових праць ще не подано
            </TableCell>
          </TableRow>
        )}
      </Table>

      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </div>
  );
}
