import React from "react";
import {
  MessageSquare,
  CheckCircle2,
  FileText,
  FileArchive,
  Calendar,
  Award,
  FileCode2,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import Avatar from "@/shared/ui/Avatar";

export default function ReviewerCard({
  project,
  onOpenChat,
  onOpenReviewModal,
}) {
  const author = project.authorId;
  const programName =
    project.programId?.title || project.programTitle || "Наукова програма";

  const isAccepted =
    project.status === "Прийнято" || project.status === "approved";
  const isRejected =
    project.status === "Відхилено" || project.status === "rejected";
  const isCompleted = isAccepted || isRejected;

  const latestVersion =
    project.versions && project.versions.length > 0
      ? project.versions[project.versions.length - 1]
      : null;
  const authorComment = latestVersion?.authorComment;

  const fileName = latestVersion?.fileName || "";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isArchive = ["zip", "rar", "7z", "tar"].includes(ext);

  const getReviewStatusBadge = () => {
    if (isAccepted) return <Badge status="success">Прийнято</Badge>;
    if (isRejected) return <Badge status="danger">Відхилено</Badge>;
    if (project.reviewStatus === "На доопрацюванні") {
      return <Badge status="warning">На доопрацюванні</Badge>;
    }
    return <Badge status="default">В процесі перевірки</Badge>;
  };

  return (
    <Card hoverable className="p-4 space-y-3 text-left">
      {/* Шапка картки */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-color pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-brand font-bold uppercase">
            [{project.domain || "Загальна"}]
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded border border-border-color">
            <Award size={12} className="text-brand shrink-0" />
            <span className="truncate max-w-[200px]" title={programName}>
              {programName}
            </span>
          </div>
        </div>
        <div>{getReviewStatusBadge()}</div>
      </div>

      <div>
        <h3 className="font-bold text-md text-text-primary font-sans leading-snug my-3">
          {project.title}
        </h3>
        <p className="text-sm text-text-muted line-clamp-2 mb-3">
          {project.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 p-2.5 bg-bg-secondary rounded-lg border border-border-color text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={author?.image}
            name={author?.name || "Автор"}
            size="sm"
            className="w-8 h-8 text-[11px] shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-text-primary text-[11px] truncate">
              {author?.name || "Невідомий автор"}
            </span>
            <span className="text-[9px] font-mono text-text-muted truncate">
              {author?.email}
            </span>
          </div>
        </div>

        <div className="text-right font-mono text-[10px] text-text-muted shrink-0">
          <div className="flex items-center justify-end gap-1">
            <Calendar size={11} />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          {project.versions && project.versions.length > 0 && (
            <span className="text-brand font-bold block">
              Версія v{project.versions.length}
            </span>
          )}
        </div>
      </div>

      {/* Коментар автора (якщо є) */}
      {authorComment && (
        <div className="p-2.5 bg-bg-tertiary/60 rounded-lg border border-border-color text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-brand uppercase">
            <FileCode2 size={12} />
            <span>Коментар автора (Версія v{project.versions.length}):</span>
          </div>
          <p className="text-text-primary text-[11px] italic leading-relaxed whitespace-pre-line">
            "{authorComment}"
          </p>
        </div>
      )}

      {/* Панель дій */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          icon={MessageSquare}
          onClick={() => onOpenChat(project)}
          className="text-xs"
        >
          Обговорення / Чат
        </Button>

        <div className="flex items-center gap-2">
          {latestVersion?.fileUrl && (
            <a href={latestVersion.fileUrl} target="_blank" rel="noreferrer">
              <Button
                variant="outline"
                size="sm"
                icon={isArchive ? FileArchive : FileText}
              >
                {isArchive ? "Архів v" : "Файл v"}
                {project.versions.length}
              </Button>
            </a>
          )}

          <Button
            variant={isCompleted ? "outline" : "primary"}
            size="sm"
            icon={CheckCircle2}
            onClick={() => onOpenReviewModal(project)}
          >
            {isCompleted ? "Змінити рішення" : "Оцінити"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
