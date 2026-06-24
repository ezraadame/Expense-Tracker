import { useExpenses } from "@/context/expenses";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.08)",
  blue: "#3A90F3",
  text: "#1C1C1E",
  textSub: "#8E8E93",
  green: "#34C759",
  red: "#FF3B30",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} at ${time}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { transactions, history, total, payAll, deleteTransaction } = useExpenses();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  }

  function handlePay() {
    if (total === 0) return;
    Alert.alert(
      "Mark as Paid",
      `Mark $${fmt(total)} as paid and clear all transactions?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Paid", onPress: () => payAll() },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Expense Tracker</Text>

        {/* Total Card */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>Running Total</Text>
          <Text style={s.totalAmount}>${fmt(total)}</Text>
          <Text style={s.totalSub}>
            {transactions.length === 0
              ? "No pending transactions"
              : `${transactions.length} unpaid ${transactions.length === 1 ? "transaction" : "transactions"}`}
          </Text>

          <TouchableOpacity
            style={[s.payBtn, total === 0 && s.payBtnDisabled]}
            onPress={handlePay}
            disabled={total === 0}
          >
            <Text style={s.payBtnText}>
              {total === 0 ? "Nothing to pay" : `Mark $${fmt(total)} as Paid`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        <Text style={s.sectionTitle}>Transactions</Text>

        {transactions.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No transactions yet</Text>
            <Text style={s.emptySub}>Tap + to add one</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const expanded = expandedTxId === tx.id;
            return (
              <View key={tx.id} style={s.row}>
                <TouchableOpacity
                  style={s.rowMain}
                  onPress={() => setExpandedTxId(expanded ? null : tx.id)}
                  activeOpacity={0.7}
                >
                  <View style={s.rowLeft}>
                    <Text style={s.rowName}>{tx.name}</Text>
                    <Text style={s.rowDate}>{fmtDateTime(tx.date)}</Text>
                  </View>
                  <Text style={s.rowAmount}>${fmt(tx.amount)}</Text>
                </TouchableOpacity>

                {expanded && (
                  <View style={s.rowActions}>
                    <TouchableOpacity
                      style={s.editBtn}
                      onPress={() => {
                        setExpandedTxId(null);
                        router.push({ pathname: "/add", params: { id: tx.id, name: tx.name, amount: String(tx.amount) } });
                      }}
                    >
                      <Text style={s.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => handleDelete(tx.id)}
                    >
                      <Text style={s.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Payment History */}
        {history.length > 0 && (
          <>
            <Text style={[s.sectionTitle, s.sectionTitleGap]}>Payment History</Text>
            {history.map((record) => {
              const expanded = expandedId === record.id;
              return (
                <View key={record.id} style={s.historyCard}>
                  <TouchableOpacity
                    style={s.historyHeader}
                    onPress={() => setExpandedId(expanded ? null : record.id)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={s.historyDate}>{fmtDate(record.date)}</Text>
                      <Text style={s.historyCount}>{record.transactions.length} transactions</Text>
                    </View>
                    <View style={s.historyRight}>
                      <Text style={s.historyTotal}>${fmt(record.total)}</Text>
                      <Text style={s.historyChevron}>{expanded ? "▲" : "▼"}</Text>
                    </View>
                  </TouchableOpacity>

                  {expanded && (
                    <View style={s.historyItems}>
                      {record.transactions.map((tx) => (
                        <View key={tx.id} style={s.historyRow}>
                          <Text style={s.historyItemName}>{tx.name}</Text>
                          <Text style={s.historyItemAmount}>${fmt(tx.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push("/add")}
        activeOpacity={0.85}
      >
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 32,
  },

  totalCard: {
    backgroundColor: C.blue,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  totalLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -2,
    marginTop: 4,
    marginBottom: 4,
  },
  totalSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 20,
  },
  payBtn: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  payBtnDisabled: { backgroundColor: "rgba(255,255,255,0.25)" },
  payBtnText: { fontSize: 15, fontWeight: "700", color: C.blue },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  sectionTitleGap: {
    marginTop: 24,
  },

  empty: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyText: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.textSub },

  row: {
    backgroundColor: C.card,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: C.red,
    overflow: "hidden",
  },
  rowMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowName: { fontSize: 15, fontWeight: "600", color: C.text },
  rowDate: { fontSize: 12, color: C.textSub, marginTop: 3 },
  rowAmount: { fontSize: 15, fontWeight: "700", color: C.red },
  rowActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: C.cardBorder,
  },
  editBtnText: { fontSize: 14, fontWeight: "600", color: C.blue },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: C.red },

  historyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 10,
    overflow: "hidden",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyDate: { fontSize: 14, fontWeight: "600", color: C.text },
  historyCount: { fontSize: 12, color: C.textSub, marginTop: 2 },
  historyRight: { alignItems: "flex-end" },
  historyTotal: { fontSize: 15, fontWeight: "700", color: C.green },
  historyChevron: { fontSize: 10, color: C.textSub, marginTop: 4 },
  historyItems: {
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  historyItemName: { fontSize: 13, color: C.textSub, flex: 1 },
  historyItemAmount: { fontSize: 13, fontWeight: "600", color: C.text },

  fab: {
    position: "absolute",
    bottom: 36,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: { color: "#FFF", fontSize: 28, fontWeight: "300", lineHeight: 32 },
});
