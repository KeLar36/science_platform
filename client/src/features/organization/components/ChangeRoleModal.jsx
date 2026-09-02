import React, { useState, useEffect } from "react";
import { Shield, CheckSquare, Square } from "lucide-react";
import Modal from "@/shared/ui/Modal";
import Select from "@/shared/ui/Select";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";

import {
  SCIENTIFIC_DOMAINS,
  PROGRAM_TYPES,
} from "@/shared/lib/constants/domains";
import { organizationApi } from "@/features/organization/api/organizationApi";

const rolesList = [
  { label: "Учасник (Дослідник)", value: "user" },
  { label: "Рецензент (Reviewer)", value: "reviewer" },
  { label: "Контент-менеджер", value: "content-manager" },
  { label: "Адміністратор установи", value: "admin" },
];

const academicDegreesList = [
  { label: "Немає / Дослідник", value: "Немає / Дослідник" },
  { label: "Кандидат наук / PhD", value: "Кандидат наук / PhD" },
  { label: "Доктор наук", value: "Доктор наук" },
  { label: "Доцент", value: "Доцент" },
  { label: "Професор", value: "Професор" },
  { label: "Інше", value: "Інше" },
];

export default function ChangeRoleModal({
  isOpen,
  onClose,
  member,
  orgId,
  onSuccess,
  onSave,
}) {
  const [selectedRole, setSelectedRole] = useState(member?.role || "user");
  const [academicDegree, setAcademicDegree] = useState(
    member?.academicDegree || "Немає / Дослідник",
  );
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [allowedTypes, setAllowedTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && member) {
      setSelectedRole(member.role || "user");
      setAcademicDegree(member.academicDegree || "Немає / Дослідник");
      setAllowedDomains(member.allowedDomains || []);
      setAllowedTypes(member.allowedTypes || []);
      setError(null);
    }
  }, [isOpen, member]);

  const toggleDomain = (domain) => {
    setAllowedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain],
    );
  };

  const toggleAllDomains = () => {
    if (allowedDomains.length === SCIENTIFIC_DOMAINS.length) {
      setAllowedDomains([]);
    } else {
      setAllowedDomains([...SCIENTIFIC_DOMAINS]);
    }
  };

  const toggleType = (type) => {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleAllTypes = () => {
    if (allowedTypes.length === PROGRAM_TYPES.length) {
      setAllowedTypes([]);
    } else {
      setAllowedTypes([...PROGRAM_TYPES]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const cleanOrgId = orgId?._id || orgId;
      const cleanUserId = member?._id || member;

      const payload = {
        role: selectedRole,
        ...(selectedRole === "reviewer" && {
          academicDegree,
          allowedDomains,
          allowedTypes,
        }),
      };

      if (typeof onSave === "function") {
        await onSave(payload);
      } else {
        await organizationApi.updateMemberRole(
          cleanOrgId,
          cleanUserId,
          payload,
        );
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Не вдалося змінити роль",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Зміна ролі: ${member?.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div>
          <Select
            label="Оберіть роль у системі"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={rolesList}
          />
        </div>

        {selectedRole === "reviewer" && (
          <div className="space-y-4 pt-2 border-t border-border-color animate-in fade-in duration-200">
            <div>
              <Select
                label="Науковий ступінь / Вчене звання"
                value={academicDegree}
                onChange={(e) => setAcademicDegree(e.target.value)}
                options={academicDegreesList}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                  Дозволені предметні галузі ({allowedDomains.length}/
                  {SCIENTIFIC_DOMAINS.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAllDomains}
                  className="text-[10px] font-mono text-brand hover:underline cursor-pointer"
                >
                  {allowedDomains.length === SCIENTIFIC_DOMAINS.length
                    ? "Скинути всі"
                    : "Обрати всі"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 bg-bg-secondary rounded-xl border border-border-color max-h-44 overflow-y-auto custom-scrollbar">
                {SCIENTIFIC_DOMAINS.map((domain) => {
                  const isChecked = allowedDomains.includes(domain);
                  return (
                    <div
                      key={domain}
                      onClick={() => toggleDomain(domain)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors text-xs text-text-primary"
                    >
                      {isChecked ? (
                        <CheckSquare
                          size={14}
                          className="text-brand shrink-0"
                        />
                      ) : (
                        <Square
                          size={14}
                          className="text-text-muted shrink-0"
                        />
                      )}
                      <span className="truncate">{domain}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                  Типи наукових програм ({allowedTypes.length}/
                  {PROGRAM_TYPES.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAllTypes}
                  className="text-[10px] font-mono text-brand hover:underline cursor-pointer"
                >
                  {allowedTypes.length === PROGRAM_TYPES.length
                    ? "Скинути всі"
                    : "Обрати всі"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-3 bg-bg-secondary rounded-xl border border-border-color">
                {PROGRAM_TYPES.map((type) => {
                  const isChecked = allowedTypes.includes(type);
                  return (
                    <div
                      key={type}
                      onClick={() => toggleType(type)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors text-xs text-text-primary"
                    >
                      {isChecked ? (
                        <CheckSquare
                          size={14}
                          className="text-brand shrink-0"
                        />
                      ) : (
                        <Square
                          size={14}
                          className="text-text-muted shrink-0"
                        />
                      )}
                      <span className="truncate">{type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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
            icon={Shield}
            isLoading={submitting}
          >
            Зберегти роль
          </Button>
        </div>
      </form>
    </Modal>
  );
}
