import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Star,
  ShieldCheck,
} from "lucide-react";
import Modal from "@/shared/ui/Modal";
import Select from "@/shared/ui/Select";
import TextArea from "@/shared/ui/TextArea";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import Toggle from "@/shared/ui/Toggle";
import { reviewerApi } from "../api/reviewerApi";

const PROGRAM_SCORE_CRITERIA = {
  "Науковий журнал": [
    { key: "novelty", label: "Наукова новизна та актуальність" },
    { key: "methodology", label: "Методологічна коректність та валідність" },
    { key: "abstractQuality", label: "Якість анотації (Abstract)" },
    { key: "citationQuality", label: "Дотримання вимог цитування та джерел" },
  ],
  Грант: [
    { key: "impact", label: "Практичний імпакт та соціальна цінність" },
    { key: "teamCompetence", label: "Спроможність та кваліфікація команди" },
    { key: "budgetReasoning", label: "Обґрунтованість кошторису та бюджету" },
    { key: "riskManagement", label: "Управління ризиками (Risk management)" },
  ],
  Конференція: [
    { key: "relevance", label: "Відповідність тематиці конференції" },
    { key: "originality", label: "Оригінальність тез та новаторство" },
    { key: "clarity", label: "Зрозумілість та лаконічність викладу" },
  ],
  Стаття: [
    { key: "argumentsValidity", label: "Аргументованість висновків" },
    { key: "literatureReview", label: "Глибина огляду сучасної літератури" },
  ],
  Датасет: [
    { key: "dataCompleteness", label: "Повнота та якість структури даних" },
    { key: "documentationQuality", label: "Якість метаданих та документації" },
    { key: "fairCompliance", label: "Відповідність принципам FAIR" },
  ],
  Курс: [
    {
      key: "pedagogicalStructure",
      label: "Методична та педагогічна структура",
    },
    { key: "practicalValue", label: "Практична цінність та завдання" },
    { key: "accessibility", label: "Інклюзивність та доступність матеріалів" },
  ],
};

const recommendationOptions = [
  { label: "Прийняти без змін", value: "Прийняти без змін" },
  {
    label: "Прийняти після незначних правок",
    value: "Прийняти після незначних правок",
  },
  {
    label: "Повторне рецензування (суттєві правки)",
    value: "Повторне рецензування (суттєві правки)",
  },
  { label: "Відхилити", value: "Відхилити" },
];

export default function ReviewFormModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}) {
  const programType = project?.programId?.type || "Науковий журнал";
  const criteria =
    PROGRAM_SCORE_CRITERIA[programType] ||
    PROGRAM_SCORE_CRITERIA["Науковий журнал"];

  const [recommendation, setRecommendation] = useState("Прийняти без змін");
  const [scores, setScores] = useState({});
  const [publicComment, setPublicComment] = useState("");
  const [privateComment, setPrivateComment] = useState("");
  const [hasConflictOfInterest, setHasConflictOfInterest] = useState(false);
  const [ethicalCompliance, setEthicalCompliance] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      const initialScores = {};
      criteria.forEach((c) => {
        initialScores[c.key] = 5;
      });

      setScores(initialScores);
      setPublicComment(project.reviewerComments || "");
      setPrivateComment("");
      setHasConflictOfInterest(false);
      setEthicalCompliance(true);

      if (project.status === "Прийнято") {
        setRecommendation("Прийняти без змін");
      } else if (project.status === "Відхилено") {
        setRecommendation("Відхилити");
      } else if (project.status === "На доопрацюванні") {
        setRecommendation("Повторне рецензування (суттєві правки)");
      } else {
        setRecommendation("Прийняти без змін");
      }

      setError(null);
    }
  }, [isOpen, project]);

  const calculatedTotalScore = useMemo(() => {
    const values = Object.values(scores).map(Number);
    if (values.length === 0) return 5;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(2);
  }, [scores]);

  if (!project) return null;

  const handleScoreChange = (key, value) => {
    setScores((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasConflictOfInterest) {
      setError(
        "Ви задекларували наявність конфлікту інтересів. Подача рецензії неможлива.",
      );
      return;
    }

    if (!publicComment.trim()) {
      setError(
        "Будь ласка, вкажіть офіційне зауваження або коментар для автора!",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let targetStatus = "На розгляді";
      if (
        recommendation === "Прийняти без змін" ||
        recommendation === "Прийняти після незначних правок"
      ) {
        targetStatus = "Прийнято";
      } else if (recommendation === "Відхилити") {
        targetStatus = "Відхилено";
      } else if (recommendation === "Повторне рецензування (суттєві правки)") {
        targetStatus = "На доопрацюванні";
      }

      const payload = {
        scores,
        recommendation,
        publicComment: publicComment.trim(),
        privateComment: privateComment.trim(),
        hasConflictOfInterest,
        ethicalCompliance,
        status: targetStatus,
      };

      await reviewerApi.submitReview(project._id, payload);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Помилка при збереженні рецензії:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Не вдалося зберегти рецензію",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusNotice = () => {
    switch (recommendation) {
      case "Прийняти без змін":
      case "Прийняти після незначних правок":
        return {
          icon: CheckCircle2,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          text: "Робота буде схвалена та розміщена в архіві згідно з її рівнем доступу.",
        };
      case "Повторне рецензування (суттєві правки)":
        return {
          icon: AlertTriangle,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          text: "Автор отримає можливість завантажити оновлену версію файлу з урахуванням ваших зауважень.",
        };
      case "Відхилити":
        return {
          icon: XCircle,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          text: "Робота буде відхилена. Доступ до редагування матеріалу для автора буде обмежено.",
        };
      default:
        return {
          icon: Clock,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          text: "Робота перебуває на етапі оцінювання.",
        };
    }
  };

  const NoticeInfo = getStatusNotice();
  const NoticeIcon = NoticeInfo.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Оцінювання праці: ${project.title}`}
    >
      {/* Прибрано max-h-[80vh] та overflow-y-auto з форми, щоб усунути подвійний скролл */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono transition-colors duration-200 ${NoticeInfo.color}`}
        >
          <NoticeIcon size={18} className="shrink-0 mt-0.5" />
          <span>{NoticeInfo.text}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-xl border border-border-color">
          <div>
            <span className="text-[10px] font-mono uppercase text-brand font-bold block">
              Тип програми: {programType}
            </span>
            <span className="text-xs text-text-muted">
              Критерії сформовано відповідно до специфіки програми
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-text-muted block">
              Підсумковий бал
            </span>
            <span className="text-lg font-bold font-mono text-brand flex items-center gap-1 justify-end">
              <Star size={16} className="fill-brand text-brand" />
              {calculatedTotalScore} / 5
            </span>
          </div>
        </div>

        <div className="space-y-3 p-3 bg-bg-tertiary/40 rounded-xl border border-border-color">
          <h4 className="text-xs font-bold font-mono uppercase text-text-primary">
            Матриця критеріїв оцінювання
          </h4>
          <div className="grid gap-3">
            {criteria.map((c) => (
              <div
                key={c.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-bg-secondary rounded-lg border border-border-color text-xs"
              >
                <span className="font-medium text-text-primary">{c.label}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleScoreChange(c.key, val)}
                      className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                        scores[c.key] === val
                          ? "bg-brand text-white shadow-sm"
                          : "bg-bg-tertiary text-text-muted hover:bg-bg-tertiary/80"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Select
            label="Вердикт / Рекомендація рецензента *"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            options={recommendationOptions}
          />
        </div>

        <div className="p-3 bg-bg-secondary rounded-xl border border-border-color space-y-1 text-xs">
          <Toggle
            label="Задекларувати наявність конфлікту інтересів"
            description="Увімкніть, якщо ви є співавтором, колегою або родичем автора"
            checked={hasConflictOfInterest}
            onChange={setHasConflictOfInterest}
            size="sm"
          />

          <div className="border-t border-border-color/60 my-1 pt-1">
            <Toggle
              label="Відповідність етичним стандартам"
              description="Підтверджує дотримання академічної доброчесності та біоетики"
              checked={ethicalCompliance}
              onChange={setEthicalCompliance}
              iconOn={ShieldCheck}
              size="sm"
            />
          </div>
        </div>

        <div>
          <TextArea
            label="Офіційний коментар для автора (Public Comment) *"
            placeholder="Зауваження, сильні сторони, рекомендації щодо виправлення..."
            value={publicComment}
            onChange={(e) => setPublicComment(e.target.value)}
            rows={4}
            maxLength={2000}
            required
          />
        </div>

        <div>
          <TextArea
            label="Примітка для редактора / адміна (Private Comment)"
            placeholder="Конфіденційна інформація тільки для організаторів (не бачить автор)..."
            value={privateComment}
            onChange={(e) => setPrivateComment(e.target.value)}
            rows={2}
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
            icon={Send}
            isLoading={submitting}
            disabled={hasConflictOfInterest}
          >
            Зберегти та надіслати рішення
          </Button>
        </div>
      </form>
    </Modal>
  );
}
