import React, { useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import Modal from "@/shared/ui/Modal";
import TextArea from "@/shared/ui/TextArea";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import { projectApi } from "@/features/projects/api/projectApi";

export default function UploadNewVersionModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [authorComment, setAuthorComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!project) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("Розмір файлу перевищує 25 MB");
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Будь ласка, оберіть оновлений файл праці (PDF/DOCX/XLSX)");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorComment", authorComment.trim());

      await projectApi.uploadNewVersion(project._id, formData);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Помилка завантаження нової версії:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Не вдалося завантажити нову версію праці",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Переподача праці: ${project.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {project.reviewerComments && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 text-xs">
            <span className="font-mono font-bold text-amber-600 uppercase text-[10px]">
              Зауваження рецензента:
            </span>
            <p className="text-text-primary leading-relaxed whitespace-pre-line">
              {project.reviewerComments}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
            Оновлений файл праці (до 25 MB) *
          </label>
          <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border-color">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.xlsx"
              className="hidden"
              id="re-upload-file"
            />
            <label
              htmlFor="re-upload-file"
              className="px-3 py-1.5 bg-bg-tertiary hover:bg-border-color text-text-primary text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Upload size={14} /> Обрати файл
            </label>
            <span className="text-xs text-text-muted truncate font-mono">
              {file ? file.name : "Файл не обрано"}
            </span>
          </div>
        </div>

        <div>
          <TextArea
            label="Коментар до виправлень (що було змінено)"
            placeholder="Опишіть, які саме зауваження рецензента ви врахували у цій версії..."
            value={authorComment}
            onChange={(e) => setAuthorComment(e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Скасувати
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={CheckCircle2}
            isLoading={submitting}
            disabled={!file}
          >
            Надіслати нову версію
          </Button>
        </div>
      </form>
    </Modal>
  );
}
