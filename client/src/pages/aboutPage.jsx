import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Globe,
  ShieldCheck,
  Scale,
  Database,
  Layers,
  Server,
  FileJson,
  GitBranch,
  CheckCircle2,
  Users2,
  FlaskConical,
  Zap,
} from "lucide-react";

import { useAuth } from "@/shared/lib/hooks/useAuth";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Timeline from "@/shared/ui/Timeline";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import {
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/shared/config/animation";

export default function AboutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const breadcrumbItems = [{ label: "Про платформу", active: true }];

  const features = [
    {
      icon: Globe,
      title: "Глобальна видимість",
      desc: "Інтеграція з міжнародними наукометричними базами для швидкої індексації праць у відкритому доступі.",
    },
    {
      icon: ShieldCheck,
      title: "Академічна етика",
      desc: "Суворі процедури Double-blind рецензування та перевірка матеріалів на відповідність стандартам.",
    },
    {
      icon: Scale,
      title: "Відкритий доступ (Open Access)",
      desc: "Безперешкодний обмін знаннями, датасетами та результатами досліджень між вченими та ЗВО.",
    },
  ];

  const stepsTimeline = [
    {
      title: "01. Підбір видання та аналіз",
      description:
        "Пошук конкурсу, журналу чи датасету за галузями знань та вимогами оргкомітету.",
      status: "completed",
    },
    {
      title: "02. Подача матеріалів",
      description:
        "Хмарне завантаження рукопису, анотації та специфічних метаданих програми.",
      status: "completed",
    },
    {
      title: "03. Експертна оцінка (Огляд)",
      description:
        "Незалежне рецензування підтвердженими експертами відповідної галузі.",
      status: "current",
    },
    {
      title: "04. Публікація та капіталізація",
      description:
        "Фінальне затвердження, присвоєння статусів та індексація у відкритому доступі.",
      status: "pending",
    },
  ];

  const techCards = [
    {
      icon: Database,
      name: "MongoDB Atlas",
      desc: "Хмарна NoSQL база даних з оптимізованими Mongoose Discriminators.",
    },
    {
      icon: Layers,
      name: "React 18 & Vite",
      desc: "Динамічний клієнтський інтерфейс на основі ізольованого UI Kit.",
    },
    {
      icon: Server,
      name: "Node.js & Express",
      desc: "Асинхронний REST API бекенд із високою продуктивністю обробки.",
    },
    {
      icon: ShieldCheck,
      name: "JWT & Bcrypt",
      desc: "Безпечна безсесійна авторизація та захист паролів на рівні сервера.",
    },
    {
      icon: FileJson,
      name: "Tailwind CSS",
      desc: "Сучасна дизайн-система на CSS-змінних з підтримкою адаптивної верстки.",
    },
    {
      icon: GitBranch,
      name: "Модульна архітектура",
      desc: "Чистий код з розподілом за методологією Feature-Sliced Design.",
    },
  ];

  const standards = [
    "Перевірка установ за кодом ЄДРПОУ",
    "Гібридна модель подачі матеріалів",
    "Каскадне видалення за GDPR",
    "Пагінація та дебаунс пошуку",
    "Двостороння рольова верифікація",
    "Стандартизована Open Access архітектура",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-3 lg:px-0 space-y-20 relative z-10 overflow-hidden">
        <section className="max-w-7xl mx-auto w-full space-y-6 text-left">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <ScrollReveal
              variants={fadeInLeft}
              className="lg:col-span-8 space-y-6"
            >
              <Badge status="success" className="gap-1.5 py-1 px-3">
                <Sparkles size={12} className="text-brand" />
                <span>SciencePlatform / Mission 2026</span>
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-tight text-text-primary uppercase leading-[1.05]">
                Майбутнє <br />
                <span className="text-brand">науки</span> у цифрі.
              </h1>

              <div className="flex gap-4 items-stretch">
                <div className="w-1 bg-gradient-to-b from-brand to-transparent rounded-full hidden sm:block" />
                <p className="max-w-xl text-sm md:text-base text-text-secondary font-medium leading-relaxed">
                  Ми створюємо інтелектуальний простір, де наукові відкриття
                  трансформуються у цифрові активи. Автоматизація, прозорість та
                  глобальний доступ — наші фундаментальні принципи.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() =>
                    navigate(isAuthenticated ? "/profile" : "/register")
                  }
                >
                  {isAuthenticated ? "Мій профіль" : "Почати шлях"}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold text-xs">
                    <Users2 size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-text-primary uppercase font-mono">
                      3000+ Дослідників
                    </span>
                    <span className="text-[10px] text-text-muted font-mono uppercase">
                      Вже у системі
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal
              variants={fadeInRight}
              delay={0.2}
              className="lg:col-span-4 hidden lg:block"
            >
              <Card
                hoverable
                className="border-brand/30 bg-bg-secondary/60 text-center p-8 relative overflow-hidden group"
              >
                <div className="aspect-square bg-bg-primary/50 border border-border-color rounded-2xl relative z-10 flex items-center justify-center transition-all duration-500 hover:border-brand/40 shadow-sm">
                  <FlaskConical
                    size={80}
                    className="text-brand transition-all duration-700 ease-out group-hover:scale-105 group-hover:rotate-3 opacity-95"
                  />

                  <div className="absolute top-6 right-6 p-2.5 bg-bg-secondary border border-border-color rounded-xl animate-bounce shadow-sm">
                    <Zap size={14} className="text-brand" />
                  </div>

                  <div className="absolute bottom-6 left-6 p-3 bg-brand text-white rounded-xl shadow-lg shadow-brand/20">
                    <Sparkles size={16} />
                  </div>
                </div>

                <div className="space-y-1 pt-4">
                  <h4 className="font-bold text-xs uppercase font-mono text-text-primary">
                    Open Access Engine
                  </h4>
                  <p className="text-[11px] text-text-muted font-mono">
                    Інтелектуальна інфраструктура
                  </p>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </section>
        <section className="max-w-7xl mx-auto w-full">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div key={idx} variants={staggerItem}>
                  <Card hoverable className="text-left space-y-3 h-full">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base font-bold font-sans uppercase tracking-wide text-text-primary">
                      {item.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
        <ScrollReveal
          variants={fadeInUp}
          className="max-w-7xl mx-auto w-full space-y-8 text-left"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
              // Інфраструктура
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-sans uppercase tracking-tight">
              Етапи роботи матеріалу
            </h2>
          </div>

          <Card className="p-8 bg-bg-secondary/60">
            <Timeline steps={stepsTimeline} />
          </Card>
        </ScrollReveal>
        <section className="max-w-7xl mx-auto w-full space-y-10 text-left">
          <ScrollReveal variants={fadeInUp} className="space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
              // Інженерний стек
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-sans uppercase tracking-tight">
              Побудовано на надійній архітектурі
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <motion.div
              className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4"
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {techCards.map((tech, idx) => {
                const Icon = tech.icon;
                return (
                  <motion.div key={idx} variants={staggerItem}>
                    <Card className="p-4 space-y-2 bg-bg-secondary/40 h-full">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <div className="font-mono text-xs font-bold text-text-primary uppercase mt-2">
                        {tech.name}
                      </div>
                      <div className="text-[11px] text-text-muted leading-relaxed">
                        {tech.desc}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            <ScrollReveal
              variants={fadeInRight}
              delay={0.15}
              className="lg:col-span-5"
            >
              <Card className="p-6 space-y-4 bg-brand/5 border-brand/20">
                <h4 className="text-xs font-mono font-bold uppercase text-brand tracking-widest mb-2">
                  Стандарти безпеки та платформи
                </h4>
                <div className="space-y-2.5">
                  {standards.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-mono text-text-primary"
                    >
                      <CheckCircle2 size={14} className="text-brand shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </section>
        <ScrollReveal variants={fadeInUp} className="max-w-4xl mx-auto w-full">
          <Card className="p-10 text-center space-y-6 bg-gradient-to-b from-bg-secondary to-bg-tertiary/40 border-brand/30">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
                // Готові розпочати?
              </span>
              <h2 className="text-2xl md:text-4xl font-black font-sans uppercase tracking-tight">
                Час відкрити свій науковий потенціал
              </h2>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                Приєднуйтесь до спільноти вчених, які вже змінюють цифровий
                ландшафт науки України.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={() =>
                  navigate(isAuthenticated ? "/profile" : "/register")
                }
              >
                {isAuthenticated ? "Мій Кабінет" : "Створити профіль"}
              </Button>
            </div>
          </Card>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
