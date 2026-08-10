import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

const DataContext = createContext(null);

const DEFAULT_STOCK = [
  { id: 1, name: "Sugar 1kg", category: "Groceries", unit: "kg", quantity: 48, sell_price_rwf: 1500, cost_price_rwf: 1200, low_stock_threshold: 10, is_active: true },
  { id: 2, name: "Cooking Oil 1L", category: "Groceries", unit: "litre", quantity: 28, sell_price_rwf: 2800, cost_price_rwf: 2200, low_stock_threshold: 5, is_active: true },
  { id: 3, name: "Soap Bar", category: "Hygiene", unit: "pcs", quantity: 96, sell_price_rwf: 600, cost_price_rwf: 400, low_stock_threshold: 20, is_active: true },
  { id: 4, name: "Rice 1kg", category: "Groceries", unit: "kg", quantity: 75, sell_price_rwf: 1200, cost_price_rwf: 900, low_stock_threshold: 15, is_active: true },
  { id: 5, name: "Men Plain T-Shirt", category: "T-Shirts", unit: "pcs", quantity: 24, sell_price_rwf: 8500, cost_price_rwf: 5500, low_stock_threshold: 5, is_active: true },
  { id: 6, name: "Women Floral Dress", category: "Dresses", unit: "pcs", quantity: 14, sell_price_rwf: 22000, cost_price_rwf: 14000, low_stock_threshold: 3, is_active: true },
  { id: 7, name: "Men Slim Jeans", category: "Jeans", unit: "pcs", quantity: 18, sell_price_rwf: 18500, cost_price_rwf: 11000, low_stock_threshold: 5, is_active: true },
];

const DEFAULT_SALES = [
  {
    id: 101,
    invoice_number: "INV-2026-001",
    customer_name: "Walk-in Customer",
    customer_phone: "",
    cashier_name: "Demo Cashier",
    payment_method: "cash",
    total_amount: 4500,
    amount_paid: 4500,
    amount_owed: 0,
    payment_status: "completed",
    items_count: 2,
    items: [
      { item_name: "Sugar 1kg", quantity: 2, unit_price: 1500, subtotal: 3000 },
      { item_name: "Cooking Oil 1L", quantity: 1, unit_price: 1500, subtotal: 1500 }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 102,
    invoice_number: "INV-2026-002",
    customer_name: "Jean Paul Bizimana",
    customer_phone: "0788123456",
    cashier_name: "Demo Cashier",
    payment_method: "split",
    split_payments: { cash: 5000, momo: 3000, momo_provider: "mtn_momo", credit: 4800 },
    total_amount: 12800,
    amount_paid: 8000,
    amount_owed: 4800,
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    payment_status: "partial",
    items_count: 3,
    items: [
      { item_name: "Men Plain T-Shirt", quantity: 1, unit_price: 8500, subtotal: 8500 },
      { item_name: "Soap Bar", quantity: 2, unit_price: 600, subtotal: 1200 },
      { item_name: "Sugar 1kg", quantity: 2, unit_price: 1550, subtotal: 3100 }
    ],
    debt_payments: [],
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 103,
    invoice_number: "INV-2026-003",
    customer_name: "Claire Umutoni",
    customer_phone: "0785987654",
    cashier_name: "Demo Cashier",
    payment_method: "credit",
    total_amount: 22000,
    amount_paid: 0,
    amount_owed: 22000,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    payment_status: "debt",
    items_count: 1,
    items: [
      { item_name: "Women Floral Dress", quantity: 1, unit_price: 22000, subtotal: 22000 }
    ],
    debt_payments: [],
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

const DEFAULT_EXPENSES = [
  { id: 1, category: "Rent", amount_rwf: 45000, title: "Store Monthly Rent", notes: "Kigali Market Stall", created_at: new Date().toISOString() },
  { id: 2, category: "Utilities", amount_rwf: 12500, title: "Electricity & Water Bill", notes: "EUCL Topup", created_at: new Date().toISOString() }
];

const DB_STOCK_KEY = "db_local_stock_v1";
const DB_SALES_KEY = "db_local_sales_v1";
const DB_EXPENSES_KEY = "db_local_expenses_v1";

export function DataProvider({ children }) {
  const [stock, setStock] = useState(() => {
    try {
      const saved = localStorage.getItem(DB_STOCK_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STOCK;
    } catch {
      return DEFAULT_STOCK;
    }
  });

  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem(DB_SALES_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SALES;
    } catch {
      return DEFAULT_SALES;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(DB_EXPENSES_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(DB_STOCK_KEY, JSON.stringify(stock));
    } catch (e) {
      console.error("Failed to save stock to localStorage:", e);
    }
  }, [stock]);

  useEffect(() => {
    try {
      localStorage.setItem(DB_SALES_KEY, JSON.stringify(sales));
    } catch (e) {
      console.error("Failed to save sales to localStorage:", e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(DB_EXPENSES_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error("Failed to save expenses to localStorage:", e);
    }
  }, [expenses]);

  // Sync data with Backend API, keeping locally added offline items
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stkRes, saleRes, expRes] = await Promise.allSettled([
        api.get("/stock", { params: { limit: 200 } }),
        api.get("/sales", { params: { limit: 100 } }),
        api.get("/expenses", { params: { limit: 100 } }),
      ]);

      if (stkRes.status === "fulfilled" && Array.isArray(stkRes.value.data?.data) && stkRes.value.data.data.length > 0) {
        const serverItems = stkRes.value.data.data;
        setStock(prev => {
          const localOnly = prev.filter(p => typeof p.id === "number" && p.id > 1000000000000);
          const serverIds = new Set(serverItems.map(s => s.id));
          const filteredLocal = localOnly.filter(p => !serverIds.has(p.id));
          return [...filteredLocal, ...serverItems];
        });
      }

      if (saleRes.status === "fulfilled" && Array.isArray(saleRes.value.data?.data) && saleRes.value.data.data.length > 0) {
        const serverSales = saleRes.value.data.data;
        setSales(prev => {
          const localOnly = prev.filter(s => typeof s.id === "number" && s.id > 1000000000000);
          const serverIds = new Set(serverSales.map(s => s.id));
          const filteredLocal = localOnly.filter(s => !serverIds.has(s.id));
          return [...filteredLocal, ...serverSales];
        });
      }

      if (expRes.status === "fulfilled" && Array.isArray(expRes.value.data?.data) && expRes.value.data.data.length > 0) {
        const serverExpenses = expRes.value.data.data;
        setExpenses(prev => {
          const localOnly = prev.filter(e => typeof e.id === "number" && e.id > 1000000000000);
          const serverIds = new Set(serverExpenses.map(e => e.id));
          const filteredLocal = localOnly.filter(e => !serverIds.has(e.id));
          return [...filteredLocal, ...serverExpenses];
        });
      }
    } catch (err) {
      console.warn("[DataContext] Network sync warning, using local persistent state:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Interconnected Record Sale Action with Split Payment & Debt Support
  const recordSale = async ({
    items,
    payment_method,
    customer_name,
    customer_phone,
    due_date,
    amount_paid,
    split_payments,
    notes,
  }) => {
    const saleTotal = items.reduce((s, l) => s + (Number(l.unit_price) * Number(l.quantity)), 0);
    const timestamp = Date.now();
    const invNum = `INV-2026-${String(sales.length + 1).padStart(3, "0")}`;

    // Calculate actual amount paid up-front
    let paidVal = 0;
    if (payment_method === "split" && split_payments) {
      paidVal = (Number(split_payments.cash) || 0) + (Number(split_payments.momo) || 0);
    } else if (payment_method === "credit") {
      paidVal = Number(amount_paid) || 0;
    } else {
      paidVal = amount_paid !== undefined ? Math.min(saleTotal, Number(amount_paid) || 0) : saleTotal;
    }

    const owedVal = Math.max(0, saleTotal - paidVal);

    let payStatus = "completed";
    if (owedVal > 0) {
      payStatus = paidVal > 0 ? "partial" : "debt";
    }

    const defaultDueDate = owedVal > 0 
      ? new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
      : null;

    const newSale = {
      id: timestamp,
      invoice_number: invNum,
      customer_name: customer_name?.trim() || "Walk-in Customer",
      customer_phone: customer_phone?.trim() || "",
      cashier_name: "Demo Cashier",
      payment_method: payment_method || "cash",
      split_payments: payment_method === "split" ? split_payments : null,
      total_amount: saleTotal,
      amount_paid: paidVal,
      amount_owed: owedVal,
      due_date: due_date || defaultDueDate,
      payment_status: payStatus,
      notes: notes || "",
      items_count: items.length,
      items: items.map(i => ({
        stock_item_id: i.stock_item_id || null,
        item_name: i.item_name || i.name,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        subtotal: Number(i.unit_price) * Number(i.quantity)
      })),
      debt_payments: [],
      created_at: new Date().toISOString()
    };

    // 1. Immediately update Sales history in state
    setSales(prev => [newSale, ...prev]);

    // 2. Immediately decrement Stock quantities for all purchased stock items
    setStock(prevStock => {
      return prevStock.map(item => {
        const cartMatch = items.find(ci => ci.stock_item_id && String(ci.stock_item_id) === String(item.id));
        if (cartMatch) {
          const currentQty = Number(item.quantity) || 0;
          const newQty = Math.max(0, currentQty - Number(cartMatch.quantity));
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });

    // 3. Post to backend API asynchronously
    try {
      await api.post("/sales", {
        items,
        payment_method,
        customer_name,
        customer_phone,
        due_date: newSale.due_date,
        amount_paid: paidVal,
        amount_owed: owedVal,
        split_payments,
        notes
      });
    } catch (err) {
      console.warn("[DataContext] Async sale post fallback:", err.message);
    }

    return newSale;
  };

  // Record a payment towards an existing customer debt
  const recordDebtPayment = async (saleId, { amount, payment_method = "cash", note = "" }) => {
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) return null;

    let updatedSale = null;

    setSales(prevSales => {
      return prevSales.map(sale => {
        if (String(sale.id) === String(saleId)) {
          const currentPaid = Number(sale.amount_paid) || 0;
          const newPaid = currentPaid + paymentAmount;
          const newOwed = Math.max(0, (Number(sale.total_amount) || 0) - newPaid);
          const newStatus = newOwed <= 0 ? "completed" : "partial";

          const newLog = {
            id: Date.now(),
            amount: paymentAmount,
            payment_method,
            note: note || "Debt repayment",
            created_at: new Date().toISOString()
          };

          updatedSale = {
            ...sale,
            amount_paid: newPaid,
            amount_owed: newOwed,
            payment_status: newStatus,
            debt_payments: [...(sale.debt_payments || []), newLog]
          };
          return updatedSale;
        }
        return sale;
      });
    });

    // Try posting to API
    try {
      await api.post(`/sales/${saleId}/debt-payment`, {
        amount: paymentAmount,
        payment_method,
        note
      });
    } catch (err) {
      console.warn("[DataContext] Async debt payment post fallback:", err.message);
    }

    return updatedSale;
  };

  // Interconnected Add Stock Item Action
  const addStockItem = async (newItem) => {
    const timestamp = Date.now();
    const created = {
      id: timestamp,
      name: newItem.name.trim(),
      category: newItem.category || "General",
      unit: newItem.unit || "pcs",
      quantity: Number(newItem.quantity) || 0,
      cost_price_rwf: Number(newItem.cost_price_rwf) || 0,
      sell_price_rwf: Number(newItem.sell_price_rwf) || 0,
      low_stock_threshold: Number(newItem.low_stock_threshold) || 5,
      is_active: true,
    };
    setStock(prev => [created, ...prev]);

    try {
      await api.post("/stock", newItem);
    } catch (err) {
      console.warn("[DataContext] Async stock add fallback:", err.message);
    }

    return created;
  };

  // Interconnected Add Expense Action
  const addExpense = async (newExpense) => {
    const timestamp = Date.now();
    const created = {
      id: timestamp,
      title: newExpense.title || newExpense.description || newExpense.category,
      category: newExpense.category,
      amount_rwf: Number(newExpense.amount) || Number(newExpense.amount_rwf) || 0,
      amount: Number(newExpense.amount) || Number(newExpense.amount_rwf) || 0,
      description: newExpense.description || newExpense.notes || "",
      notes: newExpense.description || newExpense.notes || "",
      expense_date: newExpense.expense_date || new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    setExpenses(prev => [created, ...prev]);

    try {
      await api.post("/expenses", newExpense);
    } catch (err) {
      console.warn("[DataContext] Async expense add fallback:", err.message);
    }

    return created;
  };

  return (
    <DataContext.Provider
      value={{
        stock,
        sales,
        expenses,
        loading,
        recordSale,
        recordDebtPayment,
        addStockItem,
        addExpense,
        refreshAll
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

