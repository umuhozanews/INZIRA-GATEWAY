import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Globe,
  LogOut,
  Activity,
  RefreshCw,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  Layers
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { computeHealthScoreFromData, getScoreBand } from "../lib/score";
import { logSmeScoreSnapshot } from "../lib/mlFeatureStore";
import ScreenHeader from "../components/ScreenHeader";
import HealthGauge from "../components/HealthGauge";
import Loading from "../components/Loading";
import { Button } from "../components/ui";
import { useData } from "../context/DataContext";

export default function HealthScore() {
  const { user } = useAuth();
  const { t, lang, toggle } = useLang();
  const { sales, expenses, stock, customers, suppliers, orders } = useData();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Compute live 7-pillar transparent score
  const scoreResult = useMemo(() => {
    return computeHealthScoreFromData({
      sales,
      expenses,
      stock,
      receivables: customers || [],
      payables: suppliers || [],
      orders: orders || [],
      user,
    });
  }, [sales, expenses, stock, customers, suppliers, orders, user]);

  // Log ML snapshot in feature store on calculation
  useEffect(() => {
    if (scoreResult && scoreResult.score !== null) {
      logSmeScoreSnapshot({
        sme: user,
        scoreResult,
        contextUser: user,
      });
    }
  }, [scoreResult, user]);

  const handleRecalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      logSmeScoreSnapshot({
        sme: user,
        scoreResult,
        contextUser: user,
      });
      toast.success(`Business Health Score updated: ${scoreResult.score}/100 (${scoreResult.bandDetails?.name})`);
    }, 400);
  };

  const score = scoreResult.score;
  const band = scoreResult.bandDetails;
  const pillars = scoreResult.pillars || [];
  const recs = scoreResult.recommendations || [];

  return (
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <ScreenHeader
        title={t("health_title") || "Business Health Score"}
        back
        right={
          <button
            onClick={toggle}
            className="flex items-center gap-1 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-heading font-extrabold text-ink hover:bg-card-hover transition shadow-sm cursor-pointer"
          >
            <Globe size={13} className="text-primary" /> {lang.toUpperCase()}
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Gauge Hero Card */}
        <div className="rounded-3xl border border-line bg-card p-6 md:p-8 shadow-card flex flex-col items-center text-center font-heading">
          <HealthGauge
            score={score}
            size={150}
            label={band?.name ? `${band.name} · Grade ${band.code}` : undefined}
          />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              Grade {band?.code || "B"} · {band?.name || "Moderate"}
            </span>
          </div>
          <p className="mt-3 max-w-md text-xs md:text-sm font-medium text-muted font-body">
            {band?.desc || "Transparent formula-based scoring for Rwandan micro & small retail businesses."}
          </p>
        </div>

        {/* Transparent Mathematical Formula Breakdown Box */}
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card font-heading space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <h2 className="text-xs font-black text-ink uppercase tracking-wider">
                Transparent 7-Pillar Formula (0–100 Scale)
              </h2>
            </div>
            <span className="text-[10px] text-muted font-mono">Phase 1 Formula</span>
          </div>

          <p className="text-[11.5px] text-muted font-body leading-relaxed">
            Your credit score is fully explainable and calculated mathematically from your live store till activity:
          </p>

          <div className="p-3 rounded-xl bg-card-hover border border-line font-mono text-[11px] text-ink overflow-x-auto">
            <code>
              Score = (Consistency &times; 20%) + (MoM Trend &times; 15%) + (Expense Ratio &times; 15%) + (Receivables &times; 15%) + (Payables &times; 15%) + (Stock Velocity &times; 10%) + (Tenure &times; 10%)
            </code>
          </div>
        </div>

        {/* 7 Pillars Detailed Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-heading font-black text-muted uppercase tracking-wider px-1">
            7 Underwriting Pillars Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-heading">
            {pillars.map((p) => {
              const isHigh = p.rawScore >= 75;
              const isModerate = p.rawScore >= 50 && p.rawScore < 75;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-line bg-card shadow-card space-y-2 hover:border-primary/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-ink">{p.name}</h4>
                        <span className="text-[10px] text-primary font-bold">({p.weightPercent}%)</span>
                      </div>
                      <span className="text-[11px] text-muted font-body block mt-0.5">
                        {p.metricText}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-ink tabnum block">{p.rawScore}/100</span>
                      <span className="text-[10px] text-primary font-bold tabnum">+{p.weightedScore} pts</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between text-[10.5px]">
                    <span className="text-muted font-body truncate">{p.explanation}</span>
                    <span className={`px-2 py-0.5 rounded font-black shrink-0 ${
                      isHigh
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : isModerate
                        ? "bg-card-hover text-ink border border-line"
                        : "bg-card-hover text-muted border border-line"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="p-5 rounded-2xl border border-line bg-card shadow-card space-y-3 font-body">
            <h3 className="font-heading text-xs font-black text-muted uppercase tracking-wider">
              Recommendations to Boost Score
            </h3>
            <div className="space-y-2">
              {recs.map((r, i) => (
                <div key={i} className="flex gap-2.5 items-start text-xs text-ink font-medium">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto font-heading pt-2">
          <Button
            full
            variant="primary"
            className="py-3.5 font-black shadow-orange-sm cursor-pointer"
            onClick={() => {
              toast.success("Opening SACCO Institutional Underwriting Portal...");
              navigate(`/institution/assessment/${user?.id || "sme_current_user"}`);
            }}
          >
            <Building2 size={16} />
            <span>Share with Financial Institutions</span>
          </Button>

          <Button
            full
            variant="paper"
            className="py-3.5 font-bold cursor-pointer"
            disabled={calculating}
            onClick={handleRecalculate}
          >
            <RefreshCw size={16} className={calculating ? "animate-spin" : ""} />
            <span>{calculating ? "Recalculating…" : "Recalculate Score"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
