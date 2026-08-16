import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  Users,
  Building2,
  Calendar,
  ArrowUpRight,
  MapPin,
  Activity,
  Layers,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit3,
  FileSpreadsheet
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { rwf, rwfCompact, formatDate } from "../../lib/format";
import {
  getAllScoreSnapshots,
  recordSnapshotOutcome,
  exportMlDatasetCsv,
  exportMlDatasetJson
} from "../../lib/mlFeatureStore";
import Sheet from "../../components/Sheet";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState([]);

  // Outcome Labeling Modal State
  const [labelingSnapshot, setLabelingSnapshot] = useState(null);
  const [outcomeStatus, setOutcomeStatus] = useState("growing");
  const [defaultEvent, setDefaultEvent] = useState(false);
  const [realizedGrowth, setRealizedGrowth] = useState("12");
  const [outcomeNotes, setOutcomeNotes] = useState("");

  const refreshSnapshots = () => {
    setSnapshots(getAllScoreSnapshots());
  };

  useEffect(() => {
    async function load() {
      try {
        let res;
        try {
          res = await api.get("/admin/analytics");
        } catch {
          res = await api.get("/v2/admin/dashboard");
        }
        setAnalytics(res.data);
      } catch (err) {
        setAnalytics({
          dailyTrends: [],
          topSmes: [],
          sectorShares: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
    refreshSnapshots();
  }, []);

  const handleSaveOutcome = (e) => {
    e.preventDefault();
    if (!labelingSnapshot) return;

    const res = recordSnapshotOutcome(labelingSnapshot.id, {
      status: outcomeStatus,
      defaultEvent,
      revenueGrowthRealized: Number(realizedGrowth) || 0,
      notes: outcomeNotes,
      labeledBy: "Platform Administrator",
    });

    if (res) {
      toast.success(`Recorded real ML ground-truth outcome for ${labelingSnapshot.shop_name}!`);
      setLabelingSnapshot(null);
      refreshSnapshots();
    } else {
      toast.error("Failed to save outcome.");
    }
  };

  const handleExportCsv = () => {
    const success = exportMlDatasetCsv();
    if (success) {
      toast.success("Downloaded sme_score_snapshots ML training CSV!");
    } else {
      toast.error("No historical score snapshots recorded yet to export.");
    }
  };

  const handleExportJson = () => {
    exportMlDatasetJson();
    toast.success("Downloaded full JSON feature store!");
  };

  return (
    <div className="p-3.5 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-body text-ink">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-heading">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest">
            PLATFORM INTELLIGENCE
          </span>
          <h1 className="text-lg md:text-2xl font-black text-ink flex items-center gap-1.5 leading-tight">
            Macro Analytics & ML Feature Store
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition cursor-pointer shadow-orange-sm active:scale-95"
          >
            <FileSpreadsheet size={15} />
            <span>Export ML CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-card hover:bg-card-hover text-ink text-xs font-bold transition cursor-pointer"
          >
            <Download size={15} className="text-primary" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* ─── ML Data Collection & Feature Store Card ─── */}
      <div className="rounded-3xl border border-line bg-card p-5 sm:p-6 shadow-card space-y-4 font-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-ink">
                SME Score Historical Snapshots (<code className="font-mono text-primary text-xs">sme_score_snapshots</code>)
              </h2>
              <p className="text-xs text-muted font-body">
                Multidimensional raw feature vectors collected for Phase 2 Machine Learning training & real outcome labeling.
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-primary px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 self-start sm:self-auto">
            {snapshots.length} Snapshots Logged
          </span>
        </div>

        {/* Snapshot Table / Card List */}
        <div className="divide-y divide-line overflow-hidden">
          {snapshots.length === 0 ? (
            <div className="py-8 text-center text-muted font-body text-xs">
              No score snapshots recorded yet. When SME merchants compute their Business Health Scores or conduct daily till sales, historical feature snapshots are logged here automatically.
            </div>
          ) : (
            snapshots.map((s) => {
              const isLabeled = s.outcome && s.outcome.status !== "pending";
              return (
                <div
                  key={s.id}
                  className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-card-hover px-2 rounded-xl transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-xs text-ink">{s.shop_name}</span>
                      <span className="text-[10px] font-mono text-muted">{s.id}</span>
                      <span className="text-[10px] font-black text-primary px-1.5 py-0.2 rounded bg-primary/10">
                        Score: {s.overall_score}/100 ({s.score_band})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted font-body mt-1">
                      <span>Recorded: {formatDate(s.timestamp)}</span>
                      <span>&bull;</span>
                      <span>30D Till Days: {s.features?.sales_days_last_30d ?? 0}/30</span>
                      <span>&bull;</span>
                      <span>Burn Rate: {((s.features?.expense_to_revenue_ratio || 0) * 100).toFixed(0)}%</span>
                      <span>&bull;</span>
                      <span>Stock Value: {rwfCompact(s.features?.inventory_valuation || 0)} RWF</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <span className="text-[10px] font-bold text-muted block uppercase">ML Target Label</span>
                      <span className={`font-black text-xs capitalize ${
                        isLabeled ? (s.outcome.default_event ? "text-muted" : "text-primary") : "text-muted"
                      }`}>
                        {s.outcome?.status || "Pending Outcome"}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setLabelingSnapshot(s);
                        setOutcomeStatus(s.outcome?.status || "growing");
                        setDefaultEvent(Boolean(s.outcome?.default_event));
                        setRealizedGrowth(String(s.outcome?.revenue_growth_realized || 10));
                        setOutcomeNotes(s.outcome?.notes || "");
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-line bg-card hover:bg-card-hover text-xs font-bold text-ink transition cursor-pointer"
                    >
                      <Edit3 size={13} className="text-primary" />
                      <span>{isLabeled ? "Update Outcome" : "Label Outcome"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Outcome Labeling Modal Sheet ─── */}
      <Sheet
        open={Boolean(labelingSnapshot)}
        onClose={() => setLabelingSnapshot(null)}
        title={labelingSnapshot ? `Record ML Ground-Truth Label: ${labelingSnapshot.shop_name}` : "ML Labeling"}
      >
        {labelingSnapshot && (
          <form onSubmit={handleSaveOutcome} className="space-y-4 pt-2 font-body pb-6 text-ink">
            <div className="p-3.5 rounded-xl bg-card-hover border border-line font-heading space-y-1">
              <span className="text-[10.5px] font-bold text-muted uppercase block">SME Snapshot Feature Summary</span>
              <h4 className="text-xs font-black text-ink">{labelingSnapshot.shop_name} &bull; Score: {labelingSnapshot.overall_score}/100</h4>
              <p className="text-[11px] text-muted font-mono pt-1">ID: {labelingSnapshot.id}</p>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Real Realized Outcome (Target Y)</label>
              <select
                value={outcomeStatus}
                onChange={(e) => setOutcomeStatus(e.target.value)}
                className="w-full bg-paper border border-line text-ink text-xs font-bold rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="growing">Revenue Grew (&gt;+10% in next quarter)</option>
                <option value="stable">Business Maintained Stable Revenue</option>
                <option value="declining">Revenue Declined (&gt;15% contraction)</option>
                <option value="supplier_default">Defaulted on Supplier Payment / Invoices</option>
                <option value="loan_default">Defaulted on Micro-Credit Loan Instalment</option>
                <option value="churned">Business Inactive / Churned</option>
              </select>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Realized Revenue Growth (% in Next Quarter)</label>
              <input
                type="number"
                step="1"
                value={realizedGrowth}
                onChange={(e) => setRealizedGrowth(e.target.value)}
                className="w-full bg-paper border border-line rounded-xl px-3.5 py-2 text-xs font-bold text-ink focus:outline-none focus:border-primary font-heading"
                placeholder="+15"
              />
            </div>

            <div className="pt-2 font-heading">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-card-hover border border-line cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaultEvent}
                  onChange={(e) => setDefaultEvent(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 bg-paper border-line"
                />
                <div>
                  <span className="font-heading font-black text-xs text-ink block">Default Event Occurred</span>
                  <span className="text-[11px] text-muted">Did this SME default on any loan or trade credit obligation?</span>
                </div>
              </label>
            </div>

            <div className="space-y-1 font-heading">
              <label className="text-xs font-bold text-muted uppercase">Outcome Notes</label>
              <textarea
                rows={2}
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="e.g. Paid all supplier orders on time and expanded stock inventory by 20%."
                className="w-full bg-paper border border-line rounded-xl p-3 text-xs font-body text-ink focus:outline-none focus:border-primary placeholder:text-muted"
              />
            </div>

            <div className="pt-2 font-heading">
              <button
                type="submit"
                className="btn-kinetic w-full py-3 text-xs font-black cursor-pointer shadow-orange-sm"
              >
                Save Real Ground-Truth Outcome Label
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
