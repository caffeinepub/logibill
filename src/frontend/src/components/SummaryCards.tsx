import { AlertTriangle, CheckCircle2, Hash, TrendingDown } from "lucide-react";
import { motion } from "motion/react";
import type { AuditSummary } from "../types";

interface SummaryCardsProps {
  summary: AuditSummary;
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const savings =
    summary.totalOvercharges > 0
      ? ((summary.totalOvercharges / summary.totalBilled) * 100).toFixed(1)
      : "0";

  const cards = [
    {
      id: "results.total_billed.card",
      label: "Total Billed",
      value: formatINR(summary.totalBilled),
      sub: "Invoice total",
      icon: <Hash className="w-4 h-4" />,
      variant: "neutral" as const,
    },
    {
      id: "results.verified.card",
      label: "Verified Amount",
      value: formatINR(summary.verifiedAmount),
      sub: "After corrections",
      icon: <CheckCircle2 className="w-4 h-4" />,
      variant: "success" as const,
    },
    {
      id: "results.overcharge.card",
      label: "Total Overcharges",
      value: formatINR(summary.totalOvercharges),
      sub: `${savings}% of invoice`,
      icon: <TrendingDown className="w-4 h-4" />,
      variant: "error" as const,
    },
    {
      id: "results.error_count.card",
      label: "Errors Found",
      value: summary.errorCount.toString(),
      sub: "Line items flagged",
      icon: <AlertTriangle className="w-4 h-4" />,
      variant: "warning" as const,
    },
  ];

  const variantStyles = {
    neutral: {
      bg: "bg-card border-border",
      icon: "bg-secondary text-muted-foreground",
      value: "text-foreground",
      sub: "text-muted-foreground",
    },
    success: {
      bg: "bg-card border-border",
      icon: "bg-success/15 text-success",
      value: "text-success",
      sub: "text-muted-foreground",
    },
    error: {
      bg: "bg-card border-destructive/20",
      icon: "bg-destructive/15 text-destructive",
      value: "text-destructive",
      sub: "text-muted-foreground",
    },
    warning: {
      bg: "bg-card border-border",
      icon: "bg-warning/15 text-warning",
      value: "text-warning",
      sub: "text-muted-foreground",
    },
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const styles = variantStyles[card.variant];
        return (
          <motion.div
            key={card.id}
            data-ocid={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-5 ${styles.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${styles.icon}`}
              >
                {card.icon}
              </div>
            </div>
            <div
              className={`text-2xl font-mono font-black tracking-tight ${styles.value} mb-1`}
            >
              {card.value}
            </div>
            <div className="text-xs font-semibold text-foreground/80">
              {card.label}
            </div>
            <div className={`text-xs ${styles.sub} mt-0.5`}>{card.sub}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
