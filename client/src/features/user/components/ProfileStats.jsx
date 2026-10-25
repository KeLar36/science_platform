import React from "react";
import AnalyticsCard from "@/shared/ui/AnalyticsCard";
import Skeleton from "@/shared/ui/Skeleton";

export default function ProfileStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangle" height="100px" />
        ))}
      </div>
    );
  }

  const successRate =
    stats?.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <AnalyticsCard
        title="Всього праць"
        value={stats?.total || 0}
        description="Загальна кількість поданих проєктів"
      />

      <AnalyticsCard
        title="Прийнято"
        value={stats?.accepted || 0}
        trend={successRate > 0 ? `${successRate}%` : undefined}
        trendType="up"
        description="Успішно схвалені роботи"
      />

      <AnalyticsCard
        title="На розгляді"
        value={stats?.pending || 0}
        description="В процесі рецензування"
      />

      <AnalyticsCard
        title="Потребують дій"
        value={stats?.needsRevision || 0}
        trend={stats?.needsRevision > 0 ? "Увага" : undefined}
        trendType="down"
        description="Відправлено на доопрацювання"
      />

      <AnalyticsCard
        title="Відхилено"
        value={stats?.rejected || 0}
        trend={stats?.rejected > 0 ? "Архів" : undefined}
        trendType="down"
        description="Не відповідають вимогам"
      />
    </div>
  );
}
