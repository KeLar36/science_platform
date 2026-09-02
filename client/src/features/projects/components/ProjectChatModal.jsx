import React, { useState } from "react";
import { Send, Lock, MessageSquare } from "lucide-react";
import Modal from "@/shared/ui/Modal";
import Avatar from "@/shared/ui/Avatar";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import TextArea from "@/shared/ui/TextArea";
import { useProjectChat } from "../hooks/useProjectChat";
import { useAuth } from "@/shared/lib/hooks/useAuth";

export default function ProjectChatModal({ project, onClose }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const { messages, loading, sending, sendMessage } = useProjectChat(
    project?._id,
  );

  if (!project) return null;

  const isAccepted =
    project.status === "Прийнято" || project.status === "approved";
  const isRejected =
    project.status === "Відхилено" || project.status === "rejected";
  const isChatClosed = isAccepted || isRejected || project.isChatClosed;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || isChatClosed) return;

    try {
      await sendMessage(text.trim());
      setText("");
    } catch (err) {
      alert("Не вдалося відправити повідомлення");
    }
  };

  return (
    <Modal
      isOpen={!!project}
      onClose={onClose}
      title={`Обговорення: ${project.title}`}
    >
      <div className="flex flex-col h-[500px] text-left">
        {isChatClosed && (
          <div className="p-3 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-600 font-mono">
            <Lock size={14} className="shrink-0" />
            <span>
              Рецензування завершено (Статус: <strong>{project.status}</strong>
              ). Історія обговорення збережена в режимі перегляду.
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-bg-secondary rounded-lg border border-border-color">
          {loading ? (
            <div className="text-center py-8 text-xs font-mono text-text-muted">
              Завантаження історії...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-text-muted flex flex-col items-center gap-2">
              <MessageSquare size={24} />
              Повідомлень поки немає. Напишіть першим!
            </div>
          ) : (
            messages.map((msg) => {
              const msgAuthorId = msg.userId?._id || msg.userId;
              const isMyMessage =
                user &&
                msgAuthorId?.toString() === (user._id || user.id)?.toString();

              return (
                <div
                  key={msg._id}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    isMyMessage ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <Avatar
                    src={msg.userId?.image}
                    name={msg.userId?.name || "Користувач"}
                    size="sm"
                  />

                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      isMyMessage
                        ? "bg-brand/10 border-brand/30 text-text-primary"
                        : "bg-bg-tertiary border-border-color text-text-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-text-muted">
                      <span className="font-bold text-text-primary">
                        {msg.userId?.name || "Науковець"}
                      </span>
                      {msg.userId?.role && (
                        <Badge status="default">{msg.userId.role}</Badge>
                      )}
                    </div>

                    <p className="whitespace-pre-line leading-relaxed break-words">
                      {msg.text}
                    </p>

                    <div className="text-[9px] font-mono text-text-muted text-right pt-0.5">
                      {new Date(msg.createdAt).toLocaleTimeString("uk-UA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!isChatClosed ? (
          <form onSubmit={handleSend} className="mt-3 space-y-2">
            <TextArea
              placeholder="Напишіть повідомлення рецензенту або автору..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={1000}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={sending}
                icon={Send}
                disabled={!text.trim()}
              >
                Надіслати
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-3 p-2 text-center text-xs font-mono text-text-muted bg-bg-tertiary rounded-lg">
            Написання нових повідомлень недоступне
          </div>
        )}
      </div>
    </Modal>
  );
}
