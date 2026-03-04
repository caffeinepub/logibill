import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ErrorType, ProcessedLineItem } from "../types";

interface DiscrepancyPanelProps {
  item: ProcessedLineItem | null;
  onClose: () => void;
}

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  WEIGHT_OVERCHARGE: "Weight Overcharge",
  RTO_OVERCHARGE: "RTO Overcharge",
  NON_CONTRACTED_SURCHARGE: "Non-Contracted Surcharge",
  INCORRECT_COD_FEE: "Incorrect COD Fee",
  DUPLICATE_AWB: "Duplicate AWB",
  ZONE_MISMATCH: "Zone Mismatch",
  RATE_DEVIATION: "Rate Deviation",
};

const ERROR_TYPE_COLORS: Record<ErrorType, string> = {
  WEIGHT_OVERCHARGE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  RTO_OVERCHARGE: "bg-red-500/15 text-red-400 border-red-500/30",
  NON_CONTRACTED_SURCHARGE:
    "bg-purple-500/15 text-purple-400 border-purple-500/30",
  INCORRECT_COD_FEE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  DUPLICATE_AWB: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ZONE_MISMATCH: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  RATE_DEVIATION: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function DiscrepancyPanel({
  item,
  onClose,
}: DiscrepancyPanelProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            data-ocid="results.detail.panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-[−8px_0_40px_rgba(0,0,0,0.4)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
                  Discrepancy Detail
                </p>
                <h3 className="font-mono font-bold text-foreground text-lg">
                  {item.awb}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-ocid="results.detail.close_button"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                {/* Shipment Info */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Date", value: item.shipmentDate },
                    { label: "Zone", value: item.zone },
                    { label: "Origin", value: item.origin },
                    { label: "Destination", value: item.destination },
                    { label: "Charged Wt", value: `${item.chargedWeight}kg` },
                    { label: "Actual Wt", value: `${item.actualWeight}kg` },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="bg-secondary/50 rounded-lg p-3"
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {field.label}
                      </p>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Charges Summary */}
                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Charges
                  </p>
                  {[
                    { label: "Freight", value: item.freightCharge },
                    { label: "COD Fee", value: item.codCharge },
                    { label: "RTO Charge", value: item.rtoCharge },
                    { label: "Fuel Surcharge", value: item.fuelSurcharge },
                    { label: "Handling", value: item.handlingCharge },
                    { label: "Other", value: item.otherCharges },
                  ]
                    .filter((c) => c.value > 0)
                    .map((charge) => (
                      <div
                        key={charge.label}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {charge.label}
                        </span>
                        <span className="font-mono text-foreground">
                          {formatINR(charge.value)}
                        </span>
                      </div>
                    ))}
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-foreground">Billed Total</span>
                    <span className="font-mono text-foreground">
                      {formatINR(item.totalCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-success">Verified Total</span>
                    <span className="font-mono text-success">
                      {formatINR(item.verifiedTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-destructive">Overcharge</span>
                    <span className="font-mono text-destructive">
                      {formatINR(item.totalCharge - item.verifiedTotal)}
                    </span>
                  </div>
                </div>

                {/* Errors */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    {item.errors.length} Error
                    {item.errors.length !== 1 ? "s" : ""} Detected
                  </p>
                  <div className="space-y-3">
                    {item.errors.map((err) => (
                      <div
                        key={`${err.errorType}-${err.billedAmount}`}
                        className="bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${ERROR_TYPE_COLORS[err.errorType]}`}
                          >
                            {ERROR_TYPE_LABELS[err.errorType]}
                          </Badge>
                          <span className="font-mono text-xs font-bold text-destructive shrink-0">
                            +{formatINR(err.difference)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {err.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-destructive/10 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground mb-0.5">
                              Billed
                            </p>
                            <p className="font-mono text-xs font-bold text-destructive">
                              {formatINR(err.billedAmount)}
                            </p>
                          </div>
                          <div className="bg-success/10 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground mb-0.5">
                              Contracted
                            </p>
                            <p className="font-mono text-xs font-bold text-success">
                              {formatINR(err.contractedAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
