import { useEffect, useState, useCallback, useMemo } from "react";
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
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n.jsx";
import { bandKey, parseMaybeJSON, computeHealthScoreFromData } from "../lib/score";
import ScreenHeader from "../components/ScreenHeader";
import HealthGauge from "../components/HealthGauge";
import Loading from "../components/Loading";
import { Button } from "../components/ui";
import { useData } from "../context/DataContext";

function FactorRow({ label, positive }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-card p-4 shadow-card font-body">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            positive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </div>
        <span className="text-xs md:text-sm font-semibold text-ink">{label}</span>
      </div>
      <span className={`text-xs font-black font-heading ${positive ? "text-emerald-400" : "text-rose-400"}`}>
        {positive ? "▲" : "▼"}
      </span>
    </div>
  );
}

export default function HealthScore() {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useLang();
  const { sales, expenses, stock } = useData();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(0);
  const [calculating, setCalculating] = useState(false);

  const businessId = user?.id;

  const normalise = useCallback((raw) => {
    if (!raw) return null;
    return {
      score: raw.score,
      band: raw.band,
      factors: parseMaybeJSON(raw.factors),
      recommendations: parseMaybeJSON(raw.recommendations),
    };
  }, []);

  const fallbackScore = useMemo(() => {
    return computeHealthScoreFromData({ sales, expenses, stock });
  }, [sales, expenses, stock]);

  const load = useCallback(async () => {
    try {
      if (businessId) {
        const [latestRes, histRes] = await Promise.allSettled([
          api.get(`/v2/score/${businessId}/latest`),
          api.get(`/v2/score/${businessId}/history`, { params: { limit: 12 } }),
        ]);
        if (latestRes.status === "fulfilled" && latestRes.value.data?.score != null) {
          setData(normalise(latestRes.value.data));
        } else {
          setData(fallbackScore);
        }
        if (histRes.status === "fulfilled") setTrend(histRes.value.data?.trend || 0);
      } else {
        setData(fallbackScore);
      }
    } catch {
      setData(fallbackScore);
    } finally {
      setLoading(false);
    }
  }, [businessId, normalise, fallbackScore]);

  useEffect(() => {
    load();
  }, [load]);

  async function calculate() {
    setCalculating(true);
    try {
      const { data: res } = await api.post("/v2/score/calculate", {});
      if (res && res.score != null) {
        setData({
          score: res.score,
          band: res.band,
          factors: res.factors,
          recommendations: res.recommendations,
        });
        toast.success(`${t("health_score")}: ${res.score}`);
      } else {
        setData(fallbackScore);
        toast.success(`${t("health_score")}: ${fallbackScore.score}`);
      }
    } catch {
      setData(fallbackScore);
      toast.success(`Calculated Business Health Score: ${fallbackScore.score}`);
    } finally {
      setCalculating(false);
    }
  }

  if (loading) return <Loading label={t("loading")} />;

  const score = data?.score ?? null;
  const band = data?.band ?? null;
  const positives = data?.factors?.positive || [];
  const negatives = data?.factors?.negative || [];
  const recs = data?.recommendations || [];
  const labelFor = (f) => (lang === "rw" ? f.label_rw || f.label_en : f.label_en);

  return (
    <div className="min-h-screen bg-paper font-body text-ink pb-24">
      <ScreenHeader
        title={t("health_title")}
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
        <div className="rounded-2xl border border-line bg-card p-6 md:p-8 shadow-card flex flex-col items-center text-center font-heading">
          <HealthGauge score={score} size={150} label={score != null ? t(bandKey(band, score)) : undefined} />
          <p className="mt-4 max-w-md text-xs md:text-sm font-bold text-muted font-body">
            {score != null ? t("better_than") : t("no_score")}
          </p>
          {score != null && trend !== 0 && (
            <span
              className={`mt-2 text-xs font-heading font-black ${trend > 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {trend > 0 ? "+" : ""}
              {trend} pts {t("vs_last_month")}
            </span>
          )}
        </div>

        {score == null ? (
          <div className="max-w-md mx-auto">
            <Button full variant="primary" disabled={calculating} onClick={calculate} className="py-3.5 font-heading font-black shadow-orange-sm">
              <Activity size={18} /> {calculating ? "…" : t("calculate")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid for Factors and Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Factors Column */}
              {(positives.length > 0 || negatives.length > 0) && (
                <div className="space-y-3">
                  <h2 className="font-heading text-xs font-black text-muted uppercase tracking-wider">
                    {t("top_factors")}
                  </h2>
                  <div className="space-y-2.5">
                    {positives.slice(0, 3).map((f, i) => (
                      <FactorRow key={`p${i}`} label={labelFor(f)} positive />
                    ))}
                    {negatives.slice(0, 2).map((f, i) => (
                      <FactorRow key={`n${i}`} label={labelFor(f)} positive={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Column */}
              {recs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-heading text-xs font-black text-muted uppercase tracking-wider">
                    {t("recommendations")}
                  </h2>
                  <div className="space-y-2.5">
                    {recs.map((r, i) => (
                      <div key={i} className="flex gap-3 rounded-xl border border-line bg-card p-4 shadow-card font-body">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                        <span className="text-xs md:text-sm leading-relaxed font-semibold text-ink">
                          {lang === "rw" ? r.rw || r.en : r.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lender Note Card */}
            <div className="flex gap-3.5 rounded-2xl bg-card-hover border border-line p-5 shadow-card font-body">
              <Info size={20} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-xs md:text-sm font-medium leading-relaxed text-muted">
                {t("lender_note")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto font-heading">
              <Button
                full
                variant="primary"
                className="py-3.5 font-black shadow-orange-sm"
                onClick={() =>
                  toast.success(lang === "rw" ? "Ubu buryo buraza vuba" : "Sharing coming soon")
                }
              >
                <CheckCircle2 size={16} /> {t("share_sacco")}
              </Button>
              <Button full variant="paper" className="py-3.5 font-bold" disabled={calculating} onClick={calculate}>
                <RefreshCw size={16} className={calculating ? "animate-spin" : ""} /> {calculating ? "…" : t("recalculate")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
