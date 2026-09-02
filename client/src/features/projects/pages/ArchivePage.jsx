import React, { useState, useMemo } from "react";
import { Archive, BookOpen } from "lucide-react";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Skeleton from "@/shared/ui/Skeleton";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { SCIENTIFIC_DOMAINS } from "@/shared/lib/constants/domains";
import ProjectCard from "@/features/projects/components/ProjectCard";
import ProjectDetailModal from "@/features/projects/components/ProjectDetailModal";

const ALLOWED_ARCHIVE_TYPES = ["Науковий журнал", "Стаття", "Датасет"];

export default function ArchivePage() {
  const {
    projects,
    loading,
    filters,
    updateFilter,
    handleResetFilters,
    pagination,
  } = useProjects({}, 8, true);

  const [selectedProject, setSelectedProject] = useState(null);

  const typeOptions = useMemo(
    () => [
      { label: "Всі типи матеріалів", value: "Всі типи" },
      ...ALLOWED_ARCHIVE_TYPES.map((t) => ({ label: t, value: t })),
    ],
    [],
  );

  const domainOptions = useMemo(
    () => [
      { label: "Всі галузі науки", value: "Всі галузі" },
      ...(SCIENTIFIC_DOMAINS || []).map((d) => ({ label: d, value: d })),
    ],
    [],
  );

  const getDownloadUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/");
    return `/api/${cleanPath}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow pt-40 pb-24 px-3 lg:px-0 relative">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-border-color/65 pb-8 w-full">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest font-mono">
                <Archive size={11} /> Відкритий науковий репозиторій
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                Архів <span className="text-brand">праць</span>
              </h1>
              <p className="text-xs md:text-sm font-medium text-text-secondary leading-relaxed opacity-95">
                Реєстр верифікованих, рецензованих та прийнятих до публікації
                наукових матеріалів, статей та датасетів.
              </p>
            </div>

            <div className="flex gap-4 font-mono text-[10px] uppercase text-text-secondary font-bold tracking-wider shrink-0 bg-bg-secondary/50 border border-border-color p-4 rounded-2xl backdrop-blur-xs">
              <div className="text-left">
                <span className="block text-emerald-500 font-black text-sm leading-none mb-1">
                  {pagination.totalItems || projects.length}
                </span>
                <span>Публікацій у базі</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-bg-secondary/60 p-4 rounded-2xl border border-border-color backdrop-blur-xs w-full items-center">
            <div className="md:col-span-2">
              <Input
                placeholder="Швидкий пошук за назвою або автором..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
            <div>
              <Select
                options={typeOptions}
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value)}
              />
            </div>
            <div>
              <Select
                options={domainOptions}
                value={filters.domain}
                onChange={(e) => updateFilter("domain", e.target.value)}
              />
            </div>
          </div>

          {(filters.search ||
            filters.type !== "Всі типи" ||
            filters.domain !== "Всі галузі") && (
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
                  className="border border-border-color rounded-xl p-5 space-y-4 bg-bg-secondary h-[220px]"
                >
                  <Skeleton variant="line" width="60%" />
                  <Skeleton variant="rectangle" height="60px" />
                  <Skeleton variant="line" width="40%" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-28 text-center border border-dashed border-border-color bg-bg-secondary/10 rounded-3xl w-full">
              <BookOpen size={40} className="mx-auto text-brand/20 mb-4" />
              <h4 className="text-base font-black text-text-primary uppercase tracking-tight mb-1">
                Архів порожній або нічого не знайдено
              </h4>
              <p className="font-mono text-[9px] uppercase tracking-wider text-text-secondary opacity-80">
                За вказаними параметрами жодної прийнятої праці не знайдено.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onSelectProject={setSelectedProject}
                  getDownloadUrl={getDownloadUrl}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          getDownloadUrl={getDownloadUrl}
        />
      )}
    </div>
  );
}
