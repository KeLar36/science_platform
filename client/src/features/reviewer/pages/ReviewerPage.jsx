import React, { useState, useEffect } from "react";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Alert from "@/shared/ui/Alert";
import Pagination from "@/shared/ui/Pagination";
import ReviewerCard from "@/features/reviewer/components/ReviewerCard";
import ReviewerFormModal from "@/features/reviewer/components/ReviewerFormModal";
import ProjectChatModal from "@/features/projects/components/ProjectChatModal";
import { useReviewerQueue } from "@/features/reviewer/hooks/useReviewerQueue";
import { Inbox, CheckSquare } from "lucide-react";

export default function ReviewerPage() {
  const { projects, loading, pagination, changePage, refreshQueue } =
    useReviewerQueue();

  const [activeChatProject, setActiveChatProject] = useState(null);
  const [activeReviewProject, setActiveReviewProject] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const handleReviewSuccess = () => {
    refreshQueue();
    setAlertMessage(
      "Рішення та рецензію успішно збережено й відправлено автору!",
    );
  };

  const breadcrumbItems = [
    { label: "Особистий кабінет", href: "/profile" },
    { label: "Зона рецензента", active: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-3 lg:px-0 max-w-5xl mx-auto w-full space-y-6 relative z-10">
        <Breadcrumbs items={breadcrumbItems} />

        {alertMessage && (
          <Alert variant="success" onClose={() => setAlertMessage(null)}>
            {alertMessage}
          </Alert>
        )}

        <div className="flex items-center justify-between gap-4 p-6 bg-bg-secondary/60 border border-border-color rounded-2xl text-left">
          <div className="space-y-1">
            <h1 className="text-xl font-black font-sans uppercase tracking-tight text-text-primary flex items-center gap-2">
              <CheckSquare size={22} className="text-brand" /> Робоча зона
              рецензента
            </h1>
            <p className="text-xs font-mono text-text-muted">
              Управління чергою призначених наукових праць, оцінювання та діалог
              із авторами.
            </p>
          </div>
          <div className="text-right font-mono text-xs text-text-muted">
            Всього в черзі:{" "}
            <strong className="text-text-primary">
              {pagination.totalItems}
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton variant="rectangle" height="130px" />
            <Skeleton variant="rectangle" height="130px" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center space-y-3 bg-bg-secondary/40">
            <Inbox className="mx-auto text-text-muted" size={36} />
            <p className="text-xs font-mono text-text-muted">
              У вашій черзі рецензента наразі немає призначених проєктів.
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {projects.map((project) => (
                <ReviewerCard
                  key={project._id}
                  project={project}
                  onOpenChat={(proj) => setActiveChatProject(proj)}
                  onOpenReviewModal={(proj) => setActiveReviewProject(proj)}
                />
              ))}
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </>
        )}
      </main>

      {activeChatProject && (
        <ProjectChatModal
          project={activeChatProject}
          onClose={() => setActiveChatProject(null)}
        />
      )}

      {activeReviewProject && (
        <ReviewerFormModal
          project={activeReviewProject}
          isOpen={!!activeReviewProject}
          onClose={() => setActiveReviewProject(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      <Footer />
    </div>
  );
}
