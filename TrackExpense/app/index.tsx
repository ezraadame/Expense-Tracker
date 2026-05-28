import { useExpenses } from "@/context/expenses";
import { router } from "expo-router";
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
  bg: "#070B14",
  card: "#0D1526",
  cardBorder: "rgba(255,255,255,0.07)",
  blue: "#2563EB",
  blueBright: "#60A5FA",
  orange: "#FBBF24",
  text: "#F1F5F9",
  textSub: "#475569",
  green: "#34D399",
  red: "#F87171",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  const { transactions, budget, unpaidBalance, monthlySpent, todaySpent, payAll } =
    useExpenses();

  const budgetPct = Math.min(monthlySpent / budget, 1);
  const budgetOver = monthlySpent > budget;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTxs = transactions.filter(
    (t) => new Date(t.date) >= todayStart
  );

  const recentPaid = transactions
    .filter((t) => t.paid)
    .slice(0, 3);

  function handlePay() {
    if (unpaidBalance === 0) return;
    Alert.alert(
      "Submit Payment",
      `Pay $${fmt(unpaidBalance)} to your Chase card?\n\nThis will mark all unpaid transactions as settled.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Pay $${fmt(unpaidBalance)}`,
          style: "default",
          onPress: () => payAll(),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{todayLabel()}</Text>
            <Text style={s.title}>My Chase</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>E</Text>
          </View>
        </View>

        {/* Unpaid Balance — Primary Card */}
        <View style={s.primaryCard}>
          <Text style={s.primaryLabel}>Unpaid Balance</Text>
          <Text style={s.primaryAmount}>${fmt(unpaidBalance)}</Text>
          <Text style={s.primarySub}>
            {unpaidBalance === 0
              ? "All caught up — no pending charges"
              : `$${fmt(todaySpent)} added today · tap to pay`}
          </Text>

          <TouchableOpacity
            style={[s.payBtn, unpaidBalance === 0 && s.payBtnDisabled]}
            onPress={handlePay}
            disabled={unpaidBalance === 0}
          >
            <Text style={s.payBtnText}>
              {unpaidBalance === 0 ? "All Paid ✓" : `Pay $${fmt(unpaidBalance)}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Budget */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.cardLabel}>Monthly Budget</Text>
            <Text
              style={[
                s.cardValue,
                { color: budgetOver ? C.red : C.orange },
              ]}
            >
              ${fmt(monthlySpent)} <Text style={s.cardValueSub}>/ ${budget}</Text>
            </Text>
          </View>
          <View style={s.track}>
            <View
              style={[
                s.trackFill,
                {
                  width: `${budgetPct * 100}%` as any,
                  backgroundColor: budgetOver ? C.red : C.orange,
                },
              ]}
            />
          </View>
          <Text style={s.budgetRemaining}>
            {budgetOver
              ? `$${fmt(monthlySpent - budget)} over budget`
              : `$${fmt(budget - monthlySpent)} remaining this month`}
          </Text>
        </View>

        {/* Today's Transactions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today</Text>
          {todayTxs.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyText}>No transactions yet today</Text>
              <Text style={s.emptySub}>Tap + to log a charge from Chase</Text>
            </View>
          ) : (
            todayTxs.map((tx) => (
              <View key={tx.id} style={s.txRow}>
                <View style={s.txLeft}>
                  <Text style={s.txMerchant}>{tx.merchant}</Text>
                  <Text style={s.txCategory}>{tx.category}</Text>
                </View>
                <View style={s.txRight}>
                  <Text style={[s.txAmount, tx.paid && s.txAmountPaid]}>
                    ${fmt(tx.amount)}
                  </Text>
                  {tx.paid ? (
                    <Text style={s.paidBadge}>Paid</Text>
                  ) : (
                    <Text style={s.unpaidBadge}>Unpaid</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent — older unpaid + recently paid */}
        {transactions.filter((t) => new Date(t.date) < todayStart).length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent</Text>
            {transactions
              .filter((t) => new Date(t.date) < todayStart)
              .slice(0, 5)
              .map((tx) => (
                <View key={tx.id} style={s.txRow}>
                  <View style={s.txLeft}>
                    <Text style={s.txMerchant}>{tx.merchant}</Text>
                    <Text style={s.txCategory}>
                      {tx.category} ·{" "}
                      {new Date(tx.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={s.txRight}>
                    <Text style={[s.txAmount, tx.paid && s.txAmountPaid]}>
                      ${fmt(tx.amount)}
                    </Text>
                    {tx.paid ? (
                      <Text style={s.paidBadge}>Paid</Text>
                    ) : (
                      <Text style={s.unpaidBadge}>Unpaid</Text>
                    )}
                  </View>
                </View>
              ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => router.push("/add")} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: C.textSub },
  title: { fontSize: 28, fontWeight: "800", color: C.text, letterSpacing: -0.5, marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.blue, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: C.blueBright + "40",
  },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  // Primary card
  primaryCard: {
    backgroundColor: C.blue,
    borderRadius: 24,
    padding: 24,
    marginBottom: 14,
  },
  primaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", letterSpacing: 0.5, textTransform: "uppercase" },
  primaryAmount: { fontSize: 48, fontWeight: "800", color: "#FFF", letterSpacing: -2, marginTop: 4, marginBottom: 4 },
  primarySub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 20 },
  payBtn: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  payBtnDisabled: { backgroundColor: "rgba(255,255,255,0.2)" },
  payBtnText: { fontSize: 15, fontWeight: "700", color: C.blue },

  // Budget card
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLabel: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  cardValue: { fontSize: 16, fontWeight: "700" },
  cardValueSub: { fontSize: 13, color: C.textSub, fontWeight: "400" },
  track: {
    height: 5, backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3, overflow: "hidden", marginBottom: 8,
  },
  trackFill: { height: "100%", borderRadius: 3 },
  budgetRemaining: { fontSize: 12, color: C.textSub },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 12, letterSpacing: -0.2 },

  // Empty state
  emptyState: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.textSub },

  // Transaction rows
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  txLeft: { flex: 1 },
  txMerchant: { fontSize: 14, fontWeight: "600", color: C.text },
  txCategory: { fontSize: 12, color: C.textSub, marginTop: 2 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 15, fontWeight: "700", color: C.orange },
  txAmountPaid: { color: C.textSub },
  paidBadge: { fontSize: 11, color: C.green, fontWeight: "600", marginTop: 3 },
  unpaidBadge: { fontSize: 11, color: C.orange, fontWeight: "600", marginTop: 3 },

  // FAB
  fab: {
    position: "absolute", bottom: 36, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.blue,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.blue, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  fabText: { color: "#FFF", fontSize: 28, fontWeight: "300", lineHeight: 32 },
});
