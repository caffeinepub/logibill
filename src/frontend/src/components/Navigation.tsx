import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, History, Package, Plus } from "lucide-react";
import { motion } from "motion/react";
import type { LogisticsProvider } from "../types";

interface NavigationProps {
  view: "upload" | "processing" | "results" | "history";
  onNewAudit: () => void;
  onHistory: () => void;
  activeProvider?: LogisticsProvider;
}

const PROVIDER_COLORS: Record<LogisticsProvider, string> = {
  Delhivery: "bg-red-500/20 text-red-400 border-red-500/30",
  BlueDart: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Ecom Express": "bg-green-500/20 text-green-400 border-green-500/30",
  Shadowfax: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function Navigation({
  view,
  onNewAudit,
  onHistory,
  activeProvider,
}: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-black text-lg tracking-tight text-foreground">
            Logi<span className="text-primary">Bill</span>
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:block" />
          <span className="text-xs text-muted-foreground hidden sm:block font-mono uppercase tracking-widest">
            Billing Checker
          </span>
        </motion.div>

        {/* Center: breadcrumb context */}
        {activeProvider && (
          <div className="flex items-center gap-2 hidden md:flex">
            <Badge
              variant="outline"
              className={`text-xs ${PROVIDER_COLORS[activeProvider]}`}
            >
              {activeProvider}
            </Badge>
          </div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHistory}
            data-ocid="nav.history.link"
            className={`gap-2 text-sm ${view === "history" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            size="sm"
            onClick={onNewAudit}
            data-ocid="nav.new_audit.link"
            className="gap-2 text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            <span>New Audit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
