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
  appliedToBudget: boolean;
};

export type BudgetCycle = {
  id: string;
  budgetAmount: number;
  startDate: string;
  endDate?: string;
  cycleSpent: number;
};

type ContextType = {
  transactions: Transaction[];
  history: PaymentRecord[];
  cycle: BudgetCycle | null;
  cycleHistory: BudgetCycle[];
  total: number;
  addTransaction: (name: string, amount: number) => Promise<void>;
  editTransaction: (id: string, name: string, amount: number) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  payAll: (applyToBudget: boolean) => Promise<void>;
  startCycle: (amount: number) => Promise<void>;
  endCycle: () => Promise<void>;
};

const ExpensesContext = createContext<ContextType>(null!);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [cycle, setCycle] = useState<BudgetCycle | null>(null);
  const [cycleHistory, setCycleHistory] = useState<BudgetCycle[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [txRaw, histRaw, cycleRaw, cycleHistRaw] = await Promise.all([
          AsyncStorage.getItem("transactions"),
          AsyncStorage.getItem("history"),
          AsyncStorage.getItem("cycle"),
          AsyncStorage.getItem("cycleHistory"),
        ]);
        if (txRaw) setTransactions(JSON.parse(txRaw));
        if (histRaw) setHistory(JSON.parse(histRaw));
        if (cycleRaw) setCycle(JSON.parse(cycleRaw));
        if (cycleHistRaw) setCycleHistory(JSON.parse(cycleHistRaw));
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

  async function payAll(applyToBudget: boolean) {
    if (transactions.length === 0) return;
    const paymentTotal = transactions.reduce((s, t) => s + t.amount, 0);

    const record: PaymentRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: paymentTotal,
      transactions: [...transactions],
      appliedToBudget: applyToBudget && cycle !== null,
    };
    const updatedHistory = [record, ...history];
    setHistory(updatedHistory);
    setTransactions([]);

    let updatedCycle = cycle;
    if (applyToBudget && cycle) {
      updatedCycle = { ...cycle, cycleSpent: cycle.cycleSpent + paymentTotal };
      setCycle(updatedCycle);
    }

    await Promise.all([
      AsyncStorage.removeItem("transactions"),
      AsyncStorage.setItem("history", JSON.stringify(updatedHistory)),
      updatedCycle !== cycle
        ? AsyncStorage.setItem("cycle", JSON.stringify(updatedCycle))
        : Promise.resolve(),
    ]);
  }

  async function startCycle(amount: number) {
    const newCycle: BudgetCycle = {
      id: Date.now().toString(),
      budgetAmount: amount,
      startDate: new Date().toISOString(),
      cycleSpent: 0,
    };
    setCycle(newCycle);
    await AsyncStorage.setItem("cycle", JSON.stringify(newCycle));
  }

  async function endCycle() {
    if (!cycle) return;
    const closed: BudgetCycle = { ...cycle, endDate: new Date().toISOString() };
    const updatedCycleHistory = [closed, ...cycleHistory];
    setCycleHistory(updatedCycleHistory);
    setCycle(null);
    await Promise.all([
      AsyncStorage.removeItem("cycle"),
      AsyncStorage.setItem("cycleHistory", JSON.stringify(updatedCycleHistory)),
    ]);
  }

  const total = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <ExpensesContext.Provider
      value={{
        transactions,
        history,
        cycle,
        cycleHistory,
        total,
        addTransaction,
        editTransaction,
        deleteTransaction,
        payAll,
        startCycle,
        endCycle,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export const useExpenses = () => useContext(ExpensesContext);
