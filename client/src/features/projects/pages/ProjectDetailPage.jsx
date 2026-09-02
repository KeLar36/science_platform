import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  MessageSquare,
  Calendar,
  Award,
  Tag,
} from "lucide-react";
import { useProjectDetails } from "../hooks/useProjectDetails";
import ProjectChatModal from "../components/ProjectChatModal";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, loading, error } = useProjectDetails(id);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

        <Card className="p-6 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
            // Документи та версії
          </h3>

          {latestVersion?.fileUrl ? (
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl border border-border-color">
              <div className="space-y-1">
                <span className="text-xs font-bold text-text-primary block">
                  {latestVersion.fileName || "Основний документ (PDF)"}
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
              >
                <Button variant="primary" size="sm" icon={Download}>
                  Завантажити PDF
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
