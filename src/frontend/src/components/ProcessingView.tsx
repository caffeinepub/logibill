import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ProcessingViewProps {
  stage: number; // 0 = not started, 1 = extracting, 2 = checking, 3 = preparing
  itemCount?: number;
}

const STAGES = [
  {
    id: 1,
    title: "Extracting Data",
    desc: "Reading invoice CSV — pulling AWB numbers, weights, zones, charges",
  },
  {
    id: 2,
    title: "Cross-Checking Rates",
    desc: "Verifying each line item against contracted rates — weight, zones, COD, RTO, surcharges",
  },
  {
    id: 3,
    title: "Preparing Payout Report",
    desc: "Generating discrepancy summary and verified payout file",
  },
];

export default function ProcessingView({
  stage,
  itemCount,
}: ProcessingViewProps) {
  return (
    <div
      data-ocid="processing.loading_state"
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-mono text-primary uppercase tracking-wide">
              Audit in Progress
            </span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground mb-2">
            Analyzing{" "}
            {itemCount ? (
              <span className="text-primary mono">{itemCount} items</span>
            ) : (
              "your invoice"
            )}
          </h2>
          <p className="text-muted-foreground text-sm">
            This typically takes a few seconds
          </p>
        </motion.div>

        {/* Stages */}
        <div className="space-y-4">
          {STAGES.map((s, idx) => {
            const isComplete = stage > s.id;
            const isActive = stage === s.id;
            const isPending = stage < s.id;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`
                  relative rounded-xl border p-5 transition-all duration-300
                  ${isComplete ? "border-success/40 bg-success/5" : ""}
                  ${isActive ? "border-primary/60 bg-primary/5 shadow-amber" : ""}
                  ${isPending ? "border-border bg-card opacity-50" : ""}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {isComplete ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`font-semibold text-sm ${isActive ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        Stage {s.id} — {s.title}
                      </span>
                      {isActive && itemCount && (
                        <AnimatePresence>
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                          >
                            {itemCount} items
                          </motion.span>
                        </AnimatePresence>
                      )}
                      {isComplete && (
                        <span className="text-xs font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>

                    {/* Active progress bar */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 h-1 bg-secondary rounded-full overflow-hidden"
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "90%" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-2 mt-10"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
