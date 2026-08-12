import {
  Mail,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Boxes,
  Shield,
  FileText,
} from "lucide-react";
import Link from "@/shared/ui/Link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border-color bg-bg-primary pt-24 pb-12 px-3 lg:px-0 text-left">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] bg-brand opacity-[0.03] dark:opacity-[0.05] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          <div className="lg:col-span-4 space-y-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link
              href="/"
              variant="muted"
              className="flex flex-col leading-none select-none hover:text-text-primary transition-colors"
            >
              <span className="text-sm font-black tracking-wider text-text-primary uppercase">
                Science
                <span className="text-brand font-black ml-0.5">Platform</span>
              </span>
              <span className="text-[7.5px] font-mono font-bold text-text-muted uppercase tracking-widest mt-1">
                Екосистема відкритої науки
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-text-secondary max-w-sm">
              Єдина цифрова інфраструктура для верифікації наукових установ,
              моніторингу міжнародних грантів, публікації відкритих датасетів та
              рецензування журналів.
            </p>

            <div className="flex gap-2 items-center pt-1">
              {[
                {
                  icon: <Github className="w-4 h-4" />,
                  href: "https://github.com",
                },
                {
                  icon: <Linkedin className="w-4 h-4" />,
                  href: "https://linkedin.com",
                },
                { icon: <Globe className="w-4 h-4" />, href: "#" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg border border-border-color bg-bg-secondary/40 flex items-center justify-center text-text-muted hover:text-brand hover:bg-bg-secondary transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 flex flex-col items-center lg:items-start">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono">
              Навігація
            </h4>
            <div className="flex flex-col gap-2.5 items-center lg:items-start w-full">
              {[
                { label: "Головна сторінка", path: "/" },
                { label: "Про проєкт", path: "/about" },
                { label: "Блог та Новини", path: "/blog" },
                { label: "Правила хабу", path: "/rules" },
              ].map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  variant="muted"
                  className="text-xs font-semibold normal-case tracking-normal"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 flex flex-col items-center lg:items-start">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono">
              Компоненти
            </h4>
            <div className="flex flex-col gap-2.5 items-center lg:items-start w-full">
              {[
                { label: "Наукові Гранти", path: "/" },
                { label: "Фахові Видання", path: "/" },
                { label: "Міжнародні Конференції", path: "/" },
                { label: "Профільні Курси", path: "/" },
                { label: "Відкриті Датасети", path: "/" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.path}
                  variant="muted"
                  className="text-xs font-semibold normal-case tracking-normal"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 flex flex-col items-center lg:items-start">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono">
              Контакти
            </h4>
            <div className="space-y-4 w-full flex flex-col items-center lg:items-start">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3">
                <div className="w-8 h-8 rounded-lg border border-border-color bg-bg-secondary/40 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-brand" />
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-text-muted">
                    Help Desk Support
                  </p>
                  <a
                    href="mailto:support.scienceplatform@gmail.com"
                    className="text-xs text-text-primary font-bold hover:text-brand transition-colors mt-0.5"
                  >
                    support.scienceplatform@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3">
                <div className="w-8 h-8 rounded-lg border border-border-color bg-bg-secondary/40 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-text-muted">
                    Координація проєкту
                  </p>
                  <span className="text-xs text-text-primary font-bold mt-0.5">
                    Ужгород, Україна
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border-color flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-semibold text-text-muted text-center md:text-left">
            <span>&copy; {currentYear} Science Platform</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-bg-secondary border border-border-color rounded-lg shadow-sm">
              <Boxes className="w-3.5 h-3.5 text-brand" />
              <span className="text-[9px] text-text-primary font-mono font-bold uppercase tracking-wider">
                Магістерська дисертація
              </span>
            </div>
          </div>

          <div className="flex gap-6">
            {[
              {
                text: "Конфіденційність",
                path: "#privacy",
                icon: <Shield className="w-3.5 h-3.5" />,
              },
              {
                text: "Умови використання",
                path: "#terms",
                icon: <FileText className="w-3.5 h-3.5" />,
              },
            ].map((item) => (
              <Link
                key={item.text}
                href={item.path}
                variant="muted"
                className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="text-text-muted group-hover:text-brand transition-colors">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
