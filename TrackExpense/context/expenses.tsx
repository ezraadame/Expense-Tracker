import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
};

export type PaymentRecord = {
  id: string;
  date: string;
  total: number;
  transactions: Transaction[];
};

type ContextType = {
  transactions: Transaction[];
  history: PaymentRecord[];
  total: number;
  addTransaction: (name: string, amount: number) => Promise<void>;
  editTransaction: (id: string, name: string, amount: number) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  payAll: () => Promise<void>;
};

const ExpensesContext = createContext<ContextType>(null!);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [txRaw, histRaw] = await Promise.all([
          AsyncStorage.getItem("transactions"),
          AsyncStorage.getItem("history"),
        ]);
        if (txRaw) setTransactions(JSON.parse(txRaw));
        if (histRaw) setHistory(JSON.parse(histRaw));
      } catch {}
    })();
  }, []);

  async function addTransaction(name: string, amount: number) {
    const tx: Transaction = {
      id: Date.now().toString(),
      name,
      amount,
      date: new Date().toISOString(),
    };
    const updated = [tx, ...transactions];
    setTransactions(updated);
    await AsyncStorage.setItem("transactions", JSON.stringify(updated));
  }

  async function editTransaction(id: string, name: string, amount: number) {
    const updated = transactions.map((tx) =>
      tx.id === id ? { ...tx, name, amount } : tx
    );
    setTransactions(updated);
    await AsyncStorage.setItem("transactions", JSON.stringify(updated));
  }

  async function deleteTransaction(id: string) {
    const updated = transactions.filter((tx) => tx.id !== id);
    setTransactions(updated);
    await AsyncStorage.setItem("transactions", JSON.stringify(updated));
  }

  async function payAll() {
    if (transactions.length === 0) return;
    const record: PaymentRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: transactions.reduce((s, t) => s + t.amount, 0),
      transactions: [...transactions],
    };
    const updatedHistory = [record, ...history];
    setHistory(updatedHistory);
    setTransactions([]);
    await Promise.all([
      AsyncStorage.removeItem("transactions"),
      AsyncStorage.setItem("history", JSON.stringify(updatedHistory)),
    ]);
  }

  const total = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <ExpensesContext.Provider value={{ transactions, history, total, addTransaction, editTransaction, deleteTransaction, payAll }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export const useExpenses = () => useContext(ExpensesContext);
