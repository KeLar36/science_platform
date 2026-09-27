import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Building2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import Avatar from "@/shared/ui/Avatar";
import Skeleton from "@/shared/ui/Skeleton";
import Breadcrumbs from "@/shared/ui/Breadcrumbs";
import Navbar from "@/shared/lib/components/layout/Navbar";
import Footer from "@/shared/lib/components/layout/Footer";
import { organizationApi } from "@/features/organization/api/organizationApi";

export default function OrganizationsPage() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Всі");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const breadcrumbItems = [
    { label: "Головна", href: "/" },
    { label: "Реєстр наукових установ", active: true },
  ];

  const orgTypes = [
    "Всі",
    "Університет",
    "НДІ",
    "Наукове видавництво",
    "Державна структура",
    "Приватна компанія",
  ];

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        search: search.trim() || undefined,
        type: selectedType !== "Всі" ? selectedType : undefined,
      };

      const res = await organizationApi.getPublicList(filters);

      const data = Array.isArray(res)
        ? res
        : res.organizations || res.items || [];

      setOrganizations(data);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Помилка завантаження організацій:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType]);
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return (
    <>
      <Navbar />

      <div className="max-w-7xl py-5 mx-auto px-4 lg:px-0 space-y-8 text-left my-20">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="space-y-2">
          <h1 className="text-3xl font-black font-sans uppercase text-text-primary tracking-tight">
            Реєстр наукових установ
          </h1>
          <p className="text-sm text-text-muted font-mono max-w-2xl">
            Каталог підтверджених університетів, дослідницьких інститутів та
            видавництв, які публікують програми та рецензують наукові матеріали.
          </p>
        </div>

        <Card className="p-4 bg-bg-secondary/60 border-border-color backdrop-blur-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <Input
                placeholder="Пошук за назвою або ЄДРПОУ..."
                icon={Search}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {orgTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                    selectedType === type
                      ? "bg-brand text-white font-bold"
                      : "bg-bg-tertiary text-text-muted hover:text-text-primary border border-border-color"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton
                key={i}
                variant="rectangle"
                height="220px"
                className="rounded-xl"
              />
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <Card className="p-12 text-center space-y-3 bg-bg-secondary/40 border-border-color">
            <Building2 className="w-12 h-12 mx-auto text-text-muted opacity-50" />
            <h3 className="text-lg font-bold text-text-primary uppercase">
              Установ не знайдено
            </h3>
            <p className="text-xs font-mono text-text-muted">
              За вашим запитом не знайдено жодної підтвердженої організації.
              Спробуйте змінити фільтри.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => {
              const targetId = org._id || org.id;

              return (
                <Card
                  key={targetId}
                  className="p-5 bg-bg-secondary/60 border-border-color hover:border-brand/50 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
                  onClick={() =>
                    targetId && navigate(`/organizations/${targetId}`)
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <Avatar
                        src={org.logo}
                        name={org.name}
                        size="lg"
                        className="w-14 h-14 rounded-xl shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col items-end gap-1">
                        <Badge status="default" className="text-[10px]">
                          {org.type || "Установа"}
                        </Badge>
                        {org.isVerified && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <ShieldCheck size={12} /> Верифіковано
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-text-primary line-clamp-2 group-hover:text-brand transition-colors">
                        {org.name}
                      </h3>
                      <p className="text-xs text-text-muted font-mono flex items-center gap-1">
                        <MapPin size={12} /> {org.city || "Україна"} • ЄДРПОУ:{" "}
                        {org.edrpou}
                      </p>
                    </div>

                    {org.description && (
                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {org.description}
                      </p>
                    )}
                  </div>

                  <div
                    className="pt-4 mt-4 border-t border-border-color flex items-center justify-between text-xs font-mono text-brand hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (targetId) navigate(`/organizations/${targetId}`);
                    }}
                  >
                    <span>Переглянути профіль</span>
                    <ExternalLink
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
