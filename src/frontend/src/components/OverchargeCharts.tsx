import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AuditSummary, ErrorType } from "../types";

interface OverchargeChartsProps {
  summary: AuditSummary;
}

const ERROR_LABELS: Record<ErrorType, string> = {
  WEIGHT_OVERCHARGE: "Weight",
  RTO_OVERCHARGE: "RTO",
  NON_CONTRACTED_SURCHARGE: "Surcharge",
  INCORRECT_COD_FEE: "COD Fee",
  DUPLICATE_AWB: "Duplicate",
  ZONE_MISMATCH: "Zone",
  RATE_DEVIATION: "Rate Dev.",
};

const ERROR_COLORS: Record<ErrorType, string> = {
  WEIGHT_OVERCHARGE: "#e07b4a",
  RTO_OVERCHARGE: "#e04a4a",
  NON_CONTRACTED_SURCHARGE: "#c44ae0",
  INCORRECT_COD_FEE: "#e0b44a",
  DUPLICATE_AWB: "#e04a8a",
  ZONE_MISMATCH: "#4a9ae0",
  RATE_DEVIATION: "#4ae09a",
};

const PROVIDER_COLORS = ["#e07b4a", "#4a9ae0", "#4ae09a", "#c44ae0"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; fill?: string }>;
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-card text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-primary font-mono">
          ₹
          {payload[0].value.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-card text-sm">
        <p className="font-semibold text-foreground mb-1">{payload[0].name}</p>
        <p className="font-mono" style={{ color: payload[0].fill }}>
          ₹
          {Number(payload[0].value).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    );
  }
  return null;
}

export default function OverchargeCharts({ summary }: OverchargeChartsProps) {
  const barData = (
    Object.entries(summary.errorsByType) as [ErrorType, number][]
  )
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([type, amount]) => ({
      name: ERROR_LABELS[type] ?? type,
      amount,
      fill: ERROR_COLORS[type] ?? "#888",
    }));

  const providerData = Object.entries(summary.errorsByProvider)
    .filter(([, v]) => v > 0)
    .map(([name, amount], i) => ({
      name,
      value: amount,
      fill: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
    }));

  const hasProviderData = providerData.length > 0;

  return (
    <div
      className={`grid gap-6 ${hasProviderData ? "lg:grid-cols-2" : "grid-cols-1"}`}
    >
      {/* Bar Chart: Overcharges by Error Type */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wide">
          Overcharges by Error Type
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          Amount overcharged per error category (₹)
        </p>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={barData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.02 255)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "oklch(0.58 0.02 255)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.58 0.02 255)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                }
              />
              <Tooltip
                content={<CustomBarTooltip />}
                cursor={{ fill: "oklch(0.22 0.018 255 / 0.5)" }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No overcharges detected
            </p>
          </div>
        )}
      </div>

      {/* Pie Chart: Overcharges by Provider */}
      {hasProviderData && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wide">
            Overcharges by Provider
          </h3>
          <p className="text-xs text-muted-foreground mb-6">
            Distribution of overcharges across logistics partners
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={providerData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {providerData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span
                    style={{ color: "oklch(0.85 0.008 250)", fontSize: "12px" }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
