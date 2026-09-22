import { X, LogOut, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import Toggle from "@/shared/ui/Toggle";
import Avatar from "@/shared/ui/Avatar";
import NotificationsPopover from "@/shared/ui/NotificationsPopover";

export default function MobileMenu({
  isOpen,
  closeMenu,
  navLinks,
  user,
  handleLogout,
  theme,
  toggleTheme,
  currentPath,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] lg:hidden animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={closeMenu}
      />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xs z-[210] bg-bg-secondary border-l border-border-color p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Навігація
            </span>
            <button
              onClick={closeMenu}
              className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border-color pt-4 space-y-4">
          <div className="flex items-center justify-between pt-1">
            {user ? (
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 group w-full"
              >
                <Avatar
                  src={user.image}
                  name={user.name}
                  size="sm"
                  className="group-hover:border-brand transition-colors"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-text-primary group-hover:text-brand transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    Профіль
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="w-full text-center text-xs font-bold text-white bg-brand px-4 py-2.5 rounded-lg hover:bg-brand/90 transition-colors"
              >
                Увійти до системи
              </Link>
            )}
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Вийти з акаунту</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
