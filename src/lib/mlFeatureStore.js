/**
 * SME Credit Score Feature Store & ML Snapshot Engine (Phase 1)
 * 
 * Manages the `sme_score_snapshots` table which records historical multidimensional
 * feature vectors along with ground-truth real outcome labels for future ML model training.
 */

export const ML_SNAPSHOTS_STORAGE_KEY = "sme_score_snapshots_v1";

/**
 * Creates and logs a full historical ML score snapshot for an SME
 */
export function logSmeScoreSnapshot({ sme, scoreResult, contextUser = null }) {
  if (!scoreResult || !scoreResult.rawFeatureVector) return null;

  const now = new Date();
  const snapshotId = `snp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  const snapshot = {
    id: snapshotId,
    timestamp: now.toISOString(),
    sme_id: sme?.id || contextUser?.id || "sme_store",
    sme_name: sme?.name || contextUser?.name || "Merchant Owner",
    shop_name: sme?.shop_name || contextUser?.shop_name || "SME Store",
    tin_number: sme?.tin_number || contextUser?.tin_number || "N/A",
    district: sme?.district || contextUser?.district || "Kigali",
    sector: sme?.sector || contextUser?.sector || "General Retail",
    
    // Output Score & Bands
    overall_score: scoreResult.score,
    score_band: scoreResult.band,
    band_name: scoreResult.bandDetails?.name || "Moderate",
    formula_version: "v1.0-7pillar",

    // 7 Pillars Breakdown
    pillars: scoreResult.pillars.map((p) => ({
      id: p.id,
      name: p.name,
      weight_percent: p.weightPercent,
      raw_score: p.rawScore,
      weighted_score: p.weightedScore,
      metric_text: p.metricText,
      status: p.status,
    })),

    // Full Raw ML Feature Vector (Features X)
    features: {
      ...scoreResult.rawFeatureVector,
    },

    // Real Outcome Labels (Ground-Truth Target Variable Y for ML Training)
    outcome: {
      status: "pending", // 'pending' | 'growing' | 'stable' | 'declining' | 'supplier_default' | 'loan_default' | 'churned'
      default_event: false, // did a default on supplier/loan payment occur?
      revenue_growth_realized: null, // realized revenue % change in next 90 days
      churn_event: false,
      notes: "",
      labeled_at: null,
      labeled_by: null,
    },
  };

  try {
    const existing = getAllScoreSnapshots();
    // Avoid duplicate logging within the same hour for the same SME
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentIdx = existing.findIndex(
      (s) => s.sme_id === snapshot.sme_id && new Date(s.timestamp).getTime() > oneHourAgo
    );

    let updated;
    if (recentIdx >= 0) {
      updated = [...existing];
      updated[recentIdx] = { ...updated[recentIdx], ...snapshot, id: updated[recentIdx].id, outcome: updated[recentIdx].outcome };
    } else {
      updated = [snapshot, ...existing].slice(0, 500); // cap at 500 recent snapshots
    }

    localStorage.setItem(ML_SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    return snapshot;
  } catch (err) {
    console.error("Failed to save score snapshot to feature store:", err);
    return null;
  }
}

/**
 * Retrieves all stored snapshots
 */
export function getAllScoreSnapshots() {
  try {
    const raw = localStorage.getItem(ML_SNAPSHOTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves historical snapshots for a specific SME
 */
export function getSmeScoreSnapshots(smeId) {
  const all = getAllScoreSnapshots();
  if (!smeId) return all;
  return all.filter((s) => s.sme_id === smeId);
}

/**
 * Records real ground-truth outcome label (e.g. loan repayment status, revenue growth, default)
 */
export function recordSnapshotOutcome(snapshotId, {
  status,
  defaultEvent = false,
  revenueGrowthRealized = null,
  churnEvent = false,
  notes = "",
  labeledBy = "Admin / Loan Officer",
}) {
  try {
    const all = getAllScoreSnapshots();
    const idx = all.findIndex((s) => s.id === snapshotId);
    if (idx < 0) return false;

    all[idx].outcome = {
      status: status || all[idx].outcome.status || "pending",
      default_event: Boolean(defaultEvent),
      revenue_growth_realized: revenueGrowthRealized !== null ? Number(revenueGrowthRealized) : null,
      churn_event: Boolean(churnEvent),
      notes: notes || "",
      labeled_at: new Date().toISOString(),
      labeled_by: labeledBy,
    };

    localStorage.setItem(ML_SNAPSHOTS_STORAGE_KEY, JSON.stringify(all));
    return all[idx];
  } catch (err) {
    console.error("Failed to update snapshot outcome:", err);
    return false;
  }
}

/**
 * Export ML Training Dataset as JSON
 */
export function exportMlDatasetJson() {
  const snapshots = getAllScoreSnapshots();
  const jsonStr = JSON.stringify(snapshots, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inzira_sme_score_snapshots_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export ML Training Dataset as Flattened CSV for Pandas / Scikit-Learn / XGBoost
 */
export function exportMlDatasetCsv() {
  const snapshots = getAllScoreSnapshots();
  if (snapshots.length === 0) return false;

  // Flatten features into tabular CSV headers
  const featureKeys = Object.keys(snapshots[0].features || {});
  const headers = [
    "snapshot_id",
    "timestamp",
    "sme_id",
    "shop_name",
    "district",
    "overall_score",
    "score_band",
    ...featureKeys,
    "target_outcome_status",
    "target_default_event",
    "target_revenue_growth_realized",
    "target_churn_event",
    "outcome_labeled_at",
  ];

  const rows = snapshots.map((s) => {
    const featValues = featureKeys.map((k) => s.features?.[k] ?? "");
    return [
      `"${s.id}"`,
      `"${s.timestamp}"`,
      `"${s.sme_id}"`,
      `"${(s.shop_name || "").replace(/"/g, '""')}"`,
      `"${s.district || "Kigali"}"`,
      s.overall_score ?? "",
      `"${s.score_band || ""}"`,
      ...featValues,
      `"${s.outcome?.status || "pending"}"`,
      s.outcome?.default_event ? 1 : 0,
      s.outcome?.revenue_growth_realized ?? "",
      s.outcome?.churn_event ? 1 : 0,
      `"${s.outcome?.labeled_at || ""}"`,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sme_score_ml_training_data_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
