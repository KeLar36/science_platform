import React, { useState, useEffect } from "react";
import { UserCheck, Search } from "lucide-react";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Skeleton from "@/shared/ui/Skeleton";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { adminApi } from "@/features/admin/api/adminApi";
import { projectApi } from "@/features/projects/api/projectApi";

export default function AssignReviewerModal({
  isOpen,
  onClose,
  project,
  orgId,
  isSuperAdmin = false,
  onSuccess,
}) {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedReviewerId, setSelectedReviewerId] = useState("");

  const extractId = (target) => {
    if (!target) return null;
    if (typeof target === "string") return target;
    if (typeof target === "object") {
      return (
        target._id ||
        target.id ||
        target.organizationId?._id ||
        target.organizationId ||
        null
      );
    }
    return null;
  };

  const targetOrgId =
    extractId(orgId) ||
    extractId(project?.organizationId) ||
    extractId(project?.programId?.organizationId);

  useEffect(() => {
    if (isOpen) {
      const fetchReviewers = async () => {
        setLoading(true);
        setError(null);
        try {
          let reviewersList = [];

          if (isSuperAdmin || !targetOrgId) {
            const data = await adminApi.getAllUsers({
              role: "reviewer",
              limit: 100,
            });
            reviewersList = data.users || data || [];
          } else {
            const data = await organizationApi.getReviewers(targetOrgId);
            reviewersList = Array.isArray(data)
              ? data
              : data.reviewers || data.items || [];
          }

          setReviewers(reviewersList);
        } catch (err) {
          setError(
            err.response?.data?.message ||
              "Не вдалося завантажити список рецензентів",
          );
        } finally {
          setLoading(false);
        }
      };

      fetchReviewers();
    }
  }, [isOpen, targetOrgId, isSuperAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReviewerId) {
      return setError("Будь ласка, оберіть рецензента зі списку!");
    }

    try {
      setSubmitting(true);
      setError(null);

      await projectApi.assignReviewer(project._id, selectedReviewerId);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Не вдалося призначити рецензента",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviewers = reviewers.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Призначення рецензента: "${project?.title?.substring(0, 30)}..."`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="p-3 bg-bg-secondary/80 rounded-xl border border-border-color space-y-1 text-xs">
          <div className="font-bold text-text-primary">{project?.title}</div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-text-muted">
            <span>
              Галузь:{" "}
              <strong className="text-purple-600">
                {project?.domain || "Загальна"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Автор: <strong>{project?.authorId?.name || "—"}</strong>
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
            {isSuperAdmin || !targetOrgId
              ? "Оберіть рецензента із загальної бази"
              : "Оберіть рецензента вашої організації"}
          </label>
          <Input
            placeholder="Шукати за ім'ям або email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <Skeleton variant="rectangle" height="180px" />
        ) : filteredReviewers.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-text-muted border border-dashed border-border-color rounded-xl">
            Активних рецензентів за вашим запитом не знайдено.
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredReviewers.map((rev) => {
              const isSelected = selectedReviewerId === rev._id;
              const matchesDomain = rev.allowedDomains?.includes(
                project?.domain,
              );

              return (
                <div
                  key={rev._id}
                  onClick={() => setSelectedReviewerId(rev._id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-purple-600 bg-purple-500/10"
                      : "border-border-color bg-bg-secondary/40 hover:bg-bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {rev.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-text-primary truncate flex items-center gap-1.5">
                        <span>{rev.name}</span>
                        {matchesDomain && (
                          <span className="text-[9px] bg-green-500/20 text-green-500 px-1 rounded font-mono font-normal">
                            Підходить за галуззю
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-text-muted truncate">
                        {rev.email}{" "}
                        {rev.academicDegree ? `• ${rev.academicDegree}` : ""}
                      </div>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="reviewer"
                    checked={isSelected}
                    onChange={() => setSelectedReviewerId(rev._id)}
                    className="accent-purple-600 shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Скасувати
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={UserCheck}
            isLoading={submitting}
            disabled={!selectedReviewerId}
          >
            Призначити рецензента
          </Button>
        </div>
      </form>
    </Modal>
  );
}
