import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail,
  MapPin,
  UserPlus,
  ArrowRight,
  Globe,
  Calendar,
  FileText,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import Tabs from "@/shared/ui/Tabs";
import Avatar from "@/shared/ui/Avatar";
import Skeleton from "@/shared/ui/Skeleton";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import { useAuth } from "@/shared/lib/context/AuthContext";
import { useOrganizationDetails } from "@/features/organization/hooks/useOrganizationDetails";
import ProjectDetailModal from "@/features/projects/components/ProjectDetailModal";
import { organizationApi } from "@/features/organization/api/organizationApi";

export default function OrganizationDetails() {
  const { id: orgId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    orgData,
    programs,
    projects,
    posts,
    loadingOrg,
    loadingPrograms,
    loadingProjects,
    loadingPosts,
    fetchOrgDetails,
    fetchPrograms,
    fetchProjects,
    fetchPosts,
  } = useOrganizationDetails(orgId);

  const [activeTab, setActiveTab] = useState("overview");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const userOrgId = user?.organizationId?._id || user?.organizationId;
  const isMemberOfThisOrg = userOrgId && String(userOrgId) === String(orgId);
  const hasPendingRequest =
    user?.pendingJoinRequestOrgId &&
    String(user?.pendingJoinRequestOrgId) === String(orgId);

  useEffect(() => {
    if (orgId) fetchOrgDetails();
  }, [orgId, fetchOrgDetails]);

  useEffect(() => {
    if (!orgId) return;

    if (activeTab === "programs" && programs.length === 0) fetchPrograms(1);
    if (activeTab === "projects" && projects.length === 0) fetchProjects(1);
    if (activeTab === "posts" && posts.length === 0) fetchPosts(1);
  }, [
    orgId,
    activeTab,
    programs.length,
    projects.length,
    posts.length,
    fetchPrograms,
    fetchProjects,
    fetchPosts,
  ]);

  const handleJoinRequest = async () => {
    try {
      setJoinLoading(true);
      await organizationApi.requestToJoin(orgId);
      setJoinMessage("Запит на вступ надіслано!");
    } catch (err) {
      setJoinMessage(err.response?.data?.error || "Помилка відправки запиту");
    } finally {
      setJoinLoading(false);
    }
  };

  const stripHtml = (html) => (html ? html.replace(/<[^>]*>?/gm, "") : "");

  const breadcrumbItems = [
    { label: "Головна", href: "/" },
    { label: "Установи", href: "/organizations" },
    { label: orgData?.name || "Деталі", active: true },
  ];

  const publicTabs = [
    { id: "overview", label: "Про нас" },
    { id: "programs", label: "Активні програми" },
    { id: "projects", label: "Наукові доробки" },
    { id: "posts", label: "Новини та блог" },
  ];

  if (loadingOrg && !orgData) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4 mt-20">
        <Skeleton variant="rectangle" height="140px" className="rounded-xl" />
        <Skeleton variant="rectangle" height="320px" className="rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl py-5 mx-auto px-3 lg:px-0 space-y-6 text-left my-20">
        <Breadcrumbs items={breadcrumbItems} />

        <Card className="bg-bg-secondary/70 border-border-color backdrop-blur-md shadow-xl rounded-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar
                src={orgData?.logo}
                name={orgData?.name || "Science Platform"}
                size="lg"
                className="w-20 h-20 text-2xl rounded-2xl shrink-0 border-2 border-border-color"
              />

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black uppercase text-text-primary">
                    {orgData?.name || "Наукова установа"}
                  </h1>
                  {orgData?.isVerified && (
                    <Badge status="success" className="flex items-center gap-1">
                      <ShieldCheck size={12} /> Верифіковано
                    </Badge>
                  )}
                  <Badge status="default">{orgData?.type || "Установа"}</Badge>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-text-muted flex-wrap">
                  <span className="bg-bg-tertiary px-2 py-0.5 rounded border border-border-color">
                    ЄДРПОУ: {orgData?.edrpou || "Н/Д"}
                  </span>
                  {orgData?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-brand" /> {orgData.city}
                    </span>
                  )}
                  {orgData?.website && (
                    <a
                      href={
                        orgData.website.startsWith("http")
                          ? orgData.website
                          : `https://${orgData.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-brand hover:underline"
                    >
                      <Globe size={13} /> {orgData.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div>
              {isMemberOfThisOrg ? (
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => navigate("/organization/dashboard")}
                >
                  Кабінет
                </Button>
              ) : hasPendingRequest ? (
                <Badge status="warning">Заявку надіслано</Badge>
              ) : user && orgData?.allowPublicJoin ? (
                <Button
                  variant="primary"
                  icon={UserPlus}
                  loading={joinLoading}
                  onClick={handleJoinRequest}
                >
                  Подати заявку
                </Button>
              ) : !orgData?.allowPublicJoin ? (
                <span className="text-xs font-mono text-text-muted italic">
                  🔒 Вступ за запрошенням
                </span>
              ) : (
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Увійдіть для вступу
                </Button>
              )}
              {joinMessage && (
                <p className="text-xs font-mono mt-2 text-brand">
                  {joinMessage}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Tabs tabs={publicTabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 space-y-4 bg-bg-secondary/50 border-border-color">
              <h3 className="text-base font-bold uppercase text-text-primary flex items-center gap-2">
                <BookOpen size={18} className="text-brand" /> Про установу
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line font-sans">
                {orgData?.description || "Опис організації відсутній."}
              </p>
            </Card>

            <Card className="space-y-4 bg-bg-secondary/50 border-border-color h-fit">
              <h3 className="text-base font-bold uppercase text-text-primary">
                Контакти
              </h3>
              <div className="space-y-3 text-xs font-mono text-text-muted">
                {orgData?.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-brand" />
                    {orgData.email}
                  </div>
                )}
                {orgData?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand" />
                    м. {orgData.city}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Офіційна установа
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "programs" && (
          <div className="space-y-4">
            {loadingPrograms ? (
              <Skeleton variant="rectangle" height="150px" />
            ) : programs.length === 0 ? (
              <Card className="text-center text-text-muted font-mono text-xs">
                Наразі немає відкритих активних програм чи конкурсів.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((prog) => {
                  const targetId = prog._id || prog.id;
                  const deadlineDate =
                    prog.deadline || prog.deadlineDate || prog.endDate;
                  const formattedDate = deadlineDate
                    ? new Date(deadlineDate).toLocaleDateString("uk-UA")
                    : "Не вказано";

                  return (
                    <div
                      key={targetId}
                      onClick={() =>
                        targetId && navigate(`/programs/${targetId}`)
                      }
                      className="cursor-pointer group"
                    >
                      <Card className="bg-bg-secondary/60 border-border-color group-hover:border-brand/60 transition-all h-full flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <Badge status="primary">
                              {prog.type || "Конкурс"}
                            </Badge>
                            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                              <Clock size={12} /> До: {formattedDate}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-text-primary group-hover:text-brand transition-colors">
                            {prog.title}
                          </h4>
                          <p className="text-xs text-text-muted line-clamp-2">
                            {stripHtml(
                              prog.description ||
                                prog.shortDescription ||
                                prog.summary,
                            )}
                          </p>
                        </div>
                        <div className="pt-4 mt-4 border-t border-border-color/60 flex items-center justify-between text-xs font-mono text-brand">
                          <span>Детальніше про конкурс</span>
                          <ArrowRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-4">
            {loadingProjects ? (
              <Skeleton variant="rectangle" height="120px" />
            ) : projects.length === 0 ? (
              <Card className="text-center text-text-muted font-mono text-xs">
                Немає затверджених матеріалів.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj._id || proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className="cursor-pointer group"
                  >
                    <Card className="bg-bg-secondary/60 border-border-color group-hover:border-brand/60 transition-all h-full flex flex-col justify-between">
                      <div className="space-y-2">
                        <Badge status="success">Прийнято до публікації</Badge>
                        <h4 className="text-base font-bold text-text-primary group-hover:text-brand transition-colors">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-text-muted line-clamp-2">
                          {stripHtml(proj.description || proj.abstract)}
                        </p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-border-color/60 flex items-center justify-between text-xs font-mono text-brand">
                        <span className="flex items-center gap-1">
                          <FileText size={13} /> Переглянути роботу
                        </span>
                        <ExternalLink size={13} />
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-4">
            {loadingPosts ? (
              <Skeleton variant="rectangle" height="200px" />
            ) : posts.length === 0 ? (
              <Card className="text-center text-text-muted font-mono text-xs p-8">
                Організація ще не має публікацій у блозі.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                  const targetId = post._id || post.id;
                  const cleanText = stripHtml(
                    post.excerpt || post.summary || post.content,
                  );

                  return (
                    <div
                      key={targetId}
                      onClick={() => targetId && navigate(`/blog/${targetId}`)}
                      className="cursor-pointer group"
                    >
                      <Card className="bg-bg-secondary/60 border-border-color group-hover:border-brand/60 transition-all h-full flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                            <Badge status="default">
                              {post.category || "Новина"}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />{" "}
                              {new Date(post.createdAt).toLocaleDateString(
                                "uk-UA",
                              )}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-text-primary group-hover:text-brand transition-colors line-clamp-2">
                            {post.title}
                          </h4>

                          {/* 💡 ВИПРАВЛЕНИЙ ОПИС З ЗБЕРЕЖЕННЯМ ПЕРЕНОСІВ */}
                          <p className="text-xs text-text-muted line-clamp-3 leading-relaxed whitespace-pre-line font-sans">
                            {cleanText || "Текст публікації відсутній."}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-border-color/60 flex items-center justify-between text-xs font-mono text-brand">
                          <span>Читати повністю</span>
                          <ArrowRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <Footer />
    </>
  );
}
