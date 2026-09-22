import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Send,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Button from "@/shared/ui/Button";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import TextArea from "@/shared/ui/TextArea";
import FileUploader from "@/shared/ui/FileUploader";
import Skeleton from "@/shared/ui/Skeleton";

import { SCIENTIFIC_DOMAINS } from "@/shared/lib/constants/domains";
import { useSubmitProject } from "../hooks/useSubmitProject";

export default function SubmitProjectPage() {
  const [searchParams] = useSearchParams();
  const programIdParam = searchParams.get("program") || "";
  const domainParam = searchParams.get("domain") || "";

  const {
    programs,
    selectedProgram,
    setSelectedProgram,
    currentProgramObj,
    title,
    setTitle,
    description,
    setDescription,
    domain,
    setDomain,
    authorComment,
    setAuthorComment,
    metadata,
    handleMetadataChange,
    file,
    handleFileChange,
    handleSubmit,
    loading,
    error,
    success,
  } = useSubmitProject(programIdParam, domainParam);
  useEffect(() => {
    if (currentProgramObj?.domain) {
      const rawDomain = currentProgramObj.domain;

      // 1. Примусово перетворюємо в масив, якщо це рядок із комами або вже масив
      let programDomains = [];
      if (Array.isArray(rawDomain)) {
        programDomains = rawDomain.map((d) => String(d).trim());
      } else if (typeof rawDomain === "string") {
        programDomains = rawDomain.split(",").map((d) => d.trim());
      }

      // 2. Шукаємо першу галузь, яка є в SCIENTIFIC_DOMAINS
      const matchedDomain = programDomains.find((pDomain) =>
        SCIENTIFIC_DOMAINS.includes(pDomain),
      );

      // 3. Гарантуємо, що в setDomain передається ТІЛЬКИ СКАЛЯРНИЙ РЯДОК (string)
      if (matchedDomain) {
        setDomain(String(matchedDomain));
      } else if (programDomains.length > 0) {
        setDomain(String(programDomains[0]));
      } else {
        setDomain("");
      }
    } else if (domainParam && !domain) {
      setDomain(String(domainParam));
    }
  }, [currentProgramObj, domainParam, setDomain, domain]);

  const programOptions = programs.map((p) => ({
    label: `${p.title} (${p.type || "Загальна"})`,
    value: p._id,
  }));

  const domainOptions = SCIENTIFIC_DOMAINS.map((d) => ({
    label: d,
    value: d,
  }));

  const breadcrumbItems = [
    { label: "Наукові програми", href: "/programs" },
    ...(currentProgramObj?._id
      ? [
          {
            label:
              currentProgramObj.title.length > 25
                ? `${currentProgramObj.title.substring(0, 25)}...`
                : currentProgramObj.title,
            href: `/programs/${currentProgramObj._id}`,
          },
        ]
      : []),
    {
      label: "Подача заявки",
      active: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-4 md:px-6 max-w-4xl mx-auto w-full space-y-6 relative z-10">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase text-brand font-bold tracking-wider">
            // Нова наукова заявка
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-sans uppercase tracking-tight">
            Подача наукової праці
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Заповніть форму та прикріпіть файл наукової роботи для проходження
            процедури рецензування.
          </p>
        </div>

        {programs.length === 0 && !error ? (
          <Card className="p-6 md:p-8 space-y-6 bg-bg-secondary/60 border-border-color backdrop-blur-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton variant="line" width="120px" />
                <Skeleton variant="rectangle" height="40px" />
              </div>
              <div className="space-y-2">
                <Skeleton variant="line" width="100px" />
                <Skeleton variant="rectangle" height="40px" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton variant="line" width="150px" />
              <Skeleton variant="rectangle" height="40px" />
            </div>

            <div className="space-y-2">
              <Skeleton variant="line" width="160px" />
              <Skeleton variant="rectangle" height="110px" />
            </div>

            <div className="space-y-2">
              <Skeleton variant="line" width="200px" />
              <Skeleton variant="rectangle" height="130px" />
            </div>

            <div className="pt-4 border-t border-border-color flex justify-end">
              <Skeleton variant="rectangle" width="220px" height="40px" />
            </div>
          </Card>
        ) : success ? (
          <Card className="p-8 text-center space-y-4 border-emerald-500/30 bg-emerald-500/10">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-sans">
                Заявку успішно подано!
              </h2>
              <p className="text-xs font-mono text-text-muted">
                Ваш проєкт перенаправлено до системи рецензування.
                Перенаправлення в кабінет...
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6 md:p-8 bg-bg-secondary/60 border-border-color backdrop-blur-xs">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-mono flex items-center gap-3">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-text-muted font-bold block">
                    Конкурс / Програма *
                  </label>
                  <Select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    options={programOptions}
                    disabled={programOptions.length === 0}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-text-muted font-bold block">
                    Галузь науки *
                  </label>
                  <Select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    options={domainOptions}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-text-muted font-bold block">
                  Назва наукової праці *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введіть повну назву вашого дослідження..."
                  required
                />
              </div>

              <TextArea
                label="Анотація / Опис проєкту *"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Стисло опишіть мету, актуальність та очікувані результати..."
                required
              />

              {currentProgramObj?.type && (
                <div className="p-4 rounded-xl border border-brand/30 bg-brand/5 space-y-4">
                  <div className="flex items-center gap-2 text-brand font-mono text-xs font-bold uppercase">
                    <Sparkles size={14} />
                    <span>Специфічні поля для: {currentProgramObj.type}</span>
                  </div>

                  {currentProgramObj.type === "Науковий журнал" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold">
                          Ключові слова (через кому)
                        </label>
                        <Input
                          placeholder="наприклад: React, MERN, AI"
                          value={metadata.keywords || ""}
                          onChange={(e) =>
                            handleMetadataChange("keywords", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold">
                          Запропонований ORCID авторів
                        </label>
                        <Input
                          placeholder="0000-0000-0000-0000"
                          value={metadata.orcid || ""}
                          onChange={(e) =>
                            handleMetadataChange("orcid", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {currentProgramObj.type === "Грант" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold">
                          Запитуваний бюджет (грн / USD)
                        </label>
                        <Input
                          placeholder="наприклад: 50 000 грн"
                          value={metadata.requestedAmount || ""}
                          onChange={(e) =>
                            handleMetadataChange(
                              "requestedAmount",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold">
                          Термін реалізації (місяців)
                        </label>
                        <Input
                          type="number"
                          placeholder="12"
                          value={metadata.durationMonths || ""}
                          onChange={(e) =>
                            handleMetadataChange(
                              "durationMonths",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}

                  {currentProgramObj.type === "Конференція" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold">
                          Формат доповіді
                        </label>
                        <Select
                          value={metadata.presentationType || "Усна доповідь"}
                          onChange={(e) =>
                            handleMetadataChange(
                              "presentationType",
                              e.target.value,
                            )
                          }
                          options={[
                            { label: "Усна доповідь", value: "Усна доповідь" },
                            {
                              label: "Стендова (постерна) доповідь",
                              value: "Стендова доповідь",
                            },
                            {
                              label: "Тільки публікація тез",
                              value: "Тільки тези",
                            },
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {currentProgramObj.type === "Датасет" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold">
                          Формат даних (JSON, CSV, ZIP)
                        </label>
                        <Input
                          placeholder="наприклад: CSV / JSON"
                          value={metadata.dataFormat || ""}
                          onChange={(e) =>
                            handleMetadataChange("dataFormat", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <FileUploader
                  label="Файл наукової роботи (PDF / DOCX, до 25 MB) *"
                  description="Підтримувані формати: .pdf, .docx, .doc"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="text-xs font-mono font-bold text-brand">
                    Вибрано: {file.name} (
                    {(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-text-muted font-bold flex items-center gap-1">
                  <HelpCircle size={12} /> Коментар для оргкомітету /
                  рецензентів
                </label>
                <Input
                  value={authorComment}
                  onChange={(e) => setAuthorComment(e.target.value)}
                  placeholder="Додаткові примітки, посилання на матеріали тощо..."
                />
              </div>

              <div className="pt-4 border-t border-border-color flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={Send}
                  disabled={loading}
                >
                  {loading
                    ? "Подання матеріалів..."
                    : "Надіслати на рецензування"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
