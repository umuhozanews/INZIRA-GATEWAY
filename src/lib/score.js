// Shared helpers for turning a raw score/band into UI-friendly colour + label.
export function bandColor(band, score) {
  if (band === "green" || score >= 65) return "#2F8F6E";
  if (band === "amber" || score >= 40) return "#E8A33D";
  if (band === "red" || (typeof score === "number" && score < 40)) return "#C24B3D";
  return "#8A8272";
}

export function bandKey(band, score) {
  const b = band || (score >= 65 ? "green" : score >= 40 ? "amber" : "red");
  if (b === "green") return "band_green";
  if (b === "amber") return "band_amber";
  return "band_red";
}

// health_score_log JSON columns can come back as objects (jsonb) or strings (text).
export function parseMaybeJSON(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Dynamic client-side Health Score calculation engine fallback
export function computeHealthScoreFromData({ sales = [], expenses = [], stock = [] }) {
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount_rwf || e.amount) || 0), 0);
  const netCash = totalRevenue - totalExpenses;
  const salesCount = sales.length;
  const stockCount = stock.length;
  const lowStockCount = stock.filter((i) => (Number(i.quantity) || 0) <= (Number(i.low_stock_threshold) || 5)).length;

  let score = 50;

  const positive = [];
  const negative = [];
  const recommendations = [];

  // 1. Sales Performance & Volume
  if (totalRevenue >= 100000) {
    score += 18;
    positive.push({
      label_en: "Strong total sales revenue recorded (Above 100,000 RWF)",
      label_rw: "Inyungu z'igicuruzo ziri ku rwego rwiza (Sura 100,000 RWF)",
    });
  } else if (totalRevenue > 0) {
    score += 10;
    positive.push({
      label_en: "Active daily sales entries logged",
      label_rw: "Ibikorwa byo kugurisha byatangiye neza",
    });
  } else {
    score -= 10;
    negative.push({
      label_en: "Low recorded sales volume this period",
      label_rw: "Ibipimo by'igurisha biri ku rwego rwo brings",
    });
    recommendations.push({
      en: "Record all daily cash & Mobile Money sales in the app to build proof of revenue.",
      rw: "Andika ibyo wagurishije byose bya buri munsi kugira ngo wubake ikigaragaza inyungu.",
    });
  }

  // 2. Cashflow & Profit Margin
  if (netCash > 0) {
    score += 15;
    positive.push({
      label_en: "Positive net cashflow & profit margin",
      label_rw: "Umusaruro mwiza n'ubwiyongere bw'ingano y'amafaranga",
    });
  } else if (totalExpenses > 0) {
    score -= 10;
    negative.push({
      label_en: "Operating expenses exceed current recorded revenue",
      label_rw: "Ibyasohotse biraruta ibyarenze ku nyungu",
    });
    recommendations.push({
      en: "Review high monthly operating expenses to maintain positive working capital.",
      rw: "Genzura ibyasohotse buri kwezi kugira ngo ukomeze ube ufite inyungu.",
    });
  }

  // 3. Inventory Management
  if (stockCount > 0 && lowStockCount === 0) {
    score += 10;
    positive.push({
      label_en: "Healthy inventory stock levels with no critical low-stock alerts",
      label_rw: "Ububiko buhagije ntasoko yarangiye",
    });
  } else if (lowStockCount > 0) {
    score -= 8;
    negative.push({
      label_en: `${lowStockCount} product(s) are running critically low in stock`,
      label_rw: `Ibibikwa ${lowStockCount} biri hafi gushira mu bubiko`,
    });
    recommendations.push({
      en: "Restock fast-moving items before they go completely out of stock.",
      rw: "Wongere gushyiramo ibintu bigurishwa cyane mbere yuko bishira.",
    });
  }

  // 4. Record History & Frequency
  if (salesCount >= 5) {
    score += 10;
    positive.push({
      label_en: "High transaction record frequency (5+ sales entries logged)",
      label_rw: "Ibikorwa byinshi byanditse neza",
    });
  } else {
    recommendations.push({
      en: "Consistently log transactions daily to improve your SACCO credit score rating.",
      rw: "Komeza kwandika buri munsi kugira ngo urebe uburyo bwo kubona inguzanyo muri SACCO.",
    });
  }

  score = Math.max(28, Math.min(98, score));
  const band = score >= 65 ? "green" : score >= 40 ? "amber" : "red";

  if (recommendations.length === 0) {
    recommendations.push({
      en: "Maintain daily digital records to qualify for instant SME micro-financing.",
      rw: "Komeza kwandika buri munsi kugira ngo ubone inguzanyo y'ubucuruzi buciriritse.",
    });
  }

  return {
    score,
    band,
    factors: { positive, negative },
    recommendations,
  };
}
