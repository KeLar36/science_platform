import { Search, RotateCcw } from "lucide-react";
import { CATEGORIES } from "@/shared/lib/constants/categories";
import { SCIENTIFIC_DOMAINS } from "@/shared/lib/constants/domains";

import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";

export default function PostFilters({
  filters,
  updateFilter,
  applySearch,
  resetFilters,
}) {
  const isFiltered =
    filters.search !== "" ||
    filters.category !== "Всі" ||
    (filters.domain && filters.domain !== "Всі");

  const domainOptions = [
    { value: "Всі", label: "Всі галузі" },
    ...(SCIENTIFIC_DOMAINS || []).map((dom) => ({ value: dom, label: dom })),
  ];

  const categoryOptions = [
    ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
  ];

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-bg-secondary p-4 rounded-lg border border-border-color shadow-sm">
      <div className="flex-1 relative flex items-center">
        <Input
          placeholder="Пошук публікацій за назвою (почніть вводити)..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pr-10"
        />
        <button
          onClick={applySearch}
          className="absolute right-3 p-1 text-text-muted hover:text-brand transition-colors rounded cursor-pointer"
          title="Шукати"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40 sm:w-48">
          <Select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            options={categoryOptions}
          />
        </div>

        <div className="w-40 sm:w-48">
          <Select
            value={filters.domain || "Всі"}
            onChange={(e) => updateFilter("domain", e.target.value)}
            options={domainOptions}
          />
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-red-500 bg-bg-tertiary/40 hover:bg-red-500/5 border border-border-color hover:border-red-500/20 rounded-lg transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-200"
            title="Скинути всі фільтри"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Скинути</span>
          </button>
        )}
      </div>
    </div>
  );
}
