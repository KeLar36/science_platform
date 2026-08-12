import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Scale,
  Fingerprint,
  Database,
  FileCode,
  FileSpreadsheet,
  FileLock2,
  UserCheck,
} from "lucide-react";

import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import Card from "@/shared/ui/Card";
import Badge from "@/shared/ui/Badge";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Accordion from "@/shared/ui/Accordion";
import Timeline from "@/shared/ui/Timeline";

export default function RulesPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scanned =
        scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      setScrollProgress(scanned);
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const breadcrumbItems = [{ label: "Регламент та правила", active: true }];

  const verificationSteps = [
    {
      title: "01. Первинна подача та автоматична перевірка",
      description:
        "Система перевіряє заповнення обов'язкових полів, прикріплені метадані та формати файлів (PDF/DOCX).",
      status: "completed",
    },
    {
      title: "02. Автоматичний підбір рецензента",
      description:
        "Система розподіляє працю рецензентам відповідно до обраної предметної галузі знань та наукового ступеня.",
      status: "current",
    },
    {
      title: "03. Незалежна оцінка та фідбек",
      description:
        "Рецензент виставляє оцінку та формує зауваження. Якщо потрібно — працю повертають на доопрацювання.",
      status: "pending",
    },
    {
      title: "04. Публікація або архівування",
      description:
        "Прийнята праця отримує статус опублікованої, а відхилені матеріали автоматично очищаються відповідно до GDPR.",
      status: "pending",
    },
  ];

  const faqItems = [
    {
      q: "Який регламент розгляду та рецензування праць?",
      a: "Рецензування та технічна перевірка зазвичай тривають від 24 до 72 годин з моменту подачі. Статус обробки автоматично оновлюється в реальному часі у вашому особистому кабінеті.",
    },
    {
      q: "Як організація встановлює власні шаблони та вимоги до оформлення?",
      a: "Представники ЗВО та НДІ при створенні наукової програми (гранту, журналу чи конференції) самостійно вказують детальний опис, методичні вказівки та посилання на завантаження власних шаблонів у повнофункціональному форматованому описі (RTE).",
    },
    {
      q: "Що відбувається при відхиленні матеріалу?",
      a: "У разі відхилення праці рецензентом чи контент-менеджером, автор отримує детальний лог із зауваженнями. Файли відхилених робіт автоматично очищаються з хмари при завершенні програми для забезпечення GDPR-безпеки.",
    },
    {
      q: "Як проходить верифікація закладів освіти та НДІ?",
      a: "Публікація програм від імені юридичної особи дозволена тільки після перевірки офіційного коду ЄДРПОУ та підтвердження статусу адміністратора установи суперадміном платформи.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary selection:bg-brand selection:text-white font-sans">
      <div
        className="fixed top-0 left-0 h-1 bg-brand z-[100] transition-all duration-150 will-change-transform"
        style={{ width: `${scrollProgress}%` }}
      />

      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-3 lg:px-0 relative z-10 space-y-16">
        <div className="max-w-7xl mx-auto space-y-8 text-left">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge status="success" className="gap-1.5 py-1 px-3">
              <span>System.Protocols v2.6</span>
            </Badge>

            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-text-primary leading-[1.05]">
              Регламент <br />
              <span className="text-brand">відкритої науки</span>
            </h1>

            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">
              Офіційна нормативна база Open Science Platform Ukraine: стандарти
              академічної доброчесності, верифікація ЗВО за ЄДРПОУ, правила
              Double-Blind рецензування та GDPR-безпека даних.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card hoverable className="p-8 space-y-6 bg-bg-secondary/60">
              <div className="flex items-center gap-4 border-b border-border-color pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold uppercase font-mono text-text-primary">
                    01 / Академічні та Рецензійні Протоколи
                  </h2>
                  <p className="text-[11px] font-mono text-text-muted">
                    Доброчесність та Double-Blind скринінг
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start mt-2">
                  <div className="p-2 bg-bg-tertiary border border-border-color rounded-lg text-brand shrink-0 mt-0.5">
                    <Scale size={16} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold uppercase text-text-primary block">
                      Суворий контроль унікальності
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Усі текстові файли та описи досліджень проходят перевірку
                      алгоритмами скринінгу. Будь-які маніпуляції з текстом чи
                      спроби згенерованого спаму блокуються модерацією.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start mt-2">
                  <div className="p-2 bg-bg-tertiary border border-border-color rounded-lg text-brand shrink-0 mt-0.5">
                    <Fingerprint size={16} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold uppercase text-text-primary block">
                      Політика Відкритого Доступу (Open Access)
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Подаючи матеріали, автори погоджуються на їх депонування
                      під вільними ліцензіями Creative Commons (CC-BY 4.0), що
                      дозволяє науковій спільноті цитувати розробки із
                      зазначенням авторства.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start mt-2">
                  <div className="p-2 bg-bg-tertiary border border-border-color rounded-lg text-brand shrink-0 mt-0.5">
                    <UserCheck size={16} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold uppercase text-text-primary block">
                      Двостороннє Сліпе Рецензування (Double-Blind)
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Рецензування координується автоматично. Експерт
                      призначається за відповідністю предметної галузі знань,
                      при цьому автор та рецензент залишаються анонімними один
                      для одного.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card hoverable className="p-8 space-y-6 bg-bg-secondary/60">
              <div className="flex items-center gap-4 border-b border-border-color pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                  <Database size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold uppercase font-mono text-text-primary">
                    02 / Технічний Регламент та FAIR-Стандарти
                  </h2>
                  <p className="text-[11px] font-mono text-text-muted">
                    Архітектура метаданих та GDPR-захист
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start mt-2">
                  <div className="p-2 bg-bg-tertiary border border-border-color rounded-lg text-brand shrink-0 mt-0.5">
                    <FileCode size={16} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold uppercase text-text-primary block">
                      Машиночитаність та Принципи FAIR
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Датасети та структуровані матеріали мають бути Findable
                      (легко знайти), Accessible (доступні), Interoperable
                      (сумісні) та Reusable (придатні для повторного
                      використання).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start mt-2">
                  <div className="p-2 bg-bg-tertiary border border-border-color rounded-lg text-brand shrink-0 mt-0.5">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold uppercase text-text-primary block">
                      Вимоги програм та RTE-Оформлення
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Організації самостійно публікують специфічні поля, формати
                      метаданих та прямі посилання на методичні вказівки
                      безпосередньо в описі програми через форматований
                      редактор.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start mt-2">
                  <div className="p-2 bg-bg-tertiary border border-border-color rounded-lg text-brand shrink-0 mt-0.5">
                    <FileLock2 size={16} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold uppercase text-text-primary block">
                      GDPR-Анонімізація та Чистка Хмари
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Користувачі мають право на анонімізацію профілю. При
                      завершенні чи очищенні наукових програм файли відхилених
                      робіт безповоротно видаляються із хмарного сховища.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
                // Життєвий цикл
              </span>
              <h2 className="text-2xl font-black font-sans uppercase tracking-tight">
                Етапи верифікації наукової праці
              </h2>
            </div>

            <Card className="p-8 bg-bg-secondary/60">
              <Timeline steps={verificationSteps} />
            </Card>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono uppercase text-brand font-bold tracking-widest">
                // Пояснення регламенту
              </span>
              <h2 className="text-2xl font-black font-sans uppercase tracking-tight">
                Популярні запитання щодо правил
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <Accordion key={idx} title={item.q}>
                  {item.a}
                </Accordion>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
