import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { generateDiscrepancyCSV, generatePayoutCSV } from "../billingEngine";
import { downloadCSV } from "../csvParser";
import type {
  AuditResult,
  LogisticsProvider,
  ProcessedLineItem,
} from "../types";
import DiscrepancyPanel from "./DiscrepancyPanel";
import LineItemsTable from "./LineItemsTable";
import OverchargeCharts from "./OverchargeCharts";
import SummaryCards from "./SummaryCards";

interface ResultsDashboardProps {
  result: AuditResult;
  provider: LogisticsProvider;
  onNewAudit: () => void;
}

const PROVIDER_COLORS: Record<LogisticsProvider, string> = {
  Delhivery: "bg-red-500/15 text-red-400 border-red-500/30",
  BlueDart: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Ecom Express": "bg-green-500/15 text-green-400 border-green-500/30",
  Shadowfax: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export default function ResultsDashboard({
  result,
  provider,
  onNewAudit,
}: ResultsDashboardProps) {
  const [selectedItem, setSelectedItem] = useState<ProcessedLineItem | null>(
    null,
  );

  const handleDownloadDiscrepancy = () => {
    const csv = generateDiscrepancyCSV(result);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(
      csv,
      `discrepancy-report-${provider.toLowerCase().replace(/\s+/g, "-")}-${date}.csv`,
    );
  };

  const handleDownloadPayout = () => {
    const csv = generatePayoutCSV(result);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(
      csv,
      `payout-file-${provider.toLowerCase().replace(/\s+/g, "-")}-${date}.csv`,
    );
  };

  return (
    <main className="min-h-screen pb-16">
      {/* Results Header */}
      <section className="border-b border-border bg-secondary/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${PROVIDER_COLORS[provider]}`}
                >
                  {provider}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-border text-muted-foreground font-mono"
                >
                  {result.processedItems.length} line items
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground">
                Audit Results
              </h1>
              {result.summary.errorCount > 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Found{" "}
                  <span className="text-destructive font-semibold">
                    {result.summary.errorCount} discrepancies
                  </span>{" "}
                  totaling{" "}
                  <span className="text-destructive font-semibold font-mono">
                    ₹
                    {result.summary.totalOvercharges.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>{" "}
                  in overcharges
                </p>
              ) : (
                <p className="text-sm text-success mt-1">
                  ✓ All {result.processedItems.length} line items verified. No
                  discrepancies found.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                data-ocid="results.download_discrepancy.button"
                onClick={handleDownloadDiscrepancy}
                className="gap-2 border-border hover:border-primary/50 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Discrepancy Report
                <Download className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-ocid="results.download_payout.button"
                onClick={handleDownloadPayout}
                className="gap-2 border-border hover:border-success/50 text-xs text-success hover:text-success"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Payout File
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                data-ocid="results.new_audit.button"
                onClick={onNewAudit}
                className="gap-2 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                variant="outline"
              >
                <Plus className="w-3.5 h-3.5" />
                New Audit
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SummaryCards summary={result.summary} />
        </motion.div>

        {/* Charts */}
        {result.discrepancies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <OverchargeCharts summary={result.summary} />
          </motion.div>
        )}

        {/* Line Items Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">Line Items</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click a flagged row to view discrepancy details
            </p>
          </div>
          <LineItemsTable
            items={result.processedItems}
            onRowClick={setSelectedItem}
          />
        </motion.div>
      </div>

      {/* Discrepancy Side Panel */}
      <DiscrepancyPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </main>
  );
}
