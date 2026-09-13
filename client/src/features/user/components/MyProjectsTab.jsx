import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  FileText,
  Award,
  Eye,
  MessageSquare,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import Skeleton from "@/shared/ui/Skeleton";
import Pagination from "@/shared/ui/Pagination";
import UploadNewVersionModal from "@/features/user/components/UploadNewVersionModal";

export default function MyProjectsTab({
  projects = [],
  loading,
  onPageChange,
  onOpenChat,
  onRefresh,
}) {
  const [reUploadProject, setReUploadProject] = useState(null);

  const projectList = Array.isArray(projects)
    ? projects
    : projects?.projects || [];

  const totalPages = projects?.totalPages || 1;
  const currentPage = projects?.currentPage || 1;
  const totalItems = projects?.totalItems ?? projectList.length;

  const getStatusBadge = (status, reviewStatus) => {
    if (status === "Прийнято" || status === "approved") {
      return <Badge status="success">Прийнято</Badge>;
    }
    if (status === "Відхилено" || status === "rejected") {
      return <Badge status="danger">Відхилено</Badge>;
    }
    if (
      status === "На доопрацюванні" ||
      status === "needs_revision" ||
      reviewStatus === "На доопрацюванні"
    ) {
      return <Badge status="warning">На доопрацюванні</Badge>;
    }
    return <Badge status="default">На розгляді</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="rectangle" height="70px" />
        <Skeleton variant="rectangle" height="70px" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-text-muted">
          Всього подано праць:{" "}
          <strong className="text-text-primary">{totalItems}</strong>
        </span>
        <Link to="/programs">
          <Button variant="primary" size="sm" icon={PlusCircle}>
            Подати нову працю
          </Button>
        </Link>
      </div>

      {projectList.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-bg-secondary/40">
          <FileText className="mx-auto text-text-muted" size={32} />
          <p className="text-xs font-mono text-text-muted">
            Ви ще не подавали жодної наукової праці.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {projectList.map((project) => {
              const programName =
                project.programId?.title ||
                project.program?.title ||
                project.programName ||
                "Загальна програма";

              const programId =
                project.programId?._id ||
                project.programId ||
                project.program?._id;

              const isNeedsRevision =
                project.status === "На доопрацюванні" ||
                project.status === "needs_revision" ||
                project.reviewStatus === "На доопрацюванні";

              const isAccepted = project.status === "Прийнято";
              const isRejected = project.status === "Відхилено";

              const hasReviewerFeedback =
                Boolean(project.reviewerComments) ||
                Boolean(project.reviewerRecommendation);

              return (
                <Card key={project._id} hoverable className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-brand font-bold uppercase">
                          [{project.domain || "Загальна"}]
                        </span>

                        <div className="flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded border border-border-color">
                          <Award size={12} className="text-brand shrink-0" />
                          {programId ? (
                            <Link
                              to={`/programs/${programId}`}
                              className="hover:text-brand hover:underline truncate max-w-[220px]"
                              title={programName}
                            >
                              {programName}
                            </Link>
                          ) : (
                            <span className="truncate max-w-[220px]">
                              {programName}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-text-muted">
                          • {new Date(project.createdAt).toLocaleDateString()}
                        </span>

                        {project.versions && project.versions.length > 1 && (
                          <span className="text-[10px] font-mono text-brand font-bold">
                            v{project.versions.length}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs text-text-primary font-sans leading-snug">
                        {project.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(project.status, project.reviewStatus)}

                      {isNeedsRevision && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={UploadCloud}
                          onClick={() => setReUploadProject(project)}
                          className="!px-2.5 text-xs animate-pulse"
                          title="Завантажити виправлену версію"
                        >
                          Переподати
                        </Button>
                      )}

                      {onOpenChat && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={MessageSquare}
                          onClick={() => onOpenChat(project)}
                          className="!p-1.5"
                          title="Чат рецензування"
                        />
                      )}

                      <Link to={`/projects/${project._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          className="!p-1.5"
                          title="Переглянути деталі праці"
                        />
                      </Link>
                    </div>
                  </div>

                  {hasReviewerFeedback && (
                    <div
                      className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                        isAccepted
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : isRejected
                            ? "bg-rose-500/5 border-rose-500/20"
                            : "bg-bg-secondary border-border-color"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase">
                        <div className="flex items-center gap-1.5">
                          {isAccepted ? (
                            <CheckCircle2
                              size={13}
                              className="text-emerald-500"
                            />
                          ) : isRejected ? (
                            <XCircle size={13} className="text-rose-500" />
                          ) : (
                            <AlertTriangle
                              size={13}
                              className="text-amber-500"
                            />
                          )}
                          <span
                            className={
                              isAccepted
                                ? "text-emerald-500"
                                : isRejected
                                  ? "text-rose-500"
                                  : "text-amber-500"
                            }
                          >
                            Висновок рецензента:
                          </span>
                        </div>

                        {project.review?.totalScore !== undefined && (
                          <span className="text-brand font-bold bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                            Оцінка: {project.review.totalScore} / 5
                          </span>
                        )}
                      </div>

                      {project.reviewerRecommendation && (
                        <p className="font-medium text-text-primary italic text-[11px]">
                          "{project.reviewerRecommendation}"
                        </p>
                      )}

                      {project.reviewerComments && (
                        <p className="text-text-muted leading-relaxed whitespace-pre-line text-[11px]">
                          {project.reviewerComments}
                        </p>
                      )}

                      {project.review?.scores &&
                        Object.keys(project.review.scores).length > 0 && (
                          <div className="pt-2 border-t border-border-color/40 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                            {Object.entries(project.review.scores).map(
                              ([criterion, score]) => (
                                <div
                                  key={criterion}
                                  className="flex justify-between px-2 py-1 rounded bg-bg-tertiary"
                                >
                                  <span className="text-text-muted capitalize">
                                    {criterion}:
                                  </span>
                                  <span className="font-bold text-brand">
                                    {score}/5
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}

      {reUploadProject && (
        <UploadNewVersionModal
          project={reUploadProject}
          isOpen={!!reUploadProject}
          onClose={() => setReUploadProject(null)}
          onSuccess={() => {
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
