import React, { useState, useEffect } from "react";
import { Search, Building2, Send, CheckCircle2 } from "lucide-react";
import Modal from "@/shared/ui/Modal";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import Avatar from "@/shared/ui/Avatar";
import Badge from "@/shared/ui/Badge";
import Skeleton from "@/shared/ui/Skeleton";
import Alert from "@/shared/ui/Alert";
import { useOrganization } from "@/features/organization/hooks/useOrganization";

export default function JoinOrganizationModal({ isOpen, onClose, onSuccess }) {
  const {
    publicOrgs,
    loading,
    submitting,
    error,
    fetchPublicList,
    joinOrganization,
  } = useOrganization();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPublicList();
    }
  }, [isOpen, fetchPublicList]);

  const showError = (msg) => {
    setFormError(msg);
    setTimeout(() => {
      setFormError(null);
    }, 5000);
  };

  const handleClose = () => {
    setSelectedOrgId(null);
    setFormError(null);
    setSearchTerm("");
    onClose();
  };

  const filteredOrgs = publicOrgs.filter((org) => {
    const isPublicAllowed = org.allowPublicJoin !== false;

    const matchesSearch =
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.edrpou?.includes(searchTerm) ||
      org.city?.toLowerCase().includes(searchTerm.toLowerCase());

    return isPublicAllowed && matchesSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrgId) {
      showError("Будь ласка, оберіть організацію зі списку");
      return;
    }

    const res = await joinOrganization(selectedOrgId);
    if (res.success) {
      onSuccess?.(res.message);
      handleClose();
    } else {
      showError(res.error || "Не вдалося надіслати запит на вступ");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Приєднатися до організації"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {(formError || error) && (
          <Alert variant="danger" onClose={() => setFormError(null)}>
            {formError || error}
          </Alert>
        )}

        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Пошук за назвою, ЄДРПОУ чи містом..."
            icon={Search}
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="space-y-2">
              <Skeleton variant="rectangle" height="50px" />
              <Skeleton variant="rectangle" height="50px" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Building2 className="mx-auto text-text-muted/60" size={32} />
              <p className="text-xs font-mono text-text-muted">
                Установу не знайдено або вступ закритий
              </p>
            </div>
          ) : (
            filteredOrgs.map((org) => {
              const isSelected = selectedOrgId === org._id;
              return (
                <div
                  key={org._id}
                  onClick={() => {
                    setSelectedOrgId(org._id);
                    setFormError(null);
                  }}
                  className={`
                    p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3
                    ${
                      isSelected
                        ? "border-brand bg-brand/10 shadow-sm ring-1 ring-brand/30"
                        : "border-border-color bg-bg-secondary hover:border-brand/40"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={org.logo} name={org.name} size="md" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold font-sans text-text-primary">
                          {org.name}
                        </h4>

                        {org.isVerified && (
                          <CheckCircle2
                            size={13}
                            className="text-brand shrink-0 fill-brand/10"
                            title="Верифікована установа"
                          />
                        )}

                        <Badge status="default">{org.type || "Установа"}</Badge>
                      </div>

                      <p className="text-[10px] font-mono text-text-muted">
                        ЄДРПОУ: {org.edrpou} • {org.city || "Україна"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleClose}
          >
            Скасувати
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={Send}
            disabled={!selectedOrgId || submitting}
            isLoading={submitting}
          >
            Надіслати запит
          </Button>
        </div>
      </form>
    </Modal>
  );
}
