import BlogHero from "@/features/blog/components/BlogHero";
import { usePosts } from "@/features/blog/hooks/usePosts";
import PostFilters from "@/features/blog/components/PostFilters";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import PostList from "@/features/blog/components/PostList";
import Pagination from "@/shared/ui/Pagination";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";

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
  } = usePosts({ status: "published", organizationId: "null" }, 8);

  const breadcrumbItems = [
    { label: "Головна", href: "/" },
    { label: "Публікації", active: true },
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col transition-colors duration-300 select-none relative overflow-hidden">
      {/* Декоративний фон */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-brand opacity-[0.02] dark:opacity-[0.04] blur-[130px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-3 lg:px-0 relative z-10">
        <div className="max-w-7xl mx-auto space-y-10 min-w-0">
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
            <div className="mt-12 animate-in fade-in duration-300">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={changePage}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
