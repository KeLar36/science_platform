import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Award,
  Search,
  CheckCircle2,
  FileText,
  Users,
  Lock,
  Globe2,
  Cpu,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Send,
  Zap,
} from "lucide-react";
import axiosInstance from "@/shared/api/axios";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import AnalyticsCard from "@/shared/ui/AnalyticsCard";
import Timeline from "@/shared/ui/Timeline";
import Accordion from "@/shared/ui/Accordion";
import Loader from "@/shared/ui/Loader";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import {
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/shared/config/animation";

const POPULAR_DOMAINS = [
  "Інформаційні технології",
  "Штучний інтелект & Data Science",
  "Медицина та охорона здоров'я",
  "Аграрні науки",
  "Фізика та астрономія",
  "Екологія та довкілля",
];

const ROLE_TAB_DATA = {
  researcher: {
    title: "Для науковців та аспірантів",
    desc: "Подавайте проєкти на відкриті грантові конкурси, публікуйте дослідження у фахових журналах та отримуйте незалежну експертизу.",
    features: [
      "Єдиний кабінет подання заявок",
      "Анонімне рецензування (Double-Blind)",
      "Відстеження статусу в реальному часі",
    ],
    cta: "Створити профіль дослідника",
    action: "/register",
  },
  institution: {
    title: "Для ЗВО та наукових установ",
    desc: "Організовуйте конкурсні програми, приймайте наукові праці та адмініструйте власний пул рецензентів.",
    features: [
      "Офіційна верифікація за ЄДРПОУ",
      "Управління журналами та грантами",
      "Аналітичні дашборди установи",
    ],
    cta: "Зареєструвати установу",
    action: "/register",
  },
  reviewer: {
    title: "Для експертів та рецензентів",
    desc: "Отримуйте запрошення на рецензування праць за вашою спеціалізацією та формуйте прозорий науковий рейтинг.",
    features: [
      "Автоматичний баланс $k_r$",
      "Зручний редактор оцінювання",
      "Захист персональних даних",
    ],
    cta: "Приєднатися як експерт",
    action: "/register",
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [totalPrograms, setTotalPrograms] = useState(0);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [latestPrograms, setLatestPrograms] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("researcher");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [programsRes, orgsRes, postsRes] = await Promise.all([
          axiosInstance.get("/programs?page=1&limit=4"),
          axiosInstance.get("/organizations/public/list"),
          axiosInstance.get("/posts?page=1&limit=3"),
        ]);

        setTotalPrograms(programsRes.data?.totalItems || 12);
        setLatestPrograms(programsRes.data?.programs || []);

        const orgs = orgsRes.data || [];
        setTotalOrgs(orgs.length || 8);
        setOrganizations(orgs);

        setLatestPosts(postsRes.data?.posts || []);
      } catch (err) {
        console.error("Помилка завантаження даних головної сторінки:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/programs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/programs");
    }
  };

  const timelineSteps = [
    {
      title: "01. Створення профілю науковця / установи",
      description:
        "Швидка реєстрація індивідуального дослідника або миттєва верифікація ЗВО за офіційним кодом ЄДРПОУ.",
      status: "completed",
    },
    {
      title: "02. Розумний пошук та подача матеріалів",
      description:
        "Зручна фільтрація грантів, наукових фахових журналів та конференцій з можливістю завантаження версій документів.",
      status: "current",
    },
    {
      title: "03. Незалежне сліпе оцінювання (Double-Blind)",
      description:
        "Детермінований алгоритм авто-розподілу kr підбирає профільних рецензентів із повним маскуванням PII даних.",
      status: "pending",
    },
    {
      title: "04. Публікація та капіталізація розробок",
      description:
        "Присвоєння сертифікатів, інтеграція матеріалів у відкриті репозиторії та відкриття шляху до фінансування.",
      status: "pending",
    },
  ];

  const faqItems = [
    {
      q: "Хто може подавати заявки на фінансування та публікації?",
      a: "Подавати матеріали можуть індивідуальні науковці, молоді вчені, аспіранти, а також офіційні представники закладів вищої освіти (ЗВО) та науково-дослідних інститутів (НДІ) України.",
    },
    {
      q: "Як відбувається верифікація установи в системі?",
      a: "Представник вказує назву, правову форму, місто та дійсний код ЄДРПОУ. Після перевірки системним адміністратором організація отримує статус 'Верифіковано' та доступ до адмін-панелі.",
    },
    {
      q: "Як працює алгоритм захисту анонімності рецензентів?",
      a: "Платформа застосовує принципи Double-Blind Peer Review: автор не бачить персональних даних експерта (PII), а рецензент отримує роботу без згадки про приналежність автора до конкретного вишу чи кафедри.",
    },
    {
      q: "Чи є платформа безкоштовною для українських дослідників?",
      a: "Так, Open Science Platform Ukraine є повністю відкритою та безкоштовною екосистемою в рамках інтеграції вітчизняної науки до європейського простору (ERA).",
    },
  ];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white font-sans antialiased">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 space-y-24 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand/10 blur-[140px] pointer-events-none rounded-full -z-10" />
        <div className="absolute top-[40%] right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[160px] pointer-events-none rounded-full -z-10" />

        <section className="max-w-7xl mx-auto w-full px-4 lg:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <ScrollReveal
              variants={fadeInLeft}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand/10 border border-brand/20 rounded-full text-brand text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles size={14} className="animate-pulse" />
                <span>Офіційний портал відкритої науки України 2026</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-text-primary leading-[1.05]">
                Єдиний цифровий <br />
                <span className="bg-gradient-to-r from-brand via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  простір науки
                </span>{" "}
                <br />в Україні
              </h1>

              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed max-w-xl">
                Сучасний національний інфраструктурний хаб, що об'єднує грантові
                конкурси, фахові видання, відкриті датасети та незалежне
                рецензування в єдину прозору екосистему.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() =>
                    navigate(isAuthenticated ? "/programs" : "/register")
                  }
                  className="font-mono text-xs uppercase tracking-wider px-7 py-3.5 shadow-lg shadow-brand/20"
                >
                  {isAuthenticated ? "Каталог програм" : "Розпочати роботу"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  icon={BookOpen}
                  onClick={() => navigate("/archive")}
                  className="font-mono text-xs uppercase tracking-wider px-6 py-3.5"
                >
                  Відкритий архів
                </Button>
              </div>

              <div className="pt-6 border-t border-border-color/60 flex flex-wrap gap-6 text-xs font-mono text-text-muted">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-brand" />
                  Верифікація установам за ЄДРПОУ
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-brand" />
                  Blind Peer Review
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-brand" />
                  GDPR стандарти
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal
              variants={fadeInRight}
              delay={0.2}
              className="lg:col-span-5"
            >
              <Card
                hoverable
                className="border-brand/30 bg-bg-secondary/90 backdrop-blur-md shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand/20 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-6 text-left relative z-10">
                  <div className="flex items-center justify-between pb-4 border-b border-border-color">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-primary font-mono uppercase tracking-wide">
                          Smart Review Workflow
                        </h4>
                        <span className="text-[10px] text-text-muted font-mono">
                          Алгоритм авто-розподілу $k_r$
                        </span>
                      </div>
                    </div>
                    <Badge status="success">Active Core</Badge>
                  </div>

                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3.5 bg-bg-tertiary/70 rounded-xl border border-border-color flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Cpu size={16} className="text-brand shrink-0" />
                        <span className="text-xs font-semibold text-text-primary font-sans">
                          Балансування навантаження експертів
                        </span>
                      </div>
                      <span className="font-mono text-xs text-brand font-bold bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                        Оптимально
                      </span>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3.5 bg-bg-tertiary/70 rounded-xl border border-border-color flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Lock size={16} className="text-brand shrink-0" />
                        <span className="text-xs font-semibold text-text-primary font-sans">
                          Конфіденційність (Double-Blind)
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        100% PII Safe
                      </span>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3.5 bg-bg-tertiary/70 rounded-xl border border-border-color flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Award size={16} className="text-brand shrink-0" />
                        <span className="text-xs font-semibold text-text-primary font-sans">
                          Міжнародні стандарти
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-text-primary">
                        ERA / Horizon
                      </span>
                    </motion.div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl space-y-1 shadow-lg">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 font-bold block">
                      Системний статус
                    </span>
                    <h5 className="text-xs font-bold font-mono">
                      Екосистема відкритої науки працює в штатному режимі
                    </h5>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* ШВИДКИЙ ПОШУК ТА ФІЛЬТРИ */}
        <section className="max-w-7xl mx-auto w-full px-4 lg:px-0">
          <Card className="p-6 sm:p-8 bg-bg-secondary/80 border-border-color shadow-xl space-y-6 backdrop-blur-md">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              <div className="relative w-full flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введіть ключове слово, назву програми, тему або галузь..."
                  className="w-full bg-bg-tertiary border border-border-color rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-sans"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Search}
                className="w-full sm:w-auto font-mono text-xs uppercase tracking-wider shrink-0 py-3 px-6"
              >
                Знайти можливість
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-left">
              <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider mr-2">
                Популярні галузі:
              </span>
              {POPULAR_DOMAINS.map((domainName) => (
                <button
                  key={domainName}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/programs?domain=${encodeURIComponent(domainName)}`,
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-bg-tertiary hover:bg-brand/10 border border-border-color hover:border-brand/40 text-xs font-mono text-text-secondary hover:text-brand transition-all cursor-pointer"
                >
                  {domainName}
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* АНАЛІТИЧНІ МЕТРИКИ ПЛАТФОРМИ */}
        <section className="max-w-7xl mx-auto w-full px-4 lg:px-0">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Активні конкурси"
                value={`${totalPrograms}+`}
                trend="+15%"
                trendType="up"
                description="Гранти, журнальні випуски та конференції"
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Офіційні установи"
                value={`${totalOrgs}+`}
                trend="+8%"
                trendType="up"
                description="Верифіковані ЗВО та НДІ України"
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Спеціальності"
                value="20+"
                trend="Розширено"
                trendType="up"
                description="Наукові напрями та галузі знань"
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Open Access Status"
                value="100%"
                trend="Стабільно"
                trendType="up"
                description="Публічні датасети та відкриті рішення"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* СЦЕНАРІЇ ДЛЯ КОРИСТУВАЧІВ (ROLE TABS) */}
        <section className="max-w-7xl mx-auto w-full px-4 lg:px-0 text-left space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest block">
                // Функціональні можливості
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-text-primary">
                Екосистема для кожного учасника
              </h2>
            </div>

            <div className="flex p-1 bg-bg-secondary border border-border-color rounded-xl font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveRoleTab("researcher")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRoleTab === "researcher"
                    ? "bg-brand text-white font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Дослідникам
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleTab("institution")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRoleTab === "institution"
                    ? "bg-brand text-white font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Установам
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleTab("reviewer")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRoleTab === "reviewer"
                    ? "bg-brand text-white font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Рецензентам
              </button>
            </div>
          </div>

          <Card className="p-8 bg-bg-secondary/90 border-border-color relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRoleTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-8 space-y-5">
                  <h3 className="text-xl sm:text-2xl font-bold font-sans text-text-primary">
                    {ROLE_TAB_DATA[activeRoleTab].title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                    {ROLE_TAB_DATA[activeRoleTab].desc}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {ROLE_TAB_DATA[activeRoleTab].features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-xs font-mono text-text-primary"
                      >
                        <CheckCircle2
                          size={16}
                          className="text-brand shrink-0"
                        />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="primary"
                      size="md"
                      icon={ArrowRight}
                      onClick={() =>
                        navigate(ROLE_TAB_DATA[activeRoleTab].action)
                      }
                      className="font-mono text-xs uppercase tracking-wider px-6 py-3"
                    >
                      {ROLE_TAB_DATA[activeRoleTab].cta}
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-4 p-6 bg-bg-tertiary/80 border border-border-color rounded-2xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto">
                    {activeRoleTab === "researcher" && (
                      <GraduationCap size={24} />
                    )}
                    {activeRoleTab === "institution" && <Building2 size={24} />}
                    {activeRoleTab === "reviewer" && <ShieldCheck size={24} />}
                  </div>
                  <h4 className="font-bold text-sm text-text-primary font-mono uppercase">
                    100% Верифікований процес
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Усі дії в системі фіксуються в журналі аудиту (Audit Log)
                    для забезпечення абсолютної прозорості.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </section>

        {/* АКТУАЛЬНІ НАУКОВІ ПРОГРАМИ (СВІЖІ КАРТКИ) */}
        {latestPrograms.length > 0 && (
          <section className="max-w-7xl mx-auto w-full px-4 lg:px-0 text-left space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest block">
                  // Конкурсні можливості
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-text-primary">
                  Актуальні програми
                </h2>
              </div>
              <Link
                to="/programs"
                className="text-xs font-mono text-brand hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
              >
                Всі програми ({totalPrograms}) <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestPrograms.map((prog) => (
                <Card
                  key={prog._id}
                  hoverable
                  onClick={() => navigate(`/programs/${prog._id}`)}
                  className="p-5 bg-bg-secondary/90 border-border-color flex flex-col justify-between space-y-4 cursor-pointer hover:border-brand/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge status="info" className="font-mono text-[10px]">
                        {prog.type || "Програма"}
                      </Badge>
                      <span className="text-[10px] font-mono text-text-muted">
                        До {new Date(prog.deadline).toLocaleDateString("uk-UA")}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-text-primary line-clamp-2 font-sans">
                      {prog.title}
                    </h3>

                    <p className="text-xs text-text-secondary line-clamp-2">
                      {prog.shortDescription || prog.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-color/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-text-muted truncate max-w-[140px]">
                      {prog.domain}
                    </span>
                    <span className="text-brand font-bold flex items-center gap-1">
                      Детальніше <ChevronRight size={12} />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* АРХІТЕКТУРНІ ПЕРЕВАГИ */}
        <section className="max-w-7xl mx-auto w-full px-4 lg:px-0 text-left space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest block">
              // Інфраструктура
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-text-primary">
              Інфраструктура нового покоління
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              hoverable
              className="p-6 bg-bg-secondary/80 border-border-color space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                  <Globe2 size={20} />
                </div>
                <h3 className="text-lg font-bold font-sans text-text-primary">
                  Єдиний реєстр публікацій
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Агрегація конкурсних грантів, журналів та наукових подій в
                  єдиному місці із системою зручних фільтрів.
                </p>
              </div>
              <Badge status="default" className="w-fit">
                Open Access
              </Badge>
            </Card>

            <Card
              hoverable
              className="p-6 bg-bg-secondary/80 border-border-color space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-lg font-bold font-sans text-text-primary">
                  Незалежна експертиза
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Автоматичний добір незалежних експертів за формулою балансу
                  навантаження та спеціалізацією.
                </p>
              </div>
              <Badge status="success" className="w-fit">
                Double-Blind Review
              </Badge>
            </Card>

            <Card
              hoverable
              className="p-6 bg-bg-secondary/80 border-border-color space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold font-sans text-text-primary">
                  Кабінет ЗВО та НДІ
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Повноцінний інструмент адміністрування програм, прийняття
                  матеріалів та проведення рецензування.
                </p>
              </div>
              <Badge status="warning" className="w-fit">
                ЄДРПОУ Verified
              </Badge>
            </Card>
          </div>
        </section>

        {/* ПАРТНЕРСЬКІ ОРГАНІЗАЦІЇ */}
        {organizations.length > 0 && (
          <ScrollReveal
            variants={fadeInUp}
            className="max-w-7xl mx-auto w-full px-4 lg:px-0 space-y-4 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-text-muted tracking-widest font-bold">
                // Партнерські ЗВО та науково-дослідні інститути
              </span>
              <Link
                to="/programs"
                className="text-xs font-mono text-brand hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
              >
                Переглянути всі ({totalOrgs}) <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-6 bg-bg-secondary border border-border-color rounded-2xl flex flex-wrap items-center justify-around gap-8 shadow-inner">
              {organizations.map((org, idx) => (
                <motion.div
                  key={org._id || idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate(`/programs?org=${org._id}`)}
                  className="flex items-center gap-2.5 font-mono text-xs font-bold text-text-muted hover:text-brand transition-colors cursor-pointer"
                >
                  <Building2 size={16} className="text-brand shrink-0" />
                  <span>{org.name}</span>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* ДОРОЖНЯ КАРТА (TIMELINE) */}
        <ScrollReveal
          variants={fadeInUp}
          className="max-w-7xl mx-auto w-full px-4 lg:px-0 space-y-8 text-left"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest block">
              // Дорожня карта
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-text-primary">
              4 кроки від ідеї до публікації
            </h2>
          </div>

          <Card className="p-6 sm:p-8 bg-bg-secondary/60 border-border-color shadow-lg">
            <Timeline steps={timelineSteps} />
          </Card>
        </ScrollReveal>

        {/* БЛОК СВІЖИХ НОВИН ТА БЛОГУ */}
        {latestPosts.length > 0 && (
          <section className="max-w-7xl mx-auto w-full px-4 lg:px-0 text-left space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest block">
                  // Новини та аналітика
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-text-primary">
                  Останні статті в блозі
                </h2>
              </div>
              <Link
                to="/blog"
                className="text-xs font-mono text-brand hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
              >
                Читати блог <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <Card
                  key={post._id}
                  hoverable
                  onClick={() => navigate(`/blog/${post._id}`)}
                  className="p-5 bg-bg-secondary/90 border-border-color space-y-3 cursor-pointer flex flex-col justify-between hover:border-brand/50 transition-all"
                >
                  <div className="space-y-3">
                    {post.images && post.images.length > 0 && (
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-bg-tertiary relative">
                        <img
                          src={post.images[0].url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Badge status="default" className="font-mono text-[10px]">
                      {post.category || "Стаття"}
                    </Badge>
                    <h3 className="font-bold text-sm text-text-primary line-clamp-2 font-sans">
                      {post.title}
                    </h3>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {post.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-color/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                    <span className="text-brand font-bold flex items-center gap-1">
                      Читати <ChevronRight size={12} />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* FAQ (ЗАКРИВАЮЧІ ПИТАННЯ) */}
        <ScrollReveal
          variants={fadeInUp}
          className="max-w-4xl mx-auto w-full px-4 lg:px-6 space-y-8 text-left"
        >
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest block">
              // Запитання та відповіді
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-text-primary">
              Часті запитання
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <Accordion key={idx} title={item.q}>
                {item.a}
              </Accordion>
            ))}
          </div>
        </ScrollReveal>

        {/* БАНЕР ЗАКЛИКУ ДО ДІЇ (CTA) */}
        <section className="max-w-7xl mx-auto w-full px-4 lg:px-0">
          <Card className="p-8 sm:p-12 bg-bg-secondary/80 border border-border-color rounded-3xl relative overflow-hidden shadow-xl text-left space-y-6 backdrop-blur-md">
            <div className="absolute right-0 top-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl space-y-4 relative z-10">
              <Badge status="success" className="font-mono">
                Join Open Science Platform
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black font-sans uppercase tracking-tight leading-tight text-text-primary">
                Готові розкрити потенціал власних наукових розробок?
              </h2>
              <p className="text-sm font-medium text-text-secondary leading-relaxed">
                Приєднуйтесь до відкритої спільноти українських дослідників,
                подавайте заявки на конкурсні програми або реєструйте нову
                установу.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 relative z-10">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={() =>
                  navigate(isAuthenticated ? "/programs" : "/register")
                }
                className="font-mono text-xs uppercase tracking-wider px-8 py-4 shadow-lg shadow-brand/20"
              >
                {isAuthenticated ? "Каталог програм" : "Зареєструватися зараз"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/about")}
                className="font-mono text-xs uppercase tracking-wider px-6 py-4"
              >
                Про платформу
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
