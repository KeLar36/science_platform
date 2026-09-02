import { useState } from "react";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import FileUploader from "@/shared/ui/FileUploader";
import { CATEGORIES } from "@/shared/lib/constants/categories";

export default function PostContentAssets({
  title,
  setTitle,
  category,
  setCategory,
  file,
  setFile,
  existingCover,
}) {
  const [uploadError, setUploadError] = useState("");

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const handleFileChange = (e) => {
    const incomingFiles = Array.from(e.target.files);
    setUploadError("");

    if (incomingFiles.length > 5) {
      setUploadError(
        "Можна завантажити не більше 5 зображень для слайдера публікації.",
      );
      setFile(incomingFiles.slice(0, 5));
      return;
    }

    setFile(incomingFiles);
  };

  return (
    <div className="space-y-4 p-5 bg-bg-secondary border border-border-color rounded-lg">
      <Input
        id="post-title"
        label="Заголовок статті"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Введіть заголовок статті..."
      />

      <Select
        id="post-category"
        label="Категорія"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={categoryOptions}
      />

      <div>
        <FileUploader
          label="Зображення для слайдера публікації"
          description="PNG, JPG або WEBP (до 5 файлів, макс. 5MB кожен)"
          multiple
          error={uploadError}
          onChange={handleFileChange}
        />

        {existingCover && (!file || file.length === 0) && (
          <div className="mt-2 text-[10px] font-mono text-text-muted">
            Поточні зображення слайдера:{" "}
            <span className="underline text-brand">завантажені на сервері</span>
          </div>
        )}

        {Array.isArray(file) && file.length > 0 && !uploadError && (
          <div className="mt-2 space-y-1">
            <span className="block text-[10px] font-mono text-text-muted">
              Обрані файли для слайдера ({file.length}):
            </span>
            {file.map((f, index) => (
              <div
                key={index}
                className="text-[10px] font-mono text-emerald-500 flex items-center gap-1.5"
              >
                <span className="text-text-muted">{index + 1}.</span> {f.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
