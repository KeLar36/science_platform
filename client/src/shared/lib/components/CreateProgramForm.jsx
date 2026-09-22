import React, { useState } from "react";
import { Plus, Send, Building2, Save } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import Card from "@/shared/ui/Card";
import Select from "@/shared/ui/Select";
import Toggle from "@/shared/ui/Toggle";
import Skeleton from "@/shared/ui/Skeleton";
import {
  SCIENTIFIC_DOMAINS,
  PROGRAM_TYPES,
} from "@/shared/lib/constants/domains";
import { isQuillEmpty } from "@/shared/lib/utils/stripHtml";

const programTypeOptions = PROGRAM_TYPES.map((type) => ({
  value: type,
  label: type,
}));

const domainOptions = [
  { value: "Всі галузі", label: "Всі галузі" },
  ...SCIENTIFIC_DOMAINS.map((domain) => ({
    value: domain,
    label: domain,
  })),
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
};

const getFormValues = (data) => ({
  title: data?.title || "",
  type: data?.type || PROGRAM_TYPES[0] || "Науковий журнал",
  shortDescription: data?.shortDescription || "",
  description: data?.description || "",
  deadline: data?.deadline
    ? new Date(data.deadline).toISOString().split("T")[0]
    : "",
  domain: data?.domain || "Всі галузі",
  externalLink: data?.externalLink || "",
  active: data?.active ?? true,
  issn: data?.issn || "",
  impactFactor: data?.impactFactor || 0,
  amount: data?.amount || "",
  location: data?.location || "Онлайн",
  doi: data?.doi || "",
});

export default function CreateProgramForm({
  initialData = null,
  orgName,
  onSubmit,
  onSuccess,
  isLoading = false,
}) {
  const [formData, setFormData] = useState(() => getFormValues(initialData));
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData(getFormValues(initialData));
  }

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const isEditing = Boolean(initialData?._id);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: "" });
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (content) => {
    setFormData((prev) => ({ ...prev, description: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setFeedback({ type: null, message: "" });

    if (isQuillEmpty(formData.description)) {
      showFeedback("danger", "Будь ласка, заповніть повний опис програми!");
      setSubmitting(false);
      return;
    }

    try {
      const res = await onSubmit(formData);

      if (res?.success) {
        showFeedback(
          "success",
          isEditing
            ? "Наукову програму успішно оновлено!"
            : "Наукову програму успішно створено!",
        );
        onSuccess?.();
      } else {
        showFeedback("danger", res?.error || "Не вдалося зберегти програму");
      }
    } catch (err) {
      console.error("💥 Помилка збереження програми:", err);
      showFeedback("danger", "Сталася помилка при збереженні програми");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton variant="line" className="h-6 w-1/3" />
        <Skeleton variant="rectangle" height="120px" />
        <Skeleton variant="rectangle" height="200px" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-bg-secondary/80 border-border-color text-left space-y-6">
      <div className="border-b border-border-color/60 pb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold uppercase text-text-primary flex items-center gap-2">
            <Plus size={18} className="text-brand" />
            {isEditing
              ? "Редагування наукової програми"
              : "Створення нової наукової програми"}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {isEditing
              ? "Внесіть зміни до параметрів програми та збережіть їх."
              : "Заповніть форму для публікації конкурсу, журналу чи конференції від імені вашої установи."}
          </p>
        </div>
      </div>

      {feedback.type && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback({ type: null, message: "" })}
        >
          {feedback.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-bg-primary/60 rounded-xl border border-border-color/40 flex items-center gap-2.5 text-xs text-text-secondary font-mono">
          <Building2 size={16} className="text-brand shrink-0" />
          <span>
            Організатор програми:{" "}
            <strong className="text-text-primary">
              {orgName || "Science Platform"}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Тип програми *"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={programTypeOptions}
          />

          <div>
            <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
              Назва програми *
            </label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="напр. Конкурс наукових грантів 2026"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Галузь наук / Домен *"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            options={domainOptions}
          />

          <div>
            <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
              Кінцевий термін подачі (Deadline) *
            </label>
            <Input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {formData.type === "Науковий журнал" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg-primary/50 rounded-xl border border-border-color/40 animate-reveal">
            <div>
              <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
                ISSN *
              </label>
              <Input
                name="issn"
                value={formData.issn}
                onChange={handleChange}
                placeholder="1234-5678"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
                Impact Factor
              </label>
              <Input
                type="number"
                step="0.01"
                name="impactFactor"
                value={formData.impactFactor}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {formData.type === "Грант" && (
          <div className="p-4 bg-bg-primary/50 rounded-xl border border-border-color/40 animate-reveal">
            <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
              Сума гранту / Бюджет *
            </label>
            <Input
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="напр. 50 000 UAH або $5 000"
              required
            />
          </div>
        )}

        {formData.type === "Конференція" && (
          <div className="p-4 bg-bg-primary/50 rounded-xl border border-border-color/40 animate-reveal">
            <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
              Локація / Формат
            </label>
            <Input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Онлайн, Київ або Ужгород"
            />
          </div>
        )}

        {formData.type === "Стаття" && (
          <div className="p-4 bg-bg-primary/50 rounded-xl border border-border-color/40 animate-reveal">
            <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
              DOI (опціонально)
            </label>
            <Input
              name="doi"
              value={formData.doi}
              onChange={handleChange}
              placeholder="10.1000/182"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
            Зовнішнє посилання (опціонально)
          </label>
          <Input
            name="externalLink"
            value={formData.externalLink}
            onChange={handleChange}
            placeholder="https://example.com/program-details"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-1">
            Короткий опис (до 300 символів)
          </label>
          <Input
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            maxLength={300}
            placeholder="Коротке резюме для картки..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase block">
            Повний опис / Умови прийому проєктів *
          </label>
          <div className="quill-editor-wrapper bg-bg-primary border border-border-color rounded-lg overflow-hidden h-50">
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={handleDescriptionChange}
              modules={quillModules}
              placeholder="Детальний опис програми, вимоги до кандидатів..."
            />
          </div>
        </div>

        <div className="p-3 bg-bg-primary/40 rounded-xl border border-border-color/40">
          <Toggle
            checked={formData.active}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, active: val }))
            }
            label="Статус програми"
            description="Зробити програму відразу активною для прийому заявок"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            type="submit"
            icon={isEditing ? Save : Send}
            isLoading={submitting}
            disabled={submitting}
          >
            {isEditing ? "Зберегти зміни" : "Опублікувати програму"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
