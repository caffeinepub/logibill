import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, Package, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { AuditSession, LogisticsProvider } from "../types";

interface HistoryViewProps {
  sessions: AuditSession[];
  onViewSession: (session: AuditSession) => void;
  onDeleteSession: (id: string) => void;
}

const PROVIDER_COLORS: Record<LogisticsProvider, string> = {
  Delhivery: "bg-red-500/15 text-red-400 border-red-500/30",
  BlueDart: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Ecom Express": "bg-green-500/15 text-green-400 border-green-500/30",
  Shadowfax: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function HistoryView({
  sessions,
  onViewSession,
  onDeleteSession,
}: HistoryViewProps) {
  return (
    <main className="min-h-screen">
      <section className="border-b border-border bg-secondary/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-1">
            Audit History
          </h1>
          <p className="text-sm text-muted-foreground">
            {sessions.length > 0
              ? `${sessions.length} audit session${sessions.length !== 1 ? "s" : ""} saved locally`
              : "No audit sessions yet"}
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {sessions.length === 0 ? (
          <motion.div
            data-ocid="history.empty_state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No audits yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Run your first billing audit to see results here. Past sessions
              are saved in your browser.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sessions
                .slice()
                .reverse()
                .map((session, i) => (
                  <motion.div
                    key={session.id}
                    data-ocid={`history.item.${i + 1}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${PROVIDER_COLORS[session.provider]}`}
                            >
                              {session.provider}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(session.date)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Line Items
                              </p>
                              <p className="font-mono font-bold text-sm text-foreground">
                                {session.lineItemCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Errors Found
                              </p>
                              <p
                                className={`font-mono font-bold text-sm ${session.errorCount > 0 ? "text-destructive" : "text-success"}`}
                              >
                                {session.errorCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Overcharges
                              </p>
                              <p
                                className={`font-mono font-bold text-sm ${session.overchargeAmount > 0 ? "text-destructive" : "text-success"}`}
                              >
                                ₹
                                {session.overchargeAmount.toLocaleString(
                                  "en-IN",
                                  { maximumFractionDigits: 0 },
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Savings
                              </p>
                              <p className="font-mono font-bold text-sm text-success">
                                ₹
                                {session.overchargeAmount.toLocaleString(
                                  "en-IN",
                                  { maximumFractionDigits: 0 },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSession(session)}
                          className="gap-1.5 text-xs border-border hover:border-primary/50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`history.delete_button.${i + 1}`}
                          onClick={() => onDeleteSession(session.id)}
                          className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
