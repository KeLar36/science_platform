import React, { useState, useMemo } from "react";
import { UserCheck, Check, X, Clock, Search } from "lucide-react";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Button from "@/shared/ui/Button";
import Avatar from "@/shared/ui/Avatar";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Pagination from "@/shared/ui/Pagination";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";

export default function OrganizationJoinRequests({
  requests = [],
  loading = false,
  actionLoading = false,
  onAccept,
  onReject,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [search, setSearch] = useState("");

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
  };

  const handleAcceptUser = async (userId, userName) => {
    try {
      const res = await onAccept?.(userId);
      showFeedback(
        "success",
        res?.message || `Заявку від ${userName || "користувача"} схвалено!`,
      );
    } catch {
      showFeedback("danger", `Не вдалося прийняти заявку від ${userName}.`);
    }
  };

  const handleRejectUser = async (userId, userName) => {
    try {
      const res = await onReject?.(userId);
      showFeedback(
        "warning",
        res?.message || `Заявку від ${userName || "користувача"} відхилено.`,
      );
    } catch {
      showFeedback("danger", `Не вдалося відхилити заявку.`);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((reqItem) => {
      const user = reqItem.user || reqItem;
      const name = user?.name || "";
      const email = user?.email || "";
      const query = search.toLowerCase();

      return (
        !search.trim() ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [requests, search]);

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

      <div className="bg-bg-secondary p-3 rounded-xl border border-border-color">
        <Input
          placeholder="Пошук кандидата за ім'ям або e-mail..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center space-y-2 bg-bg-secondary/40 border-dashed">
          <UserCheck className="mx-auto text-text-muted" size={32} />
          <p className="text-xs font-mono text-text-muted">
            {requests.length === 0
              ? "Немає нових заявок на вступ."
              : "За вказаним запитом кандидатів не знайдено."}
          </p>
        </Card>
      ) : (
        <>
          <Table headers={["Кандидат", "Дата заявки", "Рішення"]}>
            {filteredRequests.map((reqItem) => {
              const user = reqItem.user || reqItem;
              const userId = user?._id || user?.id;

              return (
                <TableRow key={reqItem._id || userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={user?.image} name={user?.name} size="sm" />
                      <div>
                        <div className="font-bold text-xs text-text-primary">
                          {user?.name || "Невідомий користувач"}
                        </div>
                        <div className="text-[10px] font-mono text-text-muted">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-mono flex items-center gap-1 text-text-muted">
                      <Clock size={12} />
                      {reqItem.createdAt
                        ? new Date(reqItem.createdAt).toLocaleDateString(
                            "uk-UA",
                          )
                        : "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        isLoading={actionLoading}
                        onClick={() => handleAcceptUser(userId, user?.name)}
                        className="!bg-emerald-500 hover:!bg-emerald-600 border-none text-xs"
                      >
                        Прийняти
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={X}
                        isLoading={actionLoading}
                        onClick={() => handleRejectUser(userId, user?.name)}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                      >
                        Відхилити
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}
