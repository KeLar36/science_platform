import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  Ban,
  Trash2,
  Mail,
  ShieldAlert,
  Shield,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Pagination from "@/shared/ui/Pagination";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";
import { useAdminData } from "@/features/admin/hooks/useAdminData";
import ChangeRoleModal from "@/features/organization/components/ChangeRoleModal";

export default function SuperadminUsersTab() {
  const {
    users = [],
    loading = false,
    usersPagination: pagination,
    fetchUsers,
    updateUserRole,
    toggleBanUser,
    deleteUser,
  } = useAdminData();

  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("");

  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  // Debounce для текстового пошуку (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Запит до сервера спрацьовує тільки за наявності debouncedSearch
  useEffect(() => {
    if (typeof fetchUsers === "function") {
      fetchUsers(pagination?.currentPage || 1, {
        search: debouncedSearch.trim(),
        role: roleFilter,
        accountStatus: accountStatusFilter,
      });
    }
  }, [
    pagination?.currentPage,
    debouncedSearch,
    roleFilter,
    accountStatusFilter,
    fetchUsers,
  ]);

  const handleOpenRoleModal = (user) => {
    setSelectedUserForRole(user);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (payload) => {
    if (!selectedUserForRole) return;

    const res = await updateUserRole(selectedUserForRole._id, payload);

    if (res?.success) {
      showFeedback(
        "success",
        res.message ||
          `Роль для "${selectedUserForRole.name}" успішно оновлено!`,
      );
      setIsRoleModalOpen(false);
      setSelectedUserForRole(null);
    } else {
      throw new Error(res?.message || "Помилка оновлення ролі");
    }
  };

  const handleToggleBan = async (user) => {
    const actionText = user.isBanned ? "розблокувати" : "заблокувати";
    const warnMsg =
      !user.isBanned && user.role === "reviewer"
        ? "\nУВАГА: Всі активні роботи цього рецензента будуть повернені в чергу!"
        : "";

    if (
      !confirm(
        `Ви дійсно бажаєте ${actionText} користувача "${user.name}"?${warnMsg}`,
      )
    )
      return;

    const res = await toggleBanUser(user._id, user.isBanned);
    if (res?.success) {
      showFeedback("success", res.message);
    } else {
      showFeedback("danger", res?.message || "Помилка зміни статусу бана");
    }
  };

  const handleDelete = async (user) => {
    if (user.role === "superadmin") {
      return showFeedback(
        "danger",
        "Неможливо видалити суперадміністратора системи!",
      );
    }

    if (user.isAnonymized) {
      return showFeedback(
        "danger",
        "Цей акаунт вже було анонімізовано раніше!",
      );
    }

    if (
      !confirm(
        `УВАГА! Видалення користувача "${user.name}" анонімізує його дані за стандартами GDPR. Продовжити?`,
      )
    )
      return;

    const res = await deleteUser(user._id);
    if (res?.success) {
      showFeedback("success", res.message);
      fetchUsers(1, {
        search: debouncedSearch.trim(),
        role: roleFilter,
        accountStatus: accountStatusFilter,
      });
    } else {
      showFeedback(
        "danger",
        res?.message || "Не вдалося анонімізувати користувача",
      );
    }
  };

  const userList = Array.isArray(users) ? users : [];

  const headers = [
    "Користувач",
    "Email / Місто",
    "Поточна роль",
    "Статус акаунта",
    "Дії (Superadmin)",
  ];

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

      {/* ФІЛЬТРИ ТА ПОШУК (Стабільний елемент у DOM) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full flex-1">
          <Input
            placeholder="Шукати за ім'ям або email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { label: "Всі ролі", value: "" },
              { label: "Користувач (user)", value: "user" },
              { label: "Рецензент (reviewer)", value: "reviewer" },
              {
                label: "Контент-менеджер (content-manager)",
                value: "content-manager",
              },
              { label: "Адмін (admin)", value: "admin" },
              { label: "Суперадмін (superadmin)", value: "superadmin" },
            ]}
          />
          <Select
            value={accountStatusFilter}
            onChange={(e) => setAccountStatusFilter(e.target.value)}
            options={[
              { label: "Всі типи акаунтів", value: "" },
              { label: "Активні", value: "active" },
              { label: "Заблоковані", value: "banned" },
              { label: "Анонімізовані (GDPR)", value: "anonymized" },
            ]}
          />
        </div>
      </div>

      {/* ТАБЛИЦЯ / СКЕЛЕТОН / ПОРОЖНІЙ СТАН */}
      {loading && userList.length === 0 ? (
        <Skeleton variant="rectangle" height="280px" />
      ) : userList.length === 0 ? (
        <Card className="p-8 text-center space-y-2 bg-bg-secondary/40 border-dashed">
          <Users className="mx-auto text-text-muted" size={36} />
          <p className="text-xs font-mono text-text-muted">
            Користувачів за вказаними фільтрами не знайдено.
          </p>
        </Card>
      ) : (
        <>
          <Table headers={headers} className="[&_table]:min-w-[900px]">
            {userList.map((u) => {
              const isDisabled = u.role === "superadmin" || u.isAnonymized;

              return (
                <TableRow key={u._id}>
                  {/* Користувач */}
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-600 text-xs shrink-0 overflow-hidden">
                        {u.image ? (
                          <img
                            src={u.image}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-text-primary block leading-tight">
                          {u.name}
                        </span>
                        {u.role === "superadmin" && (
                          <span className="text-[10px] font-mono text-purple-600 font-bold flex items-center gap-1">
                            <ShieldAlert size={10} /> System Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-xs font-mono">
                      <span className="text-text-primary flex items-center gap-1">
                        <Mail size={12} className="text-text-muted" />
                        {u.email}
                      </span>
                      <span className="text-text-muted text-[11px]">
                        {u.city || "Місто не вказано"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Badge
                        status="default"
                        className="uppercase font-mono text-[10px]"
                      >
                        {u.role}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Shield}
                        disabled={isDisabled}
                        onClick={() => handleOpenRoleModal(u)}
                        className="text-xs font-mono"
                        title="Змінити роль та дозволи"
                      >
                        Змінити
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {u.isAnonymized ? (
                      <Badge status="default">Анонімізовано</Badge>
                    ) : u.isBanned ? (
                      <Badge status="danger">Заблоковано</Badge>
                    ) : (
                      <Badge status="success">Активний</Badge>
                    )}
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Ban}
                        disabled={isDisabled}
                        onClick={() => handleToggleBan(u)}
                        className={`text-xs ${
                          u.isBanned
                            ? "text-green-500 border-green-500/30 hover:bg-green-500/10"
                            : "text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                        }`}
                        title={
                          u.isAnonymized
                            ? "Анонімізований акаунт"
                            : u.isBanned
                              ? "Розблокувати"
                              : "Заблокувати"
                        }
                      >
                        {u.isBanned ? "Unban" : "Ban"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        disabled={isDisabled}
                        onClick={() => handleDelete(u)}
                        className="text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 disabled:opacity-30"
                        title={
                          u.isAnonymized
                            ? "Вже анонімізовано"
                            : "Видалити (GDPR)"
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>

          {pagination && (
            <Pagination
              currentPage={pagination.currentPage || 1}
              totalPages={pagination.totalPages || 1}
              onPageChange={(page) =>
                fetchUsers(page, {
                  search: debouncedSearch.trim(),
                  role: roleFilter,
                  accountStatus: accountStatusFilter,
                })
              }
            />
          )}
        </>
      )}

      {selectedUserForRole && (
        <ChangeRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setSelectedUserForRole(null);
          }}
          member={selectedUserForRole}
          orgId={selectedUserForRole.organizationId}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
}
