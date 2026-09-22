import React, { useState, useMemo } from "react";
import {
  FolderGit2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  MessageSquare,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Skeleton from "@/shared/ui/Skeleton";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Avatar from "@/shared/ui/Avatar";
import Alert from "@/shared/ui/Alert";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Pagination from "@/shared/ui/Pagination";
import { Table, TableRow, TableCell } from "@/shared/ui/Table";
import AssignReviewerModal from "@/features/admin/components/AssignReviewerModal";

export default function OrganizationSubmittedProjects({
  projects = [],
  loading = false,
  onViewDetails,
  onOpenChat,
  onReviewClick,
  onAssignReviewerSuccess,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  orgId,
}) {
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProjectForAssign, setSelectedProjectForAssign] =
    useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Прийнято":
      case "approved":
        return <Badge status="success">Прийнято</Badge>;
      case "Відхилено":
      case "rejected":
        return <Badge status="danger">Відхилено</Badge>;
      case "На доопрацюванні":
      case "needs_revision":
        return <Badge status="warning">На доопрацюванні</Badge>;
      case "На розгляді":
      case "under_review":
        return <Badge status="warning">На розгляді</Badge>;
      default:
        return <Badge status="default">{status || "Нова заявка"}</Badge>;
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const authorName = item.authorId?.name || item.author?.name || "";
      const matchesSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        authorName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" &&
          (item.status === "На розгляді" || item.status === "under_review")) ||
        (statusFilter === "accepted" &&
          (item.status === "Прийнято" || item.status === "approved")) ||
        (statusFilter === "revision" &&
          (item.status === "На доопрацюванні" ||
            item.status === "needs_revision")) ||
        (statusFilter === "rejected" &&
          (item.status === "Відхилено" || item.status === "rejected"));

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const handleAssignSuccess = () => {
    setFeedback({
      type: "success",
      message: "Рецензента успішно призначено до проєкту!",
    });
    onAssignReviewerSuccess?.();
  };

  if (loading) return <Skeleton variant="rectangle" height="200px" />;

  return (
    <div className="space-y-4 text-left font-sans">
      {feedback.type && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback({ type: null, message: "" })}
        >
          {feedback.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-bg-secondary p-3 rounded-xl border border-border-color">
        <div className="sm:col-span-2">
          <Input
            placeholder="Пошук за назвою проєкту або ім'ям автора..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "Всі статуси", value: "all" },
              { label: "На розгляді", value: "pending" },
              { label: "Прийнято", value: "accepted" },
              { label: "На доопрацюванні", value: "revision" },
              { label: "Відхилено", value: "rejected" },
            ]}
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="p-8 text-center space-y-2 bg-bg-secondary/40 border-dashed">
          <FolderGit2 className="mx-auto text-text-muted" size={32} />
          <p className="text-xs font-mono text-text-muted">
            {projects.length === 0
              ? "На наукові програми вашої організації поки не подано жодного проєкту."
              : "За вказаними фільтрами робіт не знайдено."}
          </p>
        </Card>
      ) : (
        <>
          <Table
            headers={[
              "Назва проєкту",
              "Автор",
              "Рецензент",
              "Програма",
              "Дата подачі",
              "Статус",
              "Дії",
            ]}
          >
            {filteredProjects.map((item) => {
              const author = item.authorId || item.author;
              const reviewer = item.reviewerId || item.reviewer;
              const program = item.programId || item.program;

              const isFinalStatus =
                item.status === "Прийнято" ||
                item.status === "approved" ||
                item.status === "Відхилено" ||
                item.status === "rejected";

              return (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="font-bold text-xs text-text-primary">
                      {item.title}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted">
                      Галузь: {item.domain || "Загальна"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={author?.image}
                        name={author?.name || "Дослідник"}
                        size="sm"
                      />
                      <div>
                        <div className="font-bold text-xs text-text-primary">
                          {author?.name || "Невідомий автор"}
                        </div>
                        <div className="text-[10px] font-mono text-text-muted">
                          {author?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {reviewer ? (
                      <div className="flex items-center gap-1.5">
                        <UserCheck
                          size={14}
                          className="text-status-success shrink-0"
                        />
                        <span className="text-xs font-mono text-text-primary">
                          {reviewer.name || "Призначено"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-text-muted italic">
                        Не призначено
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-mono text-text-secondary">
                      {program?.title || "Загальна програма"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-mono flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(item.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                  </TableCell>

                  <TableCell>{getStatusBadge(item.status)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={ExternalLink}
                        onClick={() => onViewDetails?.(item)}
                        className="!p-1.5"
                        title="Переглянути деталі"
                      />

                      {onOpenChat && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={MessageSquare}
                          onClick={() => onOpenChat(item)}
                          className="!p-1.5"
                          title="Чат рецензування"
                        />
                      )}

                      {!isFinalStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={UserPlus}
                          onClick={() => setSelectedProjectForAssign(item)}
                          className="text-xs"
                          title="Призначити або змінити рецензента"
                        >
                          Рецензент
                        </Button>
                      )}

                      {onReviewClick && !isFinalStatus && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ShieldCheck}
                          onClick={() => onReviewClick(item)}
                          className="text-xs"
                        >
                          Затвердити
                        </Button>
                      )}
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

      {selectedProjectForAssign && (
        <AssignReviewerModal
          isOpen={Boolean(selectedProjectForAssign)}
          onClose={() => setSelectedProjectForAssign(null)}
          project={selectedProjectForAssign}
          orgId={orgId}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}
