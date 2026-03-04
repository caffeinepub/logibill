import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { runAudit } from "./billingEngine";
import HistoryView from "./components/HistoryView";
import Navigation from "./components/Navigation";
import ProcessingView from "./components/ProcessingView";
import ResultsDashboard from "./components/ResultsDashboard";
import UploadView from "./components/UploadView";
import { parseInvoiceCSV, parseRateCardCSV } from "./csvParser";
import { SAMPLE_PROVIDER, sampleLineItems, sampleRateCard } from "./sampleData";
import type {
  AuditResult,
  AuditSession,
  LineItem,
  LogisticsProvider,
} from "./types";

type AppView = "upload" | "processing" | "results" | "history";

const STORAGE_KEY = "logibill_sessions";

function loadSessions(): AuditSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: AuditSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export default function App() {
  const [view, setView] = useState<AppView>("upload");
  const [processingStage, setProcessingStage] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [currentResult, setCurrentResult] = useState<AuditResult | null>(null);
  const [currentProvider, setCurrentProvider] =
    useState<LogisticsProvider>("Delhivery");
  const [sessions, setSessions] = useState<AuditSession[]>(() =>
    loadSessions(),
  );

  // Persist sessions on change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const runAuditFlow = useCallback(
    async (
      invoiceFile: File | null,
      contractFile: File | null,
      provider: LogisticsProvider,
      useSample: boolean,
    ) => {
      setCurrentProvider(provider);
      setView("processing");
      setProcessingStage(1);

      try {
        // Stage 1: Extract data
        let lineItems: LineItem[] = sampleLineItems.map((i) => ({
          ...i,
          provider,
        }));
        let rateCard = { ...sampleRateCard };

        if (!useSample) {
          // Parse real files
          const [invoiceText, contractText] = await Promise.all([
            invoiceFile?.text() ?? Promise.resolve(""),
            contractFile?.text() ?? Promise.resolve(""),
          ]);

          lineItems = parseInvoiceCSV(invoiceText, provider);
          if (lineItems.length === 0) {
            toast.error(
              "No valid line items found in invoice CSV. Check column headers.",
            );
            setView("upload");
            return;
          }

          const parsedRateCard = parseRateCardCSV(contractText);
          if (
            parsedRateCard.rates &&
            Object.keys(parsedRateCard.rates).length > 0
          ) {
            rateCard = {
              ...sampleRateCard,
              ...parsedRateCard,
            } as typeof sampleRateCard;
          }
        }

        setProcessingCount(lineItems.length);

        // Simulate staged processing with delays for UX
        await new Promise((r) => setTimeout(r, 800));

        // Stage 2: Check rates
        setProcessingStage(2);
        await new Promise((r) => setTimeout(r, 900));

        // Stage 3: Prepare payout
        setProcessingStage(3);
        await new Promise((r) => setTimeout(r, 600));

        // Run actual audit computation
        const result = runAudit(lineItems, rateCard);

        // Save session to history
        const session: AuditSession = {
          id: crypto.randomUUID(),
          provider,
          date: new Date().toISOString(),
          lineItemCount: result.processedItems.length,
          overchargeAmount: result.summary.totalOvercharges,
          errorCount: result.summary.errorCount,
          result,
        };

        setSessions((prev) => [...prev, session]);
        setCurrentResult(result);

        if (result.summary.errorCount > 0) {
          toast.error(
            `Found ${result.summary.errorCount} discrepancies — ₹${result.summary.totalOvercharges.toLocaleString("en-IN", { maximumFractionDigits: 0 })} in overcharges`,
            { duration: 5000 },
          );
        } else {
          toast.success("Audit complete — all items verified", {
            duration: 3000,
          });
        }

        setView("results");
      } catch (err) {
        console.error("Audit failed:", err);
        toast.error("Audit failed. Please check your CSV files and try again.");
        setView("upload");
      }
    },
    [],
  );

  const handleNewAudit = useCallback(() => {
    setView("upload");
    setCurrentResult(null);
    setProcessingStage(0);
    setProcessingCount(0);
  }, []);

  const handleViewSession = useCallback((session: AuditSession) => {
    setCurrentResult(session.result);
    setCurrentProvider(session.provider);
    setView("results");
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session deleted");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation
        view={view}
        onNewAudit={handleNewAudit}
        onHistory={() => setView("history")}
        activeProvider={
          view !== "upload" && view !== "history" ? currentProvider : undefined
        }
      />

      {view === "upload" && <UploadView onRunAudit={runAuditFlow} />}

      {view === "processing" && (
        <ProcessingView stage={processingStage} itemCount={processingCount} />
      )}

      {view === "results" && currentResult && (
        <ResultsDashboard
          result={currentResult}
          provider={currentProvider}
          onNewAudit={handleNewAudit}
        />
      )}

      {view === "history" && (
        <HistoryView
          sessions={sessions}
          onViewSession={handleViewSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-destructive">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
