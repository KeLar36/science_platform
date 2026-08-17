import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Award,
  Search,
  CheckCircle2,
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

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [programsRes, orgsRes] = await Promise.all([
          axiosInstance.get("/programs?page=1&limit=1"),
          axiosInstance.get("/organizations/public/list"),
        ]);

        setTotalPrograms(programsRes.data?.totalItems || 12);
        const orgs = orgsRes.data || [];
        setTotalOrgs(orgs.length || 8);
        setOrganizations(orgs);
      } catch (err) {
        console.error("Помилка завантаження даних головної сторінки:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const timelineSteps = [
    {
      title: "01. Створення профілю науковця / установи",
      description:
        "Швидка реєстрація індивідуального дослідника чи верифікація ЗВО за кодом ЄДРПОУ.",
      status: "completed",
    },
    {
      title: "02. Розумний пошук та подача праць",
      description:
        "Фільтрація грантів, наукових журналів та конференцій за галузями з завантаженням матеріалів.",
      status: "current",
    },
    {
      title: "03. Незалежне онлайн-рецензування",
      description:
        "Автоматичний підбір експерта з відповідної галузі знань та прозоре оцінювання.",
      status: "pending",
    },
    {
      title: "04. Публікація та капіталізація розробок",
      description:
        "Отримання фінансування, інтеграція у відкриті бази даних та сертифікація.",
      status: "pending",
    },
  ];

  const faqItems = [
    {
      q: "Хто може подавати заявки на фінансування?",
      a: "Подавати заявки можуть індивідуальні дослідники, аспіранти, докторанти, а також офіційні представники університетів та науково-дослідних інститутів України.",
    },
    {
      q: "Які документи потрібні для реєстрації організації?",
      a: "Для реєстрації юридичної особи необхідно вказати офіційну назву, організаційно-правову форму, місто базування та дійсний код ЄДРПОУ. Заявка проходить ручну модерацію протягом 24 годин.",
    },
    {
      q: "Чи є платформа безкоштовною для науковців?",
      a: "Так, Open Science Platform є абсолютно безкоштовним агрегатором відкритих наукових можливостей у рамках європейської інтеграції української науки.",
    },
    {
      q: "Як стати незалежним рецензентом проєктів?",
      a: "Подайте заявку через особистий кабінет користувача. Після перевірки наукового ступеня та галузей вам буде надано статус рецензента.",
    },
  ];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-grow px-3 lg:px-0 pt-32 pb-24 space-y-20 relative z-10 overflow-hidden">
        <section className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <ScrollReveal
              variants={fadeInLeft}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <Badge status="success" className="gap-1.5 py-1 px-3">
                <Sparkles size={12} className="text-brand" />
                <span>Open Science Platform Ukraine</span>
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-sans uppercase tracking-tight text-text-primary leading-[1.05]">
                Єдиний простір <br />
                <span className="text-brand">відкритої науки</span> <br />в
                Україні
              </h1>

              <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-xl">
                Цифровий хаб, що об'єднує наукові гранти, фахові видання,
                профільні курси, відкриті датасети та міжнародні конференції в
                єдину прозору екосистему.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() =>
                    navigate(isAuthenticated ? "/programs" : "/register")
                  }
                >
                  {isAuthenticated ? "Каталог програм" : "Приєднатися"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/about")}
                >
                  Дізнатися більше
                </Button>
              </div>

              <div className="pt-6 border-t border-border-color flex flex-wrap gap-6 text-xs font-mono text-text-muted">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-brand" />
                  Верифікація за ЄДРПОУ
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-brand" />
                  GDPR стандарти
                </span>
              </div>
            </ScrollReveal>
            <ScrollReveal
              variants={fadeInRight}
              delay={0.2}
              className="lg:col-span-5"
            >
              <Card hoverable className="border-brand/30 bg-bg-secondary/80">
                <div className="space-y-6 text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-border-color">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-primary font-mono">
                          Екосистема рецензування
                        </h4>
                        <p className="text-[11px] font-mono text-text-muted">
                          Двостороння перевірка
                        </p>
                      </div>
                    </div>
                    <Badge status="success">Active</Badge>
                  </div>

                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 bg-bg-tertiary rounded-lg border border-border-color flex items-center justify-between transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <Search size={14} className="text-brand" />
                        <span className="text-xs font-semibold text-text-primary font-sans">
                          Відкриті бази даних
                        </span>
                      </div>
                      <span className="font-mono text-xs text-brand font-bold">
                        100%
                      </span>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 bg-bg-tertiary rounded-lg border border-border-color flex items-center justify-between transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-brand" />
                        <span className="text-xs font-semibold text-text-primary font-sans">
                          Грантові програми
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-text-primary">
                        Horizon Europe
                      </span>
                    </motion.div>
                  </div>

                  <div className="p-4 bg-brand text-white rounded-lg space-y-1 shadow-md">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/80">
                      Статус системи
                    </span>
                    <h5 className="text-xs font-bold font-mono">
                      Науковий простір повністю активовано
                    </h5>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </section>
        <section className="max-w-7xl mx-auto w-full">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Активні можливості"
                value={`${totalPrograms}+`}
                trend="+15%"
                trendType="up"
                description="Гранти, публікації в журналах та конференції"
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Зареєстровані ЗВО / НДІ"
                value={`${totalOrgs}+`}
                trend="+8%"
                trendType="up"
                description="Офіційно підтверджені установи України"
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <AnalyticsCard
                title="Відкритий доступ (Open Access)"
                value="100%"
                trend="Стабільно"
                trendType="up"
                description="Публічні датасети та анотовані репозиторії"
              />
            </motion.div>
          </motion.div>
        </section>
        {organizations.length > 0 && (
          <ScrollReveal
            variants={fadeInUp}
            className="max-w-7xl mx-auto w-full space-y-4 text-left"
          >
            <span className="text-xs font-mono uppercase text-text-muted tracking-widest font-bold">
              // Партнерські установи та ЗВО
            </span>

            <div className="p-6 bg-bg-secondary border border-border-color rounded-xl flex flex-wrap items-center justify-around gap-8">
              {organizations.map((org, idx) => (
                <motion.div
                  key={org._id || idx}
                  whileHover={{ scale: 1.08 }}
                  className="flex items-center gap-2 font-mono text-xs font-bold text-text-muted hover:text-brand transition-colors cursor-pointer"
                >
                  <Building2 size={16} className="text-brand" />
                  <span>{org.name}</span>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        )}
        <ScrollReveal
          variants={fadeInUp}
          className="max-w-7xl mx-auto w-full space-y-8 text-left"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
              // Дорожня карта
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-sans uppercase tracking-tight">
              4 кроки від ідеї до фінансування
            </h2>
          </div>

          <Card className="p-8 bg-bg-secondary/60">
            <Timeline steps={timelineSteps} />
          </Card>
        </ScrollReveal>
        <ScrollReveal
          variants={fadeInUp}
          className="max-w-4xl mx-auto w-full space-y-8 text-left"
        >
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
              // Запитання та відповіді
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-sans uppercase tracking-tight">
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
      </main>

      <Footer />
    </div>
  );
}
