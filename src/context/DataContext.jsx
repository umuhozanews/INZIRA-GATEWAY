import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "./AuthContext";
import { rwf } from "../lib/format";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  // Scope storage keys specifically to the logged-in user account ID/email/phone
  const userKey = useMemo(() => {
    if (!user) return "guest";
    const cleanId = String(user.id || user.email || user.phone || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
    return cleanId;
  }, [user]);

  const STOCK_KEY = `db_stock_${userKey}`;
  const SALES_KEY = `db_sales_${userKey}`;
  const EXPENSES_KEY = `db_expenses_${userKey}`;
  const NOTIFS_KEY = `db_notifications_${userKey}`;

  // Load account-specific stock
  const [stock, setStock] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_stock_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load account-specific sales
  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_sales_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load account-specific expenses
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_expenses_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load account-specific persistent notifications (deletions, audits, system alerts)
  const [persistentNotifs, setPersistentNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(`db_notifications_${userKey}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Re-sync local state whenever active user account changes
  useEffect(() => {
    try {
      const savedStock = localStorage.getItem(STOCK_KEY);
      const savedSales = localStorage.getItem(SALES_KEY);
      const savedExpenses = localStorage.getItem(EXPENSES_KEY);
      const savedNotifs = localStorage.getItem(NOTIFS_KEY);

      setStock(savedStock !== null ? JSON.parse(savedStock) : []);
      setSales(savedSales !== null ? JSON.parse(savedSales) : []);
      setExpenses(savedExpenses !== null ? JSON.parse(savedExpenses) : []);
      setPersistentNotifs(savedNotifs !== null ? JSON.parse(savedNotifs) : []);
    } catch (e) {
      console.error("Failed to load user-scoped data:", e);
    }
  }, [userKey, STOCK_KEY, SALES_KEY, EXPENSES_KEY, NOTIFS_KEY]);

  // Method to completely reset all data state for a fresh new account
  const resetData = useCallback(() => {
    setStock([]);
    setSales([]);
    setExpenses([]);
    setPersistentNotifs([]);
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify([]));
      localStorage.setItem(SALES_KEY, JSON.stringify([]));
      localStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
      localStorage.setItem(NOTIFS_KEY, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  }, [STOCK_KEY, SALES_KEY, EXPENSES_KEY, NOTIFS_KEY]);

  const recordNotification = useCallback((notif) => {
    const entry = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: notif.type || "alert", // 'deletion' | 'alert' | 'analytics'
      category: notif.category || "general",
      title: notif.title || "Notification",
      desc: notif.desc || "",
      actionLabel: notif.actionLabel || null,
      actionTo: notif.actionTo || null,
      meta: notif.meta || {},
      created_at: notif.created_at || new Date().toISOString(),
      user_name: user?.name || "Store Owner",
    };
    setPersistentNotifs((prev) => [entry, ...prev.slice(0, 49)]); // keep latest 50
    return entry;
  }, [user]);

  const deleteNotification = useCallback((id) => {
    setPersistentNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setPersistentNotifs([]);
  }, []);

  // Sync state to user-scoped localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
    } catch (e) {
      console.error("Failed to save stock to localStorage:", e);
    }
  }, [stock, STOCK_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    } catch (e) {
      console.error("Failed to save sales to localStorage:", e);
    }
  }, [sales, SALES_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error("Failed to save expenses to localStorage:", e);
    }
  }, [expenses, EXPENSES_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(persistentNotifs));
    } catch (e) {
      console.error("Failed to save notifications to localStorage:", e);
    }
  }, [persistentNotifs, NOTIFS_KEY]);

  // Real-Time Cross-Tab / Cross-Window Sync via Web Storage Listener
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STOCK_KEY) {
        try { setStock(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
      if (e.key === SALES_KEY) {
        try { setSales(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
      if (e.key === EXPENSES_KEY) {
        try { setExpenses(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [STOCK_KEY, SALES_KEY, EXPENSES_KEY]);

  // Sync data with Backend API, keeping user account consistent across devices
  const refreshAll = useCallback(async (silent = true) => {
    if (!silent) setLoading(true);
    try {
      const [stkRes, saleRes, expRes] = await Promise.allSettled([
        api.get("/stock", { params: { limit: 200 } }),
        api.get("/sales", { params: { limit: 100 } }),
        api.get("/expenses", { params: { limit: 100 } }),
      ]);

      if (stkRes.status === "fulfilled") {
        const resData = stkRes.value.data;
        const serverItems = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData?.items) ? resData.items : Array.isArray(resData) ? resData : null;
        if (serverItems && serverItems.length > 0) {
          setStock(prev => {
            const localMap = new Map();
            prev.forEach(p => {
              if (p && p.name) localMap.set(p.name.toLowerCase().trim(), p);
              if (p && p.id) localMap.set(String(p.id), p);
            });

            const merged = serverItems.map(serverItem => {
              const nameKey = (serverItem.name || "").toLowerCase().trim();
              const idKey = String(serverItem.id);
              const localMatch = localMap.get(nameKey) || localMap.get(idKey);
              if (!localMatch) return serverItem;

              return {
                ...localMatch,
                ...serverItem,
                quantity: serverItem.quantity !== undefined ? Number(serverItem.quantity) : Number(localMatch.quantity)
              };
            });

            const serverNameKeys = new Set(serverItems.map(s => (s.name || "").toLowerCase().trim()));
            const serverIdKeys = new Set(serverItems.map(s => String(s.id)));

            prev.forEach(localItem => {
              if (!localItem) return;
              const nameKey = (localItem.name || "").toLowerCase().trim();
              const idKey = String(localItem.id);
              if (!serverNameKeys.has(nameKey) && !serverIdKeys.has(idKey)) {
                merged.push(localItem);
              }
            });

            const seen = new Set();
            return merged.filter(item => {
              if (!item || !item.id) return false;
              const key = item.name ? item.name.toLowerCase().trim() : String(item.id);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
        }
      }

      // 2. Sales synchronization (Permanent Non-Destructive Merge)
      const rawSaleList = saleRes.status === "fulfilled"
        ? (Array.isArray(saleRes.value.data?.data)
            ? saleRes.value.data.data
            : Array.isArray(saleRes.value.data?.sales)
            ? saleRes.value.data.sales
            : Array.isArray(saleRes.value.data)
            ? saleRes.value.data
            : null)
        : null;

      if (rawSaleList) {
        setSales(prev => {
          const serverIds = new Set(rawSaleList.map(s => String(s.id)));
          const serverInvNums = new Set(rawSaleList.map(s => s.invoice_number).filter(Boolean));

          // Retain all existing local sales that are not yet in server list
          const localOnly = prev.filter(localSale => {
            if (!localSale) return false;
            const isIdMatch = localSale.id && serverIds.has(String(localSale.id));
            const isInvMatch = localSale.invoice_number && serverInvNums.has(localSale.invoice_number);
            return !isIdMatch && !isInvMatch;
          });

          const combined = [...rawSaleList, ...localOnly];
          const seen = new Set();
          return combined.filter(s => {
            if (!s) return false;
            const key = s.invoice_number || String(s.id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }

      // 3. Expenses synchronization (Permanent Non-Destructive Merge)
      const rawExpList = expRes.status === "fulfilled"
        ? (Array.isArray(expRes.value.data?.data)
            ? expRes.value.data.data
            : Array.isArray(expRes.value.data?.expenses)
            ? expRes.value.data.expenses
            : Array.isArray(expRes.value.data)
            ? expRes.value.data
            : null)
        : null;

      if (rawExpList) {
        const serverExpenses = rawExpList.map(e => ({
          ...e,
          amount_rwf: Number(e.amount_rwf || e.amount) || 0,
          amount: Number(e.amount || e.amount_rwf) || 0,
        }));

        setExpenses(prev => {
          const serverIds = new Set(serverExpenses.map(e => String(e.id)));
          const localOnly = prev.filter(localExp => {
            if (!localExp) return false;
            const isIdMatch = localExp.id && serverIds.has(String(localExp.id));
            const isDuplicate = serverExpenses.some(se =>
              se.category === localExp.category &&
              Number(se.amount || se.amount_rwf) === Number(localExp.amount || localExp.amount_rwf) &&
              String(se.expense_date || se.created_at).slice(0, 10) === String(localExp.expense_date || localExp.created_at).slice(0, 10)
            );
            return !isIdMatch && !isDuplicate;
          });

          const combined = [...serverExpenses, ...localOnly];
          const seen = new Set();
          return combined.filter(e => {
            if (!e) return false;
            const key = String(e.id || `${e.category}_${e.amount}_${e.expense_date}`);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }
    } catch (err) {
      console.warn("[DataContext] Network sync warning, using local persistent state:", err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + Automatic 8-second polling + Window Focus & Online Sync
  useEffect(() => {
    refreshAll(false);

    const pollInterval = setInterval(() => {
      refreshAll(true);
    }, 8000);

    const handleFocus = () => refreshAll(true);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshAll(true);
    };
    const handleOnline = () => {
      setIsOnline(true);
      refreshAll(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshAll]);

  // Interconnected Record Sale Action
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
      cashier_name: "Cashier",
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

    setSales(prev => [newSale, ...prev]);

    setStock(prevStock => {
      return prevStock.map(item => {
        const itemCleanName = (item.name || "").toLowerCase().trim();
        const cartMatch = items.find(ci => {
          const ciCleanName = (ci.item_name || ci.name || "").toLowerCase().trim();
          const matchId = (ci.stock_item_id && String(ci.stock_item_id) === String(item.id)) || (ci.id && String(ci.id) === String(item.id));
          const matchName = ciCleanName && ciCleanName === itemCleanName;
          return matchId || matchName;
        });

        if (cartMatch) {
          const currentQty = Number(item.quantity) || 0;
          const soldQty = Number(cartMatch.quantity) || 1;
          const newQty = Math.max(0, currentQty - soldQty);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });

    try {
      const idempotencyKey = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.post(
        "/sales",
        {
          items,
          payment_method,
          customer_name,
          customer_phone,
          due_date: newSale.due_date,
          amount_paid: paidVal,
          amount_owed: owedVal,
          split_payments,
          notes,
        },
        {
          headers: { "Idempotency-Key": idempotencyKey },
        }
      );
      const serverSale = res?.data?.data || res?.data?.sale || res?.data;
      if (serverSale && serverSale.id) {
        setSales(prev =>
          prev.map(s => (s.id === timestamp ? { ...newSale, ...serverSale } : s))
        );
      }
      setTimeout(() => refreshAll(true), 600);
    } catch (err) {
      console.warn("[DataContext] Async sale post fallback:", err.message);
    }

    return newSale;
  };

  // Void a sale and restore inventory quantity
  const voidSale = async (saleId, voidReason = "Customer cancellation", voidTarget = null) => {
    const saleToVoid = voidTarget || sales.find(s => String(s.id) === String(saleId) || (s.invoice_number && s.invoice_number === saleId));
    if (saleToVoid && Array.isArray(saleToVoid.items)) {
      setStock(prevStock => {
        return prevStock.map(item => {
          const itemCleanName = (item.name || "").toLowerCase().trim();
          const itemMatch = saleToVoid.items.find(i => {
            const iCleanName = (i.item_name || i.name || "").toLowerCase().trim();
            const matchId = (i.stock_item_id && String(i.stock_item_id) === String(item.id)) || (i.id && String(i.id) === String(item.id));
            const matchName = iCleanName && iCleanName === itemCleanName;
            return matchId || matchName;
          });
          if (itemMatch) {
            return { ...item, quantity: (Number(item.quantity) || 0) + Number(itemMatch.quantity || 1) };
          }
          return item;
        });
      });
    }

    setSales(prev => prev.filter(s => String(s.id) !== String(saleId) && s.invoice_number !== saleId));

    if (saleToVoid) {
      const invNum = saleToVoid.invoice_number || `INV-${saleToVoid.id || saleId}`;
      const amount = Number(saleToVoid.total_amount) || 0;
      recordNotification({
        type: "deletion",
        category: "invoice_voided",
        title: "Invoice Voided & Deleted",
        desc: `Invoice #${invNum} (${rwf(amount)} RWF) was voided and removed. Reason: "${voidReason || "Customer cancellation"}". Sold items were restored to inventory.`,
        actionLabel: "View Invoices",
        actionTo: "/invoices",
        meta: {
          invoice_number: invNum,
          total_amount: amount,
          void_reason: voidReason
        }
      });
    }

    try {
      await api.post(`/sales/${saleId}/void`, { void_reason: voidReason || "Customer cancellation" });
      setTimeout(() => refreshAll(true), 1000);
    } catch (err) {
      console.warn("[DataContext] Async sale void fallback:", err.message);
    }
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

    try {
      await api.post(`/sales/${saleId}/debt-payment`, {
        amount: paymentAmount,
        payment_method,
        note
      });
      setTimeout(() => refreshAll(true), 1000);
    } catch (err) {
      console.warn("[DataContext] Async debt payment post fallback:", err.message);
    }

    return updatedSale;
  };

  // Interconnected Add Stock Item Action
  const addStockItem = async (newItem) => {
    const timestamp = Date.now();
    const cleanName = (newItem.name || "").trim();
    const created = {
      id: timestamp,
      name: cleanName,
      category: newItem.category || "General",
      unit: newItem.unit || "pcs",
      quantity: Number(newItem.quantity) || 0,
      cost_price_rwf: Number(newItem.cost_price_rwf) || 0,
      sell_price_rwf: Number(newItem.sell_price_rwf) || 0,
      low_stock_threshold: Number(newItem.low_stock_threshold) || 5,
      is_active: true,
    };

    setStock(prev => {
      const exists = prev.some(
        p => (p.name || "").toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) return prev;
      return [created, ...prev];
    });

    try {
      const res = await api.post("/stock", newItem);
      const serverItem = res?.data;
      if (serverItem && serverItem.id) {
        setStock(prev =>
          prev.map(p =>
            p.id === timestamp || (p.name || "").toLowerCase().trim() === cleanName.toLowerCase()
              ? serverItem
              : p
          )
        );
      }
      setTimeout(() => refreshAll(true), 400);
      return serverItem || created;
    } catch (err) {
      console.warn("[DataContext] Async stock add fallback:", err.message);
      return created;
    }
  };

  // Update Stock Item Action
  const updateStockItem = async (id, updatedFields) => {
    setStock(prev =>
      prev.map(item => (String(item.id) === String(id) ? { ...item, ...updatedFields } : item))
    );
    try {
      await api.put(`/stock/${id}`, updatedFields);
      setTimeout(() => refreshAll(true), 1000);
    } catch (err) {
      console.warn("[DataContext] Async stock update fallback:", err.message);
    }
  };

  // Quick Restock / Add Quantity to Existing Stock
  const addStockQuantity = async (id, addedQuantity, notes = "Quick restock", itemData = null) => {
    const qty = Number(addedQuantity) || 0;
    if (qty <= 0) return;

    let targetItem = itemData;
    const targetName = (itemData?.name || "").toLowerCase().trim();

    setStock(prev =>
      prev.map(item => {
        const matchesId = String(item.id) === String(id);
        const matchesName = targetName && (item.name || "").toLowerCase().trim() === targetName;
        if (matchesId || matchesName) {
          if (!targetItem) targetItem = item;
          const currentQty = Number(item.quantity) || 0;
          return { ...item, quantity: currentQty + qty };
        }
        return item;
      })
    );

    try {
      const payload = {
        added_quantity: qty,
        notes,
        name: targetItem?.name || itemData?.name,
        category: targetItem?.category || itemData?.category,
        unit: targetItem?.unit || itemData?.unit,
        cost_price_rwf: targetItem?.cost_price_rwf || itemData?.cost_price_rwf,
        sell_price_rwf: targetItem?.sell_price_rwf || itemData?.sell_price_rwf,
      };

      const res = await api.post(`/stock/${encodeURIComponent(id)}/add-quantity`, payload);
      const serverItem = res?.data?.item || res?.data;
      if (serverItem && serverItem.id) {
        setStock(prev =>
          prev.map(item => {
            const matchesId = String(item.id) === String(serverItem.id) || String(item.id) === String(id);
            const matchesName = (item.name || "").toLowerCase().trim() === (serverItem.name || targetName || "").toLowerCase().trim();
            if (matchesId || matchesName) {
              return { ...item, ...serverItem, quantity: Number(serverItem.quantity) };
            }
            return item;
          })
        );
      }
      setTimeout(() => refreshAll(true), 300);
    } catch (err) {
      console.warn("[DataContext] Async stock add-quantity fallback:", err.message);
    }
  };

  // Delete Stock Item Action
  const deleteStockItem = async (id, itemData = null) => {
    const itemToDelete = itemData || stock.find(item => String(item.id) === String(id));
    setStock(prev => prev.filter(item => String(item.id) !== String(id)));

    if (itemToDelete) {
      recordNotification({
        type: "deletion",
        category: "stock_deletion",
        title: "Stock Item Deleted",
        desc: `"${itemToDelete.name}" (${itemToDelete.quantity || 0} ${itemToDelete.unit || "units"}) was deleted from inventory.`,
        actionLabel: "View Stock",
        actionTo: "/stock",
        meta: {
          itemId: itemToDelete.id,
          name: itemToDelete.name,
          quantity: itemToDelete.quantity,
          unit: itemToDelete.unit
        }
      });
    }

    try {
      await api.delete(`/stock/${id}`);
      setTimeout(() => refreshAll(true), 400);
    } catch (err) {
      console.warn("[DataContext] Async stock delete fallback:", err.message);
    }
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
      const res = await api.post("/expenses", newExpense);
      const serverExpense = res?.data?.data || res?.data;
      if (serverExpense && serverExpense.id) {
        setExpenses(prev =>
          prev.map(exp => (exp.id === timestamp ? serverExpense : exp))
        );
      }
      setTimeout(() => refreshAll(true), 300);
      return serverExpense || created;
    } catch (err) {
      console.warn("[DataContext] Async expense add fallback:", err.message);
      return created;
    }
  };

  // Update Expense Action
  const updateExpense = async (id, updatedFields) => {
    setExpenses(prev =>
      prev.map(exp => (String(exp.id) === String(id) ? { ...exp, ...updatedFields } : exp))
    );
    try {
      await api.put(`/expenses/${id}`, updatedFields);
      setTimeout(() => refreshAll(true), 1000);
    } catch (err) {
      console.warn("[DataContext] Async expense update fallback:", err.message);
    }
  };

  // Delete Expense Action
  const deleteExpense = async (id, expData = null) => {
    const expToDelete = expData || expenses.find(exp => String(exp.id) === String(id));
    setExpenses(prev => prev.filter(exp => String(exp.id) !== String(id)));

    if (expToDelete) {
      const amount = Number(expToDelete.amount || expToDelete.amount_rwf) || 0;
      recordNotification({
        type: "deletion",
        category: "expense_deletion",
        title: "Expense Entry Deleted",
        desc: `Expense "${expToDelete.title || expToDelete.category || "Expense"}" (${rwf(amount)} RWF) was deleted.`,
        actionLabel: "View Expenses",
        actionTo: "/expenses",
        meta: {
          expenseId: expToDelete.id,
          amount
        }
      });
    }

    try {
      await api.delete(`/expenses/${id}`);
      setTimeout(() => refreshAll(true), 1000);
    } catch (err) {
      console.warn("[DataContext] Async expense delete fallback:", err.message);
    }
  };

  const pendingSyncCount = useMemo(() => {
    const localStock = stock.filter(p => typeof p.id === "number" && p.id > 1000000000000).length;
    const localSales = sales.filter(s => typeof s.id === "number" && s.id > 1000000000000).length;
    const localExpenses = expenses.filter(e => typeof e.id === "number" && e.id > 1000000000000).length;
    return localStock + localSales + localExpenses;
  }, [stock, sales, expenses]);

  return (
    <DataContext.Provider
      value={{
        stock,
        sales,
        expenses,
        notifications: persistentNotifs,
        recordNotification,
        deleteNotification,
        clearNotifications,
        loading,
        isOnline,
        pendingSyncCount,
        recordSale,
        voidSale,
        deleteSale: voidSale,
        recordDebtPayment,
        addStockItem,
        addStockQuantity,
        updateStockItem,
        deleteStockItem,
        addExpense,
        updateExpense,
        deleteExpense,
        refreshAll,
        resetData,
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
