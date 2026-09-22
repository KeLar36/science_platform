import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectApi } from "@/features/projects/api/projectApi";
import { SCIENTIFIC_DOMAINS } from "@/shared/lib/constants/domains";
import { usePrograms } from "@/features/programs/hooks/usePrograms";

export function useSubmitProject(
  initialProgramId = "",
  initialDomainParam = "",
) {
  const navigate = useNavigate();
  const { programs } = usePrograms();
  const [selectedProgram, setSelectedProgram] = useState(initialProgramId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // 1. Початковий стан: якщо є domainParam з URL, беремо його, інакше порожній рядок
  const [domain, setDomain] = useState(initialDomainParam || "");
  const [authorComment, setAuthorComment] = useState("");
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const currentProgramObj = programs.find((p) => p._id === selectedProgram);

  // 2. Вибір першої програми за замовчуванням, якщо нічого не вибрано
  useEffect(() => {
    if (!selectedProgram && programs.length > 0) {
      setSelectedProgram(programs[0]._id);
    }
  }, [programs, selectedProgram]);

  // 3. ЖОРСТКА ПРИВ'ЯЗКА ГАЛУЗІ ДО ОБРАНОЇ ПРОГРАМИ
  useEffect(() => {
    if (currentProgramObj?.domain) {
      const rawDomain = currentProgramObj.domain;
      let targetDomain = "";

      // Перевіряємо чи domain — це рядок чи масив
      if (Array.isArray(rawDomain) && rawDomain.length > 0) {
        targetDomain = String(rawDomain[0]).trim();
      } else if (typeof rawDomain === "string" && rawDomain.trim()) {
        // Якщо передано декілька через кому, беремо першу
        targetDomain = rawDomain.split(",")[0].trim();
      }

      // Переконуємось, що галузь є в константах SCIENTIFIC_DOMAINS
      const exactMatch = SCIENTIFIC_DOMAINS.find(
        (d) => d.toLowerCase() === targetDomain.toLowerCase(),
      );

      if (exactMatch) {
        setDomain(exactMatch); // 👈 Встановлює точний рядок з константи (наприклад "Хімія та матеріалознавство")
      } else if (targetDomain) {
        setDomain(targetDomain);
      }
    } else if (initialDomainParam) {
      setDomain(initialDomainParam);
    } else if (!domain && SCIENTIFIC_DOMAINS.length > 0) {
      setDomain(SCIENTIFIC_DOMAINS[0]);
    }
  }, [currentProgramObj, initialDomainParam]);

  useEffect(() => {
    setMetadata({});
  }, [selectedProgram]);

  const handleMetadataChange = (key, value) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

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
    setError(null);

    if (!title.trim() || !description.trim() || !selectedProgram) {
      setError(
        "Будь ласка, заповніть всі необхідні поля! (Назва, опис та програма.)",
      );
      return;
    }

    if (!file) {
      setError("Будь ласка, додайте матеріали для подачі (файл PDF/DOCX/XLSX)");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("domain", domain || "Інше"); // 👈 Передає точну галузь програми
      formData.append("programId", selectedProgram);
      formData.append("authorComment", authorComment.trim());
      formData.append("metadata", JSON.stringify(metadata));
      formData.append("file", file);

      await projectApi.create(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      console.error("Помилка подачі проєкту:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Не вдалося подати проєкт",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
