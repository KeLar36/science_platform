import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import NotificationCard from "@/shared/ui/NotificationCard";
import Badge from "@/shared/ui/Badge";
import Pagination from "@/shared/ui/Pagination";
import { useNotifications } from "@/shared/lib/hooks/useNotifications";

export default function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const {
    notifications,
    unreadCount,
    currentPage,
    totalPages,
    setCurrentPage,
    handleNotificationClick,
    markAllAsRead,
    clearAll,
  } = useNotifications(5);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-border-color bg-bg-secondary hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center"
        aria-label="Сповіщення"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-secondary border-0 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-200 md:absolute md:inset-auto md:right-1 md:top-full md:mt-2 md:w-96 md:h-auto md:max-h-[85vh] md:rounded-xl md:border md:border-border-color overflow-hidden">
          <div className="p-3 border-b border-border-color flex justify-between items-center bg-bg-tertiary/40 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Сповіщення {unreadCount > 0 && `(${unreadCount})`}
            </span>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-brand hover:underline flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  title="Позначити прочитаними"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  title="Видалити всі сповіщення"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer md:hidden p-1 -mr-1"
                title="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Основний список сповіщень */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 md:max-h-96">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted font-mono">
                Сповіщень немає
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => {
                    handleNotificationClick(item);
                    setIsOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <NotificationCard
                    title={
                      <div className="flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {item.type && (
                          <Badge status={item.isRead ? "default" : "success"}>
                            {item.type}
                          </Badge>
                        )}
                      </div>
                    }
                    message={item.message}
                    time={new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    isUnread={!item.isRead}
                  />
                </div>
              ))
            )}
          </div>

          {/* Пагінація */}
          {totalPages > 1 && (
            <div className="p-2 border-t border-border-color bg-bg-tertiary/20 shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
