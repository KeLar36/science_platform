import React, { useState, useMemo } from "react";
import { Shield, UserMinus, Search } from "lucide-react";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Avatar from "@/shared/ui/Avatar";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Pagination from "@/shared/ui/Pagination";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";

export default function OrganizationMembers({
  members = [],
  loading = false,
  isOrgAdmin = false,
  currentUserId,
  creatorId,
  onOpenRoleModal,
  onKickMember,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const showAlert = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: "" });
    }, 5000);
  };

  const handleKick = async (memberId, memberName) => {
    if (!confirm(`Ви дійсно бажаєте виключити ${memberName} з організації?`)) {
      return;
    }

    try {
      const result = await onKickMember?.(memberId);
      if (result?.success) {
        showAlert(
          "success",
          result.message || `Користувача ${memberName} успішно виключено.`,
        );
      } else {
        showAlert(
          "danger",
          result?.error || "Не вдалося виключити користувача.",
        );
      }
    } catch (err) {
      showAlert("danger", "Сталася помилка при виключенні користувача.");
    }
  };

  const memberList = useMemo(() => {
    if (Array.isArray(members)) return members;
    if (members && Array.isArray(members.items)) return members.items;
    return [];
  }, [members]);

  const filteredMembers = useMemo(() => {
    return memberList.filter((m) => {
      if (!m) return false;

      const matchesSearch =
        !search.trim() ||
        m.name?.toLowerCase().includes(search.toLowerCase().trim()) ||
        m.email?.toLowerCase().includes(search.toLowerCase().trim());

      const matchesRole = roleFilter === "all" || m.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [memberList, search, roleFilter]);

  if (loading) return <Skeleton variant="rectangle" height="200px" />;

  return (
    <div className="space-y-4 text-left">
      {feedback.type && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback({ type: null, message: "" })}
        >
          {feedback.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color">
        <div className="md:col-span-2">
          <Input
            placeholder="Шукати учасника за ім'ям або e-mail..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { label: "Всі ролі", value: "all" },
              { label: "Адміністратори", value: "admin" },
              { label: "Рецензенти", value: "reviewer" },
              { label: "Контент-менеджери", value: "content-manager" },
              { label: "Дослідники", value: "user" },
            ]}
          />
        </div>
      </div>

      <Table headers={["Користувач", "Роль в установі", "Дії"]}>
        {filteredMembers.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center py-6 text-text-muted font-mono text-xs"
            >
              Учасників за вказаними фільтрами не знайдено
            </TableCell>
          </TableRow>
        ) : (
          filteredMembers.map((member) => {
            const memberId = member._id?.toString();
            const currentId = currentUserId?.toString();
            const ownerId = (creatorId?._id || creatorId)?.toString();

            const canKick =
              isOrgAdmin && memberId !== currentId && memberId !== ownerId;

            return (
              <TableRow key={memberId || member.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={member.image} name={member.name} size="sm" />
                    <div>
                      <span className="font-bold text-xs text-text-primary block">
                        {member.name}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        {member.email}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    status={
                      member.role === "admin"
                        ? "warning"
                        : member.role === "reviewer"
                          ? "success"
                          : member.role === "superadmin"
                            ? "danger"
                            : "default"
                    }
                  >
                    {member.role === "admin"
                      ? "Адміністратор"
                      : member.role === "reviewer"
                        ? "Рецензент"
                        : member.role === "content-manager"
                          ? "Контент-менеджер"
                          : member.role === "superadmin"
                            ? "Суперадмін"
                            : "Дослідник"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {isOrgAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Shield}
                        onClick={() => onOpenRoleModal?.(member)}
                      >
                        Змінити роль
                      </Button>
                    )}

                    {canKick && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={UserMinus}
                        onClick={() => handleKick(member._id, member.name)}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 text-xs"
                      >
                        Виключити
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
