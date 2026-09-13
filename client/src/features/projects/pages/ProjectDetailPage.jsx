import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  MessageSquare,
  Calendar,
  Award,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Shield,
  Star,
} from "lucide-react";
import { useProjectDetails } from "../hooks/useProjectDetails";
import ProjectChatModal from "../components/ProjectChatModal";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";

export default function ProjectDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, loading, error } = useProjectDetails(id);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getFileExtension = (fileName, fileUrl) => {
    const name = fileName || fileUrl || "";
    const ext = name.split(".").pop()?.toUpperCase();
    if (ext && ext.length <= 4 && !ext.includes("/")) {
      return ext;
    }
    return "файл";
  };

  const getCleanFileName = (fileName, fileUrl) => {
    if (!fileName && !fileUrl) return "Основний документ";

    let name = fileName || fileUrl.split("/").pop() || "";

    try {
      name = decodeURIComponent(escape(name));
    } catch (e) {
      try {
        name = decodeURIComponent(name);
      } catch (err) {}
    }

    if (name.includes("raw/upload/")) {
      name = name.split("/").pop();
    }
    name = name.replace(/^\d+[-_]/, "");

    return name || "Основний документ";
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton variant="line" height="30px" className="w-1/4" />
        <Skeleton variant="rectangle" height="200px" />
        <Skeleton variant="rectangle" height="150px" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-bg-secondary rounded-xl border border-border-color space-y-4">
        <p className="text-red-500 text-sm font-semibold">
          {error || "Наукову працю не знайдено"}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Повернутися назад
        </Button>
      </div>
    );
  }

  const latestVersion = project.versions?.[project.versions.length - 1];

  const review = project.review;
  const feedbackComment = review?.publicComment || project.reviewerComments;
  const feedbackRecommendation =
    review?.recommendation || project.reviewerRecommendation;
  const hasReview =
    Boolean(review) ||
    Boolean(feedbackComment) ||
    Boolean(feedbackRecommendation);

  const isAccepted = project.status === "Прийнято";
  const isRejected = project.status === "Відхилено";

  const isManagementOrReviewer =
    currentUser &&
    (currentUser.role === "superadmin" ||
      currentUser.role === "admin" ||
      currentUser.role === "reviewer");

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 text-left mt-15">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-mono text-text-muted hover:text-brand transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Назад до списку
        </button>

        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge status="success">
                {project.programId?.type || "Публікація"}
              </Badge>
              <Badge status="default">{project.status || "На розгляді"}</Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={MessageSquare}
              onClick={() => setIsChatOpen(true)}
            >
              Чат обговорення
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-text-primary leading-snug">
            {project.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-xs font-mono text-text-muted pt-2 border-t border-border-color">
            <span className="flex items-center gap-1">
              <Tag size={12} className="text-brand" /> Галузь:{" "}
              <strong className="text-text-primary">{project.domain}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Award size={12} className="text-brand" /> Програма:{" "}
              <strong className="text-text-primary">
                {project.programId?.title || "Загальна"}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Подано:{" "}
              <strong className="text-text-primary">
                {new Date(project.createdAt).toLocaleDateString()}
              </strong>
            </span>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
            // Анотація праці
          </h3>
          <div
            className="prose max-w-none text-sm text-text-secondary leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        </Card>

        {hasReview && (
          <Card className="p-6 space-y-4 border-l-4 border-l-brand">
            <div className="flex flex-wrap items-center justify-between border-b border-border-color/60 pb-3 gap-2">
              <div className="flex items-center gap-2">
                {isAccepted ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : isRejected ? (
                  <XCircle size={18} className="text-rose-500" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500" />
                )}
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-text-primary">
                  Результати рецензування
                </h3>
              </div>

              {review?.totalScore !== undefined && (
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-brand bg-brand/10 px-2.5 py-1 rounded border border-brand/20">
                  <Star size={13} className="fill-brand" />
                  <span>Оцінка: {review.totalScore} / 5</span>
                </div>
              )}
            </div>

            {isManagementOrReviewer && project.reviewer ? (
              <div className="p-3 rounded bg-bg-tertiary border border-border-color/50 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-brand shrink-0" />
                  <span className="text-text-secondary">Експерт:</span>
                  <strong className="text-text-primary">
                    {project.reviewer.name} ({project.reviewer.email})
                  </strong>
                </div>
                {project.reviewer.academicDegree && (
                  <span className="text-[10px] text-text-muted">
                    {project.reviewer.academicDegree}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted bg-bg-tertiary/40 px-3 py-1.5 rounded">
                <Shield size={12} className="text-brand shrink-0" />
                <span>
                  Оцінювання проведено незалежним експертом (Blind Review)
                </span>
              </div>
            )}

            {feedbackRecommendation && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase font-bold">
                  Рекомендація експерта:
                </span>
                <p className="text-xs font-medium text-text-primary italic">
                  "{feedbackRecommendation}"
                </p>
              </div>
            )}

            {feedbackComment && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-text-muted uppercase font-bold">
                  Коментарі та зауваження:
                </span>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-bg-primary p-3 rounded border border-border-color font-sans">
                  {feedbackComment}
                </p>
              </div>
            )}

            {review?.scores && Object.keys(review.scores).length > 0 && (
              <div className="pt-2 border-t border-border-color/60 space-y-2">
                <span className="text-[10px] font-mono text-text-muted uppercase font-bold">
                  Оцінка за критеріями:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(review.scores).map(([criterion, score]) => (
                    <div
                      key={criterion}
                      className="flex items-center justify-between p-2 rounded bg-bg-primary border border-border-color/40"
                    >
                      <span className="text-text-muted capitalize">
                        {criterion}
                      </span>
                      <span className="font-bold text-brand">{score} / 5</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
            // Документи та версії
          </h3>

          {latestVersion?.fileUrl ? (
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl border border-border-color">
              <div className="space-y-1 max-w-[65%]">
                <span
                  className="text-xs font-bold text-text-primary block truncate font-mono"
                  title={getCleanFileName(
                    latestVersion.fileName,
                    latestVersion.fileUrl,
                  )}
                >
                  {getCleanFileName(
                    latestVersion.fileName,
                    latestVersion.fileUrl,
                  )}
                </span>
                <span className="text-[10px] font-mono text-text-muted block">
                  Завантажено:{" "}
                  {new Date(latestVersion.createdAt).toLocaleDateString()}
                </span>
              </div>

              <a
                href={latestVersion.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button variant="primary" size="sm" icon={Download}>
                  Завантажити{" "}
                  {getFileExtension(
                    latestVersion.fileName,
                    latestVersion.fileUrl,
                  )}
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-xs font-mono text-text-muted">
              Файли матеріалів відсутні або знаходяться на опрацюванні.
            </p>
          )}
        </Card>

        {isChatOpen && (
          <ProjectChatModal
            project={project}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      <Footer />
    </>
  );
}
