import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, Menu, Sun, Moon } from "lucide-react";
import { useDarkMode } from "@/shared/lib/hooks/useDarkMode";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import Link from "@/shared/ui/Link";
import Dropdown from "@/shared/ui/DropDown";
import Toggle from "@/shared/ui/Toggle";
import Avatar from "@/shared/ui/Avatar";
import MobileMenu from "@/shared/lib/components/layout/MobileMenu";
import NotificationsPopover from "@/shared/ui/NotificationsPopover";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [theme, toggleTheme] = useDarkMode();
  const { user, logout } = useAuth();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Помилка під час логауту:", error);
    } finally {
      closeMenu();
      navigate("/login");
    }
  };

  const navLinks = [
    { label: "Головна", path: "/" },
    { label: "Програми", path: "/programs" },
    { label: "Архів", path: "/archive" },
    { label: "Блог", path: "/blog" },
    { label: "Про нас", path: "/about" },
    { label: "Установи", path: "/organizations" },
    { label: "Правила", path: "/rules" },
  ];

  const userDropdownItems = [
    {
      label: "Мій Профіль",
      icon: User,
      onClick: () => navigate("/profile"),
    },
    {
      label: "Вийти",
      icon: LogOut,
      variant: "danger",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 text-left ${
          scrolled
            ? "bg-bg-primary/80 backdrop-blur-md border-b border-border-color py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-0 flex items-center justify-between">
          <Link
            href="/"
            variant="muted"
            onClick={closeMenu}
            className="flex flex-col leading-none select-none hover:text-text-primary transition-colors"
          >
            <span className="text-xs sm:text-sm font-black tracking-wider text-text-primary uppercase">
              Science
              <span className="text-brand font-black ml-0.5">Platform</span>
            </span>
            <span className="text-[7.5px] font-mono font-bold text-text-muted uppercase tracking-widest mt-1">
              Екосистема 2026
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  variant={isActive ? "default" : "muted"}
                  className="text-[11px] font-bold uppercase tracking-widest"
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <Toggle
                checked={theme === "dark"}
                onChange={toggleTheme}
                iconOff={Moon}
                iconOn={Sun}
                size="lg"
                className="p0 gap-0"
              />

              {user && <NotificationsPopover />}

              {user ? (
                <Dropdown
                  items={userDropdownItems}
                  trigger={() => (
                    <div className="hidden lg:block cursor-pointer hover:opacity-90 transition-opacity">
                      <Avatar src={user.image} name={user.name} size="md" />
                    </div>
                  )}
                />
              ) : (
                <Link
                  href="/login"
                  className="text-[10px] font-bold uppercase tracking-wider text-text-primary bg-bg-secondary border border-border-color px-4 py-2 rounded-lg hover:border-brand hover:text-brand transition-colors"
                >
                  Увійти
                </Link>
              )}
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-border-color bg-bg-secondary/40 text-text-primary transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={isOpen}
        closeMenu={closeMenu}
        navLinks={navLinks}
        user={user}
        handleLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        currentPath={location.pathname}
      />
    </>
  );
}
