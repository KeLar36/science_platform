import { useEffect } from "react";
import BlogHero from "@/features/blog/components/BlogHero";
import { usePosts } from "@/features/blog/hooks/usePosts";
import PostFilters from "@/features/blog/components/PostFilters";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PostList from "@/features/blog/components/PostList";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Button from "@/shared/ui/Button";

export default function BlogPage() {
  const {
    posts,
    isLoading,
    error,
    filters,
    pagination,
    updateFilter,
    applySearch,
    resetFilters,
    changePage,
  } = usePosts({ status: "published" }, 8);

  const breadcrumbItems = [
    { label: "Головна", href: "/" },
    { label: "Публікації", active: true },
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col transition-colors duration-300 select-none relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-brand opacity-[0.02] dark:opacity-[0.04] blur-[130px] pointer-events-none" />

      <Navbar />
      <main className="flex-grow pt-32 pb-24 px-3 lg:px-0 relative z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <Breadcrumbs items={breadcrumbItems} />
          <BlogHero />
          <PostFilters
            filters={filters}
            updateFilter={updateFilter}
            applySearch={applySearch}
            resetFilters={resetFilters}
          />

          <PostList posts={posts} isLoading={isLoading} error={error} />

          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 animate-in fade-in duration-300">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((p) => {
                const isActive = pagination.currentPage === p;
                return (
                  <Button
                    key={p}
                    variant={isActive ? "primary" : "secondary"}
                    onClick={() => changePage(p)}
                    className={`w-10 h-10 !p-0 font-mono text-xs font-black tracking-wider transition-all duration-200 ${
                      isActive ? "scale-105 shadow-md shadow-brand/10" : ""
                    }`}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
