import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Upload,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { LogisticsProvider } from "../types";

interface UploadViewProps {
  onRunAudit: (
    invoiceFile: File | null,
    contractFile: File | null,
    provider: LogisticsProvider,
    useSample: boolean,
  ) => void;
}

const PROVIDERS: {
  name: LogisticsProvider;
  color: string;
  accent: string;
  abbr: string;
}[] = [
  {
    name: "Delhivery",
    color: "border-red-500/40 bg-red-500/10 hover:bg-red-500/20",
    accent: "text-red-400",
    abbr: "DLV",
  },
  {
    name: "BlueDart",
    color: "border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20",
    accent: "text-blue-400",
    abbr: "BD",
  },
  {
    name: "Ecom Express",
    color: "border-green-500/40 bg-green-500/10 hover:bg-green-500/20",
    accent: "text-green-400",
    abbr: "ECX",
  },
  {
    name: "Shadowfax",
    color: "border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20",
    accent: "text-purple-400",
    abbr: "SFX",
  },
];

const DEMO_STATS = [
  { label: "Line Items Processed", value: "847", unit: "items" },
  { label: "Manual Time", value: "4 hrs", unit: "human" },
  { label: "Tool Time", value: "3 min", unit: "AI" },
  { label: "Overcharges Found", value: "₹18,400", unit: "recovered" },
];

interface DropZoneProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  file: File | null;
  onFile: (f: File) => void;
  ocid: string;
}

function DropZone({
  label,
  sublabel,
  icon,
  file,
  onFile,
  ocid,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      data-ocid={ocid}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`
        relative rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200
        ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : file
              ? "border-success/60 bg-success/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            file
              ? "bg-success/20"
              : isDragging
                ? "bg-primary/20"
                : "bg-secondary"
          }`}
        >
          {file ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <div
              className={isDragging ? "text-primary" : "text-muted-foreground"}
            >
              {icon}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">
            {file ? file.name : label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {file ? `${(file.size / 1024).toFixed(1)} KB · Ready` : sublabel}
          </p>
        </div>
        {!file && (
          <Badge
            variant="outline"
            className="text-xs text-muted-foreground border-border"
          >
            CSV format
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export default function UploadView({ onRunAudit }: UploadViewProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<LogisticsProvider>("Delhivery");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);

  const canRun = invoiceFile && contractFile;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

        {/* Glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge
              variant="outline"
              className="mb-6 text-xs font-mono border-primary/40 text-primary bg-primary/10 px-3 py-1"
            >
              ⚡ AI-POWERED LOGISTICS BILLING AUDIT
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-foreground mb-6 leading-[1.05]">
              Stop <span className="text-primary">Overpaying</span> Your{" "}
              <span className="relative inline-block">
                Logistics Bills
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  height="4"
                  viewBox="0 0 100 4"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  role="presentation"
                >
                  <path
                    d="M0,2 Q25,0 50,2 T100,2"
                    stroke="oklch(0.72 0.18 55)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your logistics invoice and rate contract. Our AI
              cross-checks every line item, flags discrepancies, and prepares a
              clean payout file — in minutes, not days.
            </p>

            {/* Demo Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {DEMO_STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="bg-card border border-border rounded-xl p-4 text-center"
                >
                  <div
                    className={`text-2xl sm:text-3xl font-mono font-black tracking-tight ${
                      stat.label === "Overcharges Found"
                        ? "text-destructive"
                        : stat.label === "Manual Time"
                          ? "text-warning"
                          : stat.label === "Tool Time"
                            ? "text-success"
                            : "text-primary"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wide">
                    {stat.unit}
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Provider Selection */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 block uppercase tracking-wide">
                Select Logistics Provider
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROVIDERS.map((p) => (
                  <motion.button
                    key={p.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProvider(p.name)}
                    className={`
                      relative rounded-xl border-2 p-4 text-center transition-all duration-200 cursor-pointer
                      ${
                        selectedProvider === p.name
                          ? `${p.color} border-opacity-100`
                          : "border-border bg-card hover:bg-secondary/50"
                      }
                    `}
                  >
                    {selectedProvider === p.name && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className={`w-4 h-4 ${p.accent}`} />
                      </div>
                    )}
                    <div
                      className={`text-xl font-mono font-black mb-1 ${selectedProvider === p.name ? p.accent : "text-muted-foreground"}`}
                    >
                      {p.abbr}
                    </div>
                    <div className="text-xs text-foreground font-medium">
                      {p.name}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Upload Zones */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 block uppercase tracking-wide">
                  Invoice
                </p>
                <DropZone
                  label="Upload Invoice (CSV)"
                  sublabel="Drag & drop or click to browse"
                  icon={<FileText className="w-6 h-6" />}
                  file={invoiceFile}
                  onFile={setInvoiceFile}
                  ocid="upload.invoice.dropzone"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 block uppercase tracking-wide">
                  Rate Contract
                </p>
                <DropZone
                  label="Upload Rate Card / Contract"
                  sublabel="Drag & drop or click to browse"
                  icon={<Upload className="w-6 h-6" />}
                  file={contractFile}
                  onFile={setContractFile}
                  ocid="upload.contract.dropzone"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Button
                size="lg"
                data-ocid="upload.sample_button"
                variant="outline"
                onClick={() => onRunAudit(null, null, selectedProvider, true)}
                className="w-full sm:w-auto gap-2 border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary"
              >
                <Zap className="w-4 h-4" />
                Use Sample Data
                <Badge
                  variant="outline"
                  className="text-xs ml-1 border-primary/30 text-primary bg-primary/10"
                >
                  DEMO
                </Badge>
              </Button>

              <AnimatePresence>
                {canRun ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full sm:flex-1"
                  >
                    <Button
                      size="lg"
                      data-ocid="upload.run_button"
                      className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-glow"
                      onClick={() =>
                        onRunAudit(
                          invoiceFile,
                          contractFile,
                          selectedProvider,
                          false,
                        )
                      }
                    >
                      Run Audit
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full sm:flex-1"
                  >
                    <Button
                      size="lg"
                      data-ocid="upload.run_button"
                      disabled
                      className="w-full gap-2 opacity-40"
                    >
                      Run Audit
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Upload both invoice and rate card CSV files, or click "Use Sample
              Data" to try with a 30-item Delhivery demo dataset
            </p>
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h2 className="text-center text-sm font-mono uppercase tracking-widest text-muted-foreground mb-8">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Extract",
                desc: "AI reads your invoice CSV and extracts AWB numbers, weights, zones, and all charge components",
                color: "text-primary",
                bg: "bg-primary/10 border-primary/30",
              },
              {
                step: "02",
                title: "Check",
                desc: "Cross-verifies every line item against your rate contract — weight, zones, COD fees, RTO charges, surcharges",
                color: "text-accent",
                bg: "bg-accent/10 border-accent/30",
              },
              {
                step: "03",
                title: "Payout",
                desc: "Generates a clean discrepancy report and a verified payout file ready for your finance team",
                color: "text-success",
                bg: "bg-success/10 border-success/30",
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-black text-sm ${item.bg} ${item.color}`}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-base mb-1 ${item.color}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                {i < 2 && (
                  <ChevronRight className="w-4 h-4 text-border self-center hidden sm:block shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
