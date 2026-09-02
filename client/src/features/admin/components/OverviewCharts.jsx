import React from "react";
import Card from "@/shared/ui/Card";
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
import { BarChart3, PieChart as PieIcon } from "lucide-react";

const PIE_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#10b981", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-secondary border border-border-color p-2.5 rounded-md shadow-2xl font-mono text-xs space-y-1 backdrop-blur-md">
        <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold">
          {label || payload[0].name}
        </p>
        <p className="text-brand font-bold">
          {payload[0].value}{" "}
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
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 bg-bg-secondary border-border-color space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand">
            <BarChart3 size={16} />
            <span>Розподіл праць за галузями</span>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          {domainData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={domainData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="purpleBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.15}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="domain"
                  stroke="#64748b"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={{ stroke: "#1e293b" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#purpleBarGradient)"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  activeBar={{
                    fill: "#8b5cf6",
                    stroke: "#f8fafc",
                    strokeWidth: 1.5,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center font-mono text-xs text-text-muted">
              Дані для графіку відсутні
            </div>
          )}
        </div>
      </Card>

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
            <div className="font-mono text-xs text-text-muted">Немає даних</div>
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
                  className="w-2 h-2 rounded-sm"
                  style={{
                    backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                  }}
                />
                <span className="text-text-muted">{item.name || "Інше"}</span>
              </div>
              <span className="font-bold text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
