"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Users, ShoppingCart, DollarSign, Zap, Loader2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";

type Prediction = Awaited<ReturnType<typeof api.predictCampaign>>;

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 45 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div className={`h-1.5 rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
      <span className={`text-xs font-semibold ${value >= 70 ? "text-emerald-600" : value >= 45 ? "text-amber-600" : "text-red-500"}`}>
        {value}%
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, delay }: {
  icon: React.ElementType; label: string; value: string; sub?: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col rounded-2xl border bg-card p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</p>}
    </motion.div>
  );
}

export function CampaignPredictor({ campaignId, accessToken }: { campaignId: string; accessToken: string }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTips, setShowTips] = useState(false);

  async function run() {
    setLoading(true); setError("");
    try {
      const res = await api.predictCampaign(accessToken, campaignId);
      setPrediction(res);
    } catch (e: any) {
      setError(e.message ?? "Prediction failed");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Performance Predictor</p>
            <p className="text-xs text-muted-foreground">Forecast reach, engagement & ROI before launch</p>
          </div>
        </div>
        {!prediction && (
          <button onClick={run} disabled={loading}
            className="flex items-center gap-2 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all">
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</> : <><Zap className="h-3.5 w-3.5" /> Predict</>}
          </button>
        )}
        {prediction && (
          <button onClick={run} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            Refresh
          </button>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {!prediction && !loading && !error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <TrendingUp className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium">Run the AI predictor</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              We'll forecast expected reach, engagement, conversions and ROI using historical campaign data and market benchmarks for UAE/MENA.
            </p>
          </div>
        )}

        {loading && !prediction && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="grid grid-cols-2 gap-3 w-full sm:grid-cols-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          </div>
        )}

        <AnimatePresence>
          {prediction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Confidence */}
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prediction confidence</span>
                  <span className="text-xs text-muted-foreground">
                    {prediction.historicalSampleSize > 0
                      ? `Based on ${prediction.historicalSampleSize} similar campaigns`
                      : "Based on market benchmarks"}
                    {prediction.aiGenerated && " · GPT-4o-mini enhanced"}
                  </span>
                </div>
                <ConfidenceBar value={prediction.confidence} />
              </div>

              {/* Stat cards */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={Users}        label="Est. Reach"       value={fmt(prediction.estimatedReach)}       delay={0} />
                <StatCard icon={TrendingUp}   label="Est. Engagement"  value={fmt(prediction.estimatedEngagement)}  delay={0.06} />
                <StatCard icon={ShoppingCart} label="Est. Conversions" value={fmt(prediction.estimatedConversions)} delay={0.12} />
                <StatCard icon={DollarSign}   label="Est. ROI"
                  value={`${prediction.estimatedROI > 0 ? "+" : ""}${prediction.estimatedROI}%`}
                  sub={prediction.estimatedCPE > 0 ? `$${prediction.estimatedCPE.toFixed(2)} CPE` : undefined}
                  delay={0.18} />
              </div>

              {/* Creator pool */}
              <div className="mb-5 flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-3">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">{prediction.matchingCreators}</span>
                  <span className="text-muted-foreground"> creators on platform match your target categories</span>
                </p>
              </div>

              {/* Narrative */}
              {prediction.narrative && (
                <div className="mb-4 rounded-2xl border bg-muted/20 px-5 py-4">
                  <p className="text-sm leading-relaxed text-foreground/80">{prediction.narrative}</p>
                </div>
              )}

              {/* Tips */}
              {prediction.tips && prediction.tips.length > 0 && (
                <div>
                  <button onClick={() => setShowTips(v => !v)}
                    className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" /> Optimization tips
                    </span>
                    {showTips ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showTips && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="mt-2 space-y-2">
                          {prediction.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold">{i + 1}</span>
                              {tip}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
