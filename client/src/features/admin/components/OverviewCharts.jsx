import Card from "@/shared/ui/Card";
import Badge from "@/shared/ui/Badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Award } from "lucide-react";

// Чіткі, виразні та контрастні кольори
const PIE_COLORS = [
  "#8b5cf6", // Violet (Brand)
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
];

const formatDomainLabel = (label) => {
  if (!label) return "";
  if (label.length > 22) return `${label.substring(0, 20)}...`;
  return label;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload?.fill || data.color || "#8b5cf6";

    return (
      <div className="bg-bg-secondary border border-border-color p-2.5 rounded-md shadow-2xl font-mono text-xs space-y-1 backdrop-blur-md z-50">
        <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold">
          {label || data.name}
        </p>
        <p className="font-bold flex items-center gap-1.5" style={{ color }}>
          {data.value}{" "}
          <span className="text-text-secondary font-normal">од.</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function OverviewCharts({
  domainData = [],
  programTypesData = [],
  kpis = {},
}) {
  const chartHeight = Math.max(280, domainData.length * 32);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <Card className="lg:col-span-2 p-6 bg-bg-secondary border-border-color h-full flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand">
            <BarChart3 size={16} />
            <span>Розподіл праць за галузями</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            Всього галузей: {domainData.length}
          </span>
        </div>

        <div className="w-full pt-2 flex-1 overflow-y-auto overflow-x-auto max-h-[460px] custom-scrollbar">
          {domainData.length > 0 ? (
            <div
              style={{ height: `${chartHeight}px` }}
              className="w-full min-w-[550px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={domainData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="purpleBarGradientHorizontal"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: "#1e293b" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="domain"
                    stroke="#94a3b8"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    width={160}
                    tickFormatter={formatDomainLabel}
                    interval={0}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#purpleBarGradientHorizontal)"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                    activeBar={{
                      fill: "#8b5cf6",
                      stroke: "#f8fafc",
                      strokeWidth: 1.5,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center font-mono text-xs text-text-muted">
              Дані для графіку відсутні
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6 flex flex-col justify-between">
        <Card className="p-6 bg-bg-secondary border-border-color space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
            <PieIcon size={16} className="text-brand" />
            <span>Структура наукових програм</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {programTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={programTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#090d16"
                    strokeWidth={2}
                  >
                    {programTypesData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        className="transition-all duration-200 outline-none hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="font-mono text-xs text-text-muted">
                Немає даних
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border-color/60 pt-3">
            {programTypesData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] font-mono"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-text-muted">{item.name || "Інше"}</span>
                </div>
                <span className="font-bold text-text-primary">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-bg-secondary border-border-color space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            <div className="flex items-center gap-2">
              <Award size={16} />
              <span>Експертна оцінка</span>
            </div>
            <Badge status="success">
              {kpis.avgReviewScore ? `${kpis.avgReviewScore} / 5` : "N/A"}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-xs font-mono text-text-muted pt-1">
            <span>Завершених рецензій:</span>
            <span className="font-bold text-text-primary">
              {kpis.completedReviewProjects || 0}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono text-text-muted">
            <span>В процесі оцінювання:</span>
            <span className="font-bold text-amber-500">
              {kpis.inReviewProjects || 0}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
