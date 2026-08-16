/**
 * INZIRA Business Health & SME Credit Score Engine (Phase 1: Transparent Formula)
 * 
 * Score inputs (7 Weighted Pillars, 0–100 Scale):
 * 1. Sales Consistency (20%): Regularity of daily till activity over last 30/60/90 days
 * 2. Revenue Trend (15%): Month-over-month (MoM) revenue growth & stability
 * 3. Expense-to-Revenue Ratio (15%): Operating burn rate vs gross receipts
 * 4. Receivables Health (15%): Customer debt aging & overdue credit recovery rate
 * 5. Payables Health (15%): Supplier payment obligations & PO settlement on-time rate
 * 6. Stock Turnover Velocity (10%): Inventory movement speed vs stale/dead inventory
 * 7. Account Tenure (10%): Continuity and duration of record-keeping on INZIRA
 * 
 * Score Bands:
 * - 71–100: Strong / Prime (Grade A)
 * - 41–70:  Moderate / Standard (Grade B)
 * - 0–40:   High Risk / Watchlist (Grade C)
 */

export const SCORE_PILLARS = [
  { id: "sales_consistency", name: "Sales Consistency", weight: 0.20, maxPoints: 20 },
  { id: "revenue_trend", name: "Revenue Trend (MoM)", weight: 0.15, maxPoints: 15 },
  { id: "expense_ratio", name: "Expense-to-Revenue", weight: 0.15, maxPoints: 15 },
  { id: "receivables_health", name: "Receivables Health", weight: 0.15, maxPoints: 15 },
  { id: "payables_health", name: "Payables Health", weight: 0.15, maxPoints: 15 },
  { id: "stock_turnover", name: "Stock Turnover Velocity", weight: 0.10, maxPoints: 10 },
  { id: "account_tenure", name: "Platform Tenure", weight: 0.10, maxPoints: 10 },
];

export function getScoreBand(score) {
  if (score === null || score === undefined || isNaN(score)) return { code: "C", name: "Unscored", color: "#94A3B8" };
  if (score >= 71) return { code: "A", name: "Strong", desc: "Prime credit candidate & instant pre-approval", color: "#FF6B00" };
  if (score >= 41) return { code: "B", name: "Moderate", desc: "Standard credit candidate with inventory backing", color: "#FF6B00" };
  return { code: "C", name: "High Risk", desc: "Requires business credit advisory before lending", color: "#94A3B8" };
}

export function bandColor(band, score) {
  return "#FF6B00";
}

export function bandKey(band, score) {
  const s = Number(score) || 0;
  if (s >= 71) return "band_green";
  if (s >= 41) return "band_amber";
  return "band_red";
}

export function parseMaybeJSON(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Computes the 7-pillar transparent Business Health Score from raw SME store data
 */
export function computeHealthScoreFromData({
  sales = [],
  expenses = [],
  stock = [],
  receivables = [],
  payables = [],
  orders = [],
  user = null,
}) {
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;

  // ─── 1. RAW METRIC EXTRACTION ───
  // Total Revenue & Sales Windowing
  const sales30d = [];
  const salesPrev30d = [];
  const salesDaysSet30d = new Set();
  const salesDaysSet60d = new Set();
  const salesDaysSet90d = new Set();

  let totalLifetimeSales = 0;
  let totalRevenue30d = 0;
  let totalRevenuePrev30d = 0;
  let cogs30d = 0;

  sales.forEach((s) => {
    const amt = Number(s.total_amount) || 0;
    totalLifetimeSales += amt;
    const dateStr = s.created_at || s.date;
    const saleDate = dateStr ? new Date(dateStr) : now;
    const diffDays = Math.max(0, Math.floor((now - saleDate) / msDay));
    const dayKey = saleDate.toISOString().split("T")[0];

    if (diffDays <= 30) {
      sales30d.push(s);
      totalRevenue30d += amt;
      salesDaysSet30d.add(dayKey);
      // Compute wholesale COGS for 30d
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const cost = Number(item.unit_cost_rwf || item.cost_price_rwf || item.unit_price * 0.7) || 0;
          cogs30d += qty * cost;
        });
      }
    } else if (diffDays > 30 && diffDays <= 60) {
      salesPrev30d.push(s);
      totalRevenuePrev30d += amt;
    }

    if (diffDays <= 60) salesDaysSet60d.add(dayKey);
    if (diffDays <= 90) salesDaysSet90d.add(dayKey);
  });

  // If items didn't have explicit cost, default COGS to 70% of 30d revenue
  if (cogs30d === 0 && totalRevenue30d > 0) {
    cogs30d = totalRevenue30d * 0.70;
  }

  // Operating Expenses Windowing (30d)
  let totalExpenses30d = 0;
  let totalLifetimeExpenses = 0;

  expenses.forEach((e) => {
    const amt = Number(e.amount_rwf || e.amount) || 0;
    totalLifetimeExpenses += amt;
    const dateStr = e.created_at || e.date;
    const expDate = dateStr ? new Date(dateStr) : now;
    const diffDays = Math.max(0, Math.floor((now - expDate) / msDay));
    if (diffDays <= 30) {
      totalExpenses30d += amt;
    }
  });

  // Stock Inventory Valuation
  let totalInventoryValuation = 0;
  let totalStockItemsCount = stock.length;
  let lowStockItemsCount = 0;

  stock.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unit_cost_rwf || item.cost_price_rwf || 1000);
    const threshold = Number(item.low_stock_threshold) || 5;
    totalInventoryValuation += qty * cost;
    if (qty <= threshold) lowStockItemsCount++;
  });

  // Receivables (Customer Credit Book)
  let totalReceivablesAmount = 0;
  let overdueReceivablesAmount = 0;
  receivables.forEach((r) => {
    const bal = Number(r.balance || r.amount || r.total_amount) || 0;
    totalReceivablesAmount += bal;
    const dueStr = r.due_date || r.created_at;
    if (dueStr && new Date(dueStr) < now) {
      overdueReceivablesAmount += bal;
    }
  });

  // Payables (Supplier Credit & Purchase Orders)
  let totalPayablesAmount = 0;
  let overduePayablesAmount = 0;
  const combinedPayables = [...payables, ...orders.filter((o) => o.status !== "stocked" && o.status !== "cancelled")];
  combinedPayables.forEach((p) => {
    const bal = Number(p.balance || p.total_amount || p.amount) || 0;
    totalPayablesAmount += bal;
    const dueStr = p.due_date || p.expected_date;
    if (dueStr && new Date(dueStr) < now) {
      overduePayablesAmount += bal;
    }
  });

  // Account Tenure (Days on INZIRA)
  let tenureDays = 30;
  if (user?.createdAt || user?.created_at) {
    const created = new Date(user.createdAt || user.created_at);
    if (!isNaN(created.getTime())) {
      tenureDays = Math.max(1, Math.floor((now.getTime() - created.getTime()) / msDay));
    }
  } else if (sales.length > 0) {
    tenureDays = Math.max(7, sales.length * 2);
  }
  if (isNaN(tenureDays) || tenureDays < 1) tenureDays = 30;

  // ─── 2. SEVEN PILLAR MATHEMATICAL SCORING ───

  // Pillar 1: Sales Consistency (20%)
  const activeDays30d = salesDaysSet30d.size;
  let p1RawScore = Math.min(100, Math.round((activeDays30d / 30) * 100 + (sales.length >= 10 ? 15 : sales.length * 1.5)));
  if (sales.length === 0) p1RawScore = 0;
  const p1Points = (p1RawScore * 0.20);

  // Pillar 2: Revenue Trend MoM (15%)
  let momGrowthRate = 0;
  let p2RawScore = 75; // baseline for initial month
  if (totalRevenuePrev30d > 0) {
    momGrowthRate = ((totalRevenue30d - totalRevenuePrev30d) / totalRevenuePrev30d);
    if (momGrowthRate >= 0.15) p2RawScore = 100;
    else if (momGrowthRate >= 0.05) p2RawScore = 90;
    else if (momGrowthRate >= -0.05) p2RawScore = 80;
    else if (momGrowthRate >= -0.20) p2RawScore = 65;
    else p2RawScore = 45;
  } else if (totalRevenue30d > 0) {
    p2RawScore = 85;
  } else {
    p2RawScore = 20;
  }
  const p2Points = (p2RawScore * 0.15);

  // Pillar 3: Expense-to-Revenue Ratio (15%)
  const expenseRatio = totalRevenue30d > 0 ? (totalExpenses30d / totalRevenue30d) : (totalExpenses30d > 0 ? 1.5 : 0.4);
  let p3RawScore = 70;
  if (totalRevenue30d === 0 && totalExpenses30d === 0) p3RawScore = 50;
  else if (expenseRatio <= 0.30) p3RawScore = 100;
  else if (expenseRatio <= 0.50) p3RawScore = 90;
  else if (expenseRatio <= 0.70) p3RawScore = 75;
  else if (expenseRatio <= 0.90) p3RawScore = 55;
  else p3RawScore = 30;
  const p3Points = (p3RawScore * 0.15);

  // Pillar 4: Receivables Health (15%)
  let p4RawScore = 95;
  const overdueRecRatio = totalReceivablesAmount > 0 ? (overdueReceivablesAmount / totalReceivablesAmount) : 0;
  if (totalReceivablesAmount === 0) {
    p4RawScore = 95; // clean balance sheet
  } else if (overdueRecRatio <= 0.05) {
    p4RawScore = 90;
  } else if (overdueRecRatio <= 0.20) {
    p4RawScore = 75;
  } else if (overdueRecRatio <= 0.40) {
    p4RawScore = 55;
  } else {
    p4RawScore = 35;
  }
  const p4Points = (p4RawScore * 0.15);

  // Pillar 5: Payables Health (15%)
  let p5RawScore = 95;
  const overduePayRatio = totalPayablesAmount > 0 ? (overduePayablesAmount / totalPayablesAmount) : 0;
  if (totalPayablesAmount === 0) {
    p5RawScore = 95;
  } else if (overduePayRatio === 0) {
    p5RawScore = 90;
  } else if (overduePayRatio <= 0.15) {
    p5RawScore = 75;
  } else {
    p5RawScore = 40;
  }
  const p5Points = (p5RawScore * 0.15);

  // Pillar 6: Stock Turnover Velocity (10%)
  const turnoverRatio = totalInventoryValuation > 0 ? (cogs30d / totalInventoryValuation) : 0.5;
  let p6RawScore = 70;
  if (turnoverRatio >= 0.50) p6RawScore = 100;
  else if (turnoverRatio >= 0.30) p6RawScore = 85;
  else if (turnoverRatio >= 0.15) p6RawScore = 70;
  else p6RawScore = 45;
  if (lowStockItemsCount > 0) p6RawScore = Math.max(30, p6RawScore - (lowStockItemsCount * 5));
  const p6Points = (p6RawScore * 0.10);

  // Pillar 7: Platform Tenure (10%)
  let p7RawScore = 50;
  if (tenureDays >= 90) p7RawScore = 100;
  else if (tenureDays >= 60) p7RawScore = 85;
  else if (tenureDays >= 30) p7RawScore = 70;
  else if (tenureDays >= 14) p7RawScore = 55;
  else p7RawScore = 40;
  const p7Points = (p7RawScore * 0.10);

  // Sum total weighted score (0–100)
  const rawSum = p1Points + p2Points + p3Points + p4Points + p5Points + p6Points + p7Points;
  const finalScore = Math.min(99, Math.max(sales.length > 0 ? 30 : 0, Math.round(rawSum)));
  const band = getScoreBand(finalScore);

  // ─── 3. TRANSPARENT PILLARS OBJECT ───
  const pillars = [
    {
      id: "sales_consistency",
      name: "Sales Consistency",
      weightPercent: 20,
      rawScore: p1RawScore,
      weightedScore: Number(p1Points.toFixed(1)),
      metricText: `${activeDays30d}/30 active till days`,
      status: p1RawScore >= 75 ? "Optimal" : p1RawScore >= 50 ? "Moderate" : "Needs Regularity",
      explanation: "Measures continuous daily sales recording frequency over 30 days.",
    },
    {
      id: "revenue_trend",
      name: "Revenue Trend (MoM)",
      weightPercent: 15,
      rawScore: p2RawScore,
      weightedScore: Number(p2Points.toFixed(1)),
      metricText: momGrowthRate !== 0 ? `${(momGrowthRate * 100).toFixed(1)}% MoM` : "Stable baseline",
      status: p2RawScore >= 75 ? "Growing/Stable" : "Declining",
      explanation: "Tracks month-over-month revenue growth trajectory.",
    },
    {
      id: "expense_ratio",
      name: "Expense-to-Revenue",
      weightPercent: 15,
      rawScore: p3RawScore,
      weightedScore: Number(p3Points.toFixed(1)),
      metricText: `${(expenseRatio * 100).toFixed(0)}% burn rate`,
      status: p3RawScore >= 75 ? "Healthy Margin" : "High Burn",
      explanation: "Evaluates operating cost efficiency relative to gross receipts.",
    },
    {
      id: "receivables_health",
      name: "Receivables Health",
      weightPercent: 15,
      rawScore: p4RawScore,
      weightedScore: Number(p4Points.toFixed(1)),
      metricText: `${(overdueRecRatio * 100).toFixed(0)}% overdue debt`,
      status: p4RawScore >= 75 ? "Low Risk" : "Overdue Debt Exposure",
      explanation: "Monitors customer credit aging and unpaid customer invoices.",
    },
    {
      id: "payables_health",
      name: "Payables Health",
      weightPercent: 15,
      rawScore: p5RawScore,
      weightedScore: Number(p5Points.toFixed(1)),
      metricText: `${(overduePayRatio * 100).toFixed(0)}% overdue bills`,
      status: p5RawScore >= 75 ? "On-Time Supplier Settle" : "Supplier Arrears",
      explanation: "Tracks supplier purchase order payment timeliness.",
    },
    {
      id: "stock_turnover",
      name: "Stock Velocity",
      weightPercent: 10,
      rawScore: p6RawScore,
      weightedScore: Number(p6Points.toFixed(1)),
      metricText: `${(turnoverRatio).toFixed(1)}x monthly velocity`,
      status: p6RawScore >= 75 ? "Fast Moving" : "Stale Stock",
      explanation: "Measures wholesale inventory movement vs stagnant stock.",
    },
    {
      id: "account_tenure",
      name: "Platform Tenure",
      weightPercent: 10,
      rawScore: p7RawScore,
      weightedScore: Number(p7Points.toFixed(1)),
      metricText: `${tenureDays} days verified history`,
      status: p7RawScore >= 70 ? "Established" : "New Merchant",
      explanation: "Rewards consistent record-keeping duration on INZIRA.",
    },
  ];

  // ─── 4. ML FEATURE VECTOR EXTRACTION ───
  const rawFeatureVector = {
    sales_days_last_30d: activeDays30d,
    sales_days_last_60d: salesDaysSet60d.size,
    sales_days_last_90d: salesDaysSet90d.size,
    total_sales_count_30d: sales30d.length,
    revenue_30d: totalRevenue30d,
    revenue_prev_30d: totalRevenuePrev30d,
    revenue_growth_rate_mom: Number(momGrowthRate.toFixed(4)),
    expenses_30d: totalExpenses30d,
    expense_to_revenue_ratio: Number(expenseRatio.toFixed(4)),
    total_receivables: totalReceivablesAmount,
    overdue_receivables: overdueReceivablesAmount,
    overdue_receivables_ratio: Number(overdueRecRatio.toFixed(4)),
    total_payables: totalPayablesAmount,
    overdue_payables: overduePayablesAmount,
    overdue_payables_ratio: Number(overduePayRatio.toFixed(4)),
    inventory_valuation: totalInventoryValuation,
    cogs_30d: cogs30d,
    stock_turnover_velocity: Number(turnoverRatio.toFixed(4)),
    low_stock_items_count: lowStockItemsCount,
    account_tenure_days: tenureDays,
    total_lifetime_transactions: sales.length,
    total_lifetime_revenue: totalLifetimeSales,
  };

  const positiveFactors = pillars.filter((p) => p.rawScore >= 75);
  const negativeFactors = pillars.filter((p) => p.rawScore < 60);

  const recommendations = [];
  if (p1RawScore < 70) recommendations.push("Log transactions daily to establish an unbroken sales streak for micro-credit.");
  if (p3RawScore < 70) recommendations.push("Review high operating expenses to increase net operating cashflow.");
  if (p4RawScore < 70) recommendations.push("Follow up on overdue customer receivables to boost liquidity.");
  if (p6RawScore < 70) recommendations.push("Restock depleted inventory lines and clear slow-moving stock.");

  return {
    score: sales.length === 0 ? null : finalScore,
    band: band.code,
    bandDetails: band,
    formula: "Score = (Consistency*20%) + (Trend*15%) + (ExpenseRatio*15%) + (Receivables*15%) + (Payables*15%) + (StockVelocity*10%) + (Tenure*10%)",
    pillars,
    rawFeatureVector,
    factors: {
      positive: positiveFactors.map((p) => ({ label_en: `${p.name}: ${p.metricText} (${p.status})` })),
      negative: negativeFactors.map((p) => ({ label_en: `${p.name}: ${p.metricText} (${p.status})` })),
    },
    recommendations,
  };
}
