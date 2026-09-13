import React, { useState } from "react";
import { useReviewerQueue } from "@/features/reviewer/hooks/useReviewerQueue";
import ReviewerCard from "@/features/reviewer/components/ReviewerCard";
import ProjectChatModal from "@/features/projects/components/ProjectChatModal";
import ReviewFormModal from "@/features/reviewer/components/ReviewFormModal";
import Pagination from "@/shared/ui/Pagination";
import Skeleton from "@/shared/ui/Skeleton";
import Card from "@/shared/ui/Card";
import { Inbox } from "lucide-react";

export default function ReviewerQueueTab() {
  const { projects, loading, pagination, changePage, refreshQueue } =
    useReviewerQueue();

  const [activeChatProject, setActiveChatProject] = useState(null);
  const [activeReviewProject, setActiveReviewProject] = useState(null);

  const handleReviewSuccess = () => {
    setActiveReviewProject(null);
    refreshQueue();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="rectangle" height="120px" />
        <Skeleton variant="rectangle" height="120px" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {projects.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-bg-secondary/40">
          <Inbox className="mx-auto text-text-muted" size={32} />
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

      {activeChatProject && (
        <ProjectChatModal
          project={activeChatProject}
          onClose={() => setActiveChatProject(null)}
        />
      )}

      {activeReviewProject && (
        <ReviewFormModal
          project={activeReviewProject}
          isOpen={!!activeReviewProject}
          onClose={() => setActiveReviewProject(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
