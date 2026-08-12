import React, { useMemo } from "react";
import { BookOpen, Layers } from "lucide-react";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Skeleton from "@/shared/ui/Skeleton";
import Pagination from "@/shared/ui/Pagination";
import ProgramCard from "@/features/programs/components/ProgramCard";
import { usePrograms } from "@/features/programs/hooks/usePrograms";
import {
  SCIENTIFIC_DOMAINS,
  PROGRAM_TYPES,
} from "@/shared/lib/constants/domains";

export default function ProgramsPage() {
  const {
    programs,
    organizations,
    loading,
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
  } = usePrograms();

  const typeOptions = useMemo(
    () => [
      { label: "Всі типи конкурсу", value: "Всі типи" },
      ...PROGRAM_TYPES.map((t) => ({ label: t, value: t })),
    ],
    [],
  );

  const domainOptions = useMemo(
    () => [
      { label: "Всі галузі науки", value: "Всі галузі" },
      ...SCIENTIFIC_DOMAINS.map((d) => ({ label: d, value: d })),
    ],
    [],
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow pt-40 pb-24 px-3 lg:px-0 relative">
        <div className="absolute inset-0 opacity-25 pointer-events-none z-0 bg-[radial-gradient(var(--border-color)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-brand/[0.02] blur-[130px] rounded-full z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-border-color/65 pb-8 w-full">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest font-mono">
                <Layers size={11} /> Навігатор можливостей
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                Наукові <span className="text-brand">програми</span>
              </h1>
              <p className="text-xs md:text-sm font-medium text-text-secondary leading-relaxed opacity-95">
                Досліджуйте актуальні міжнародні гранти, верифіковані фахові
                видання, наукові конференції та програми стажування.
              </p>
            </div>

            <div className="flex gap-4 font-mono text-[10px] uppercase text-text-secondary font-bold tracking-wider shrink-0 bg-bg-secondary/50 border border-border-color p-4 rounded-2xl backdrop-blur-xs">
              <div className="text-left">
                <span className="block text-text-primary font-black text-sm leading-none mb-1">
                  {totalItems}
                </span>
                <span>Знайдено</span>
              </div>
              <div className="w-px bg-border-color h-8" />
              <div className="text-left">
                <span className="block text-brand font-black text-sm leading-none mb-1">
                  {organizations.length}
                </span>
                <span>Установ</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-bg-secondary/60 p-4 rounded-2xl border border-border-color backdrop-blur-xs w-full items-center">
            <div className="md:col-span-2">
              <Input
                placeholder="Пошук можливостей за назвою, тегами або закладом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select
                options={typeOptions}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              />
            </div>
            <div>
              <Select
                options={domainOptions}
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              />
            </div>
          </div>

          {(searchTerm ||
            selectedType !== "Всі типи" ||
            selectedDomain !== "Всі галузі") && (
            <div className="flex justify-start">
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-mono uppercase tracking-wider text-brand hover:underline cursor-pointer"
              >
                // Скинути налаштування фільтрації
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border border-border-color rounded-xl p-5 space-y-4 bg-bg-secondary h-[260px]"
                >
                  <div className="flex justify-between">
                    <Skeleton variant="line" width="80px" />{" "}
                    <Skeleton variant="line" width="60px" />
                  </div>
                  <Skeleton variant="rectangle" height="40px" />
                  <Skeleton variant="rectangle" height="60px" />
                  <div className="flex justify-between pt-4 border-t border-border-color">
                    <Skeleton variant="line" width="100px" />{" "}
                    <Skeleton variant="line" width="60px" />
                  </div>
                </div>
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="py-28 text-center border border-dashed border-border-color bg-bg-secondary/10 rounded-3xl w-full">
              <BookOpen size={40} className="mx-auto text-brand/20 mb-4" />
              <h4 className="text-base font-black text-text-primary uppercase tracking-tight mb-1">
                Параметри пошуку пусті
              </h4>
              <p className="font-mono text-[9px] uppercase tracking-wider text-text-secondary opacity-80">
                За вказаними фільтрами жодної наукової програми не знайдено.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((p) => (
                  <ProgramCard key={p._id} program={p} isUrgent={p.isUrgent} />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
