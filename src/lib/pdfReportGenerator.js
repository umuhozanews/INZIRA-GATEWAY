import jsPDF from "jspdf";
import "jspdf-autotable";
import { rwf, formatDate } from "./format";

/**
 * Generates and downloads a clean, professional, official PDF report for Rwandan SMEs.
 */
export function generatePdfReport({
  activeTab = "all", // 'sales' | 'expenses' | 'stock' | 'tax' | 'all'
  dateRangeLabel = "This Month",
  shopSettings = null,
  user = null,
  salesReport,
  expensesReport,
  stockReport,
  taxReport,
  filteredSales = [],
  filteredExpenses = [],
  stock = [],
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [255, 107, 0]; // #FF6B00 Brand Orange
  const darkColor = [15, 17, 23]; // #0F1117 Charcoal
  const mutedColor = [100, 116, 139]; // Slate

  const shopName = (shopSettings?.shop_name || user?.shop_name || "INZIRA SME STORE").toUpperCase();
  const shopTin = shopSettings?.tin_number || user?.tin_number || "TIN Registered";
  const shopPhone = shopSettings?.shop_phone || user?.phone || "";
  const shopLocation = shopSettings?.shop_address || user?.district || "Kigali, Rwanda";

  let currentY = 15;

  // ─── 1. OFFICIAL HEADER ───
  doc.setFillColor(...darkColor);
  doc.rect(14, currentY, 182, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(shopName, 20, currentY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(220, 225, 235);
  doc.text(`${shopLocation} ${shopPhone ? `· Tel: ${shopPhone}` : ""} · TIN: ${shopTin}`, 20, currentY + 16);
  doc.text(`Official Business Performance Report · Period: ${dateRangeLabel}`, 20, currentY + 22);

  currentY += 32;

  // ─── 2. EXECUTIVE FINANCIAL KPI SUMMARY BOX ───
  const netCash = (salesReport?.totalRevenue || 0) - (expensesReport?.totalExpenses || 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...darkColor);
  doc.text("EXECUTIVE FINANCIAL SUMMARY", 14, currentY);
  currentY += 4;

  const kpiData = [
    [
      "Gross Sales Revenue",
      "Total Operating Expenses",
      "Net Operating Cash Flow",
      "Stock Asset Valuation",
    ],
    [
      `${rwf(salesReport?.totalRevenue || 0)} RWF`,
      `${rwf(expensesReport?.totalExpenses || 0)} RWF`,
      `${rwf(netCash)} RWF`,
      `${rwf(stockReport?.totalSellValuation || 0)} RWF`,
    ],
  ];

  doc.autoTable({
    startY: currentY,
    head: [kpiData[0]],
    body: [kpiData[1]],
    theme: "grid",
    headStyles: {
      fillColor: [240, 243, 248],
      textColor: [30, 41, 59],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9.5,
      fontStyle: "bold",
      textColor: [15, 23, 42],
      halign: "center",
      cellPadding: 4,
    },
    columnStyles: {
      2: { textColor: netCash >= 0 ? [15, 23, 42] : [200, 30, 30] },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ─── 3. SECTION: SALES & TRANSACTIONS LOG ───
  if (activeTab === "sales" || activeTab === "all") {
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...darkColor);
    doc.text(`1. SALES & TRANSACTIONS LOG (${filteredSales.length} Records)`, 14, currentY);
    currentY += 4;

    const salesRows = filteredSales.map((s) => [
      formatDate(s.created_at || s.sale_date),
      s.invoice_number || `SALE-${s.id}`,
      s.customer_name || "Walk-in Customer",
      (s.payment_method || "Cash").toUpperCase().replace("_", " "),
      `${rwf(s.total_amount)} RWF`,
    ]);

    doc.autoTable({
      startY: currentY,
      head: [["Date", "Invoice / Ref", "Customer", "Payment Channel", "Amount (RWF)"]],
      body: salesRows.length > 0 ? salesRows.slice(0, 100) : [["No sales recorded in this period", "", "", "", "0 RWF"]],
      theme: "striped",
      headStyles: {
        fillColor: darkColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // ─── 4. SECTION: EXPENSES REPORT & BREAKDOWN ───
  if (activeTab === "expenses" || activeTab === "all") {
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...darkColor);
    doc.text(`2. RECORDED EXPENSES LEDGER (${filteredExpenses.length} Records)`, 14, currentY);
    currentY += 4;

    const expenseRows = filteredExpenses.map((e) => [
      formatDate(e.expense_date || e.created_at),
      e.category || "General",
      e.description || e.notes || "—",
      `${rwf(e.amount_rwf || e.amount)} RWF`,
    ]);

    doc.autoTable({
      startY: currentY,
      head: [["Date", "Category", "Description / Note", "Amount (RWF)"]],
      body: expenseRows.length > 0 ? expenseRows.slice(0, 100) : [["No expenses recorded in this period", "", "", "0 RWF"]],
      theme: "striped",
      headStyles: {
        fillColor: darkColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        3: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // ─── 5. SECTION: STOCK VALUATION REGISTER ───
  if (activeTab === "stock" || activeTab === "all") {
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...darkColor);
    doc.text(`3. PHYSICAL STOCK VALUATION REGISTER (${stock.length} Products)`, 14, currentY);
    currentY += 4;

    const stockRows = stock.map((item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.cost_price_rwf || item.cost_price || 0);
      const sell = Number(item.sell_price_rwf || item.unit_price || 0);
      const val = qty * sell;
      return [
        item.name,
        item.category || "General",
        `${qty}`,
        `${rwf(cost)} RWF`,
        `${rwf(sell)} RWF`,
        `${rwf(val)} RWF`,
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [["Product Name", "Category", "In Stock", "Cost Price", "Sell Price", "Total Value"]],
      body: stockRows.length > 0 ? stockRows.slice(0, 100) : [["No stock products registered", "", "", "", "", "0 RWF"]],
      theme: "striped",
      headStyles: {
        fillColor: darkColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        2: { halign: "center", fontStyle: "bold" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // ─── 6. SECTION: TAX & EBM OUTPUT ───
  if (activeTab === "tax" || activeTab === "all") {
    if (currentY > 230) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...darkColor);
    doc.text("4. RRA TAX & VAT (18%) ESTIMATION", 14, currentY);
    currentY += 4;

    const taxRows = [
      ["Gross Turn-Over (VAT Inclusive)", `${rwf(taxReport?.totalRevenue || 0)} RWF`],
      ["Taxable Base (Net of VAT)", `${rwf(taxReport?.taxableSales || 0)} RWF`],
      ["Calculated Output VAT (18%)", `${rwf(taxReport?.vat18 || 0)} RWF`],
      ["EBM Receipts Issued in Period", `${taxReport?.ebmReceiptsIssued || 0} Invoices`],
    ];

    doc.autoTable({
      startY: currentY,
      head: [["Tax Item", "Amount / Count"]],
      body: taxRows,
      theme: "grid",
      headStyles: {
        fillColor: [240, 243, 248],
        textColor: [30, 41, 59],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        1: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ─── FOOTER ON ALL PAGES ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Generated by INZIRA DataBridge SME Platform · Verified Digital Audit Record · Page ${i} of ${pageCount}`,
      14,
      288
    );
    doc.text(
      `Exported on ${new Date().toLocaleString()}`,
      196,
      288,
      { align: "right" }
    );
  }

  // ─── INSTANT FILE DOWNLOAD ───
  const cleanName = (shopSettings?.shop_name || user?.shop_name || "SME")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 20);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `INZIRA_Report_${cleanName}_${activeTab}_${dateStr}.pdf`;

  doc.save(filename);
  return filename;
}
