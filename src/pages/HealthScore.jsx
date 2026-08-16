import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Globe,
  Building2,
  RefreshCw,
  Info
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { computeHealthScoreFromData, getScoreBand } from "../lib/score";
import { logSmeScoreSnapshot } from "../lib/mlFeatureStore";
import ScreenHeader from "../components/ScreenHeader";
import HealthGauge from "../components/HealthGauge";
import Loading from "../components/Loading";
import { Button } from "../components/ui";
import { useData } from "../context/DataContext";

function FactorRow({ label, positive }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-3.5 shadow-card font-body transition ${
      positive ? "border-line bg-card" : "border-line bg-card"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition ${
          positive ? "bg-primary text-white shadow-orange-sm" : "bg-card-hover text-muted border border-line"
        }`}>
          {positive ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2} />}
        </div>
        <span className={`text-xs sm:text-sm leading-tight ${
          positive ? "font-bold text-ink" : "font-medium text-muted"
        }`}>
          {label}
        </span>
      </div>
      <span className={`text-xs font-black font-heading shrink-0 ml-2 ${
        positive ? "text-primary" : "text-muted"
      }`}>
        {positive ? "Strength" : "Watch"}
      </span>
    </div>
  );
}

export default function HealthScore() {
  const { user } = useAuth();
  const { t, lang, toggle } = useLang();
  const { sales, expenses, stock, customers, suppliers, orders } = useData();
  const navigate = useNavigate();

  const [calculating, setCalculating] = useState(false);

  // Compute live 7-pillar score
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

  // Log ML snapshot in feature store in background
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
      toast.success(`Score updated: ${scoreResult.score}/100`);
    }, 400);
  };

  const score = scoreResult.score;
  const band = scoreResult.bandDetails;
  const positives = scoreResult.factors?.positive || [];
  const negatives = scoreResult.factors?.negative || [];
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

      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
        {/* Gauge Hero Card */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-card flex flex-col items-center text-center font-heading">
          <HealthGauge
            score={score}
            size={140}
            label={band?.name ? `${band.name} · Grade ${band.code}` : undefined}
          />
          <div className="mt-3">
            <span className={`text-xs font-black px-3.5 py-1 rounded-xl ${
              band?.code === "A"
                ? "bg-primary text-white shadow-orange-sm"
                : band?.code === "B"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-card-hover text-muted border border-line"
            }`}>
              Grade {band?.code || "B"} &bull; {band?.name || "Moderate"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted font-medium font-body max-w-xs">
            {band?.desc || "Computed from your daily store till turnover and inventory records."}
          </p>
        </div>

        {/* Factors Breakdown */}
        {(positives.length > 0 || negatives.length > 0) && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-heading font-black text-muted uppercase tracking-wider px-1">
              Top Factors
            </h3>
            <div className="space-y-2">
              {positives.slice(0, 3).map((f, i) => (
                <FactorRow key={`p_${i}`} label={f.label_en} positive />
              ))}
              {negatives.slice(0, 2).map((f, i) => (
                <FactorRow key={`n_${i}`} label={f.label_en} positive={false} />
              ))}
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        {recs.length > 0 && (
          <div className="p-4 rounded-2xl border border-line bg-card shadow-card space-y-2.5 font-body">
            <h3 className="font-heading text-xs font-black text-muted uppercase tracking-wider">
              Recommendations
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
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1 font-heading">
          <Button
            full
            variant="primary"
            className="py-3 text-xs font-black shadow-orange-sm cursor-pointer"
            onClick={() => {
              toast.success("Opening Institutional Underwriting Portal...");
              navigate(`/institution/assessment/${user?.id || "sme_current_user"}`);
            }}
          >
            <Building2 size={15} />
            <span>Share with Financial Institutions</span>
          </Button>

          <Button
            full
            variant="paper"
            className="py-3 text-xs font-bold cursor-pointer"
            disabled={calculating}
            onClick={handleRecalculate}
          >
            <RefreshCw size={15} className={calculating ? "animate-spin" : ""} />
            <span>{calculating ? "Recalculating…" : "Recalculate"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
