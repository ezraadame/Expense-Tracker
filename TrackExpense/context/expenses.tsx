import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Category =
  | "Groceries"
  | "Dining"
  | "Transport"
  | "Entertainment"
  | "Shopping"
  | "Health"
  | "Other";

export const CATEGORIES: { label: Category; icon: string }[] = [
  { label: "Groceries", icon: "🛒" },
  { label: "Dining", icon: "🍽️" },
  { label: "Transport", icon: "⛽" },
  { label: "Entertainment", icon: "🎬" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Health", icon: "💊" },
  { label: "Other", icon: "📦" },
];

export type Transaction = {
  id: string;
  merchant: string;
  category: Category;
  amount: number;
  date: string; // ISO string
  paid: boolean;
  note?: string;
};

export type Payment = {
  id: string;
  amount: number;
  date: string;
};

type ContextType = {
  transactions: Transaction[];
  payments: Payment[];
  budget: number;
  unpaidBalance: number;
  monthlySpent: number;
  todaySpent: number;
  addTransaction: (t: Omit<Transaction, "id" | "paid">) => Promise<void>;
  payAll: () => Promise<void>;
};

const ExpensesContext = createContext<ContextType>(null!);

const BUDGET = 500;

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [txRaw, pyRaw] = await Promise.all([
          AsyncStorage.getItem("transactions"),
          AsyncStorage.getItem("payments"),
        ]);
        if (txRaw) setTransactions(JSON.parse(txRaw));
        if (pyRaw) setPayments(JSON.parse(pyRaw));
      } catch {}
    })();
  }, []);

  async function persist(txs: Transaction[], pays: Payment[]) {
    await Promise.all([
      AsyncStorage.setItem("transactions", JSON.stringify(txs)),
      AsyncStorage.setItem("payments", JSON.stringify(pays)),
    ]);
  }

  async function addTransaction(t: Omit<Transaction, "id" | "paid">) {
    const tx: Transaction = { ...t, id: Date.now().toString(), paid: false };
    const updated = [tx, ...transactions];
    setTransactions(updated);
    await persist(updated, payments);
  }

  async function payAll() {
    const now = new Date().toISOString();
    const unpaid = transactions.filter((t) => !t.paid);
    const total = unpaid.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return;

    const updatedTxs = transactions.map((t) =>
      t.paid ? t : { ...t, paid: true }
    );
    const newPayment: Payment = {
      id: Date.now().toString(),
      amount: total,
      date: now,
    };
    const updatedPays = [newPayment, ...payments];
    setTransactions(updatedTxs);
    setPayments(updatedPays);
    await persist(updatedTxs, updatedPays);
  }

  const unpaidBalance = transactions
    .filter((t) => !t.paid)
    .reduce((s, t) => s + t.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlySpent = transactions
    .filter((t) => t.date >= monthStart)
    .reduce((s, t) => s + t.amount, 0);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todaySpent = transactions
    .filter((t) => t.date >= todayStart)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <ExpensesContext.Provider
      value={{
        transactions,
        payments,
        budget: BUDGET,
        unpaidBalance,
        monthlySpent,
        todaySpent,
        addTransaction,
        payAll,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export const useExpenses = () => useContext(ExpensesContext);
