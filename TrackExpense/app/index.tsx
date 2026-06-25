import { useExpenses } from "@/context/expenses";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  amber: "#F59E0B",
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
  const {
    transactions, history, cycle, cycleHistory,
    total, payAll, deleteTransaction,
    startCycle, endCycle,
  } = useExpenses();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  // Pay modal
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [applyToBudget, setApplyToBudget] = useState(true);

  // Cycle modal (start / new cycle after end)
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [cycleInput, setCycleInput] = useState("");

  const remaining = cycle ? cycle.budgetAmount - cycle.cycleSpent : 0;
  const progress = cycle && cycle.budgetAmount > 0
    ? Math.min(cycle.cycleSpent / cycle.budgetAmount, 1)
    : 0;
  const progressColor = progress >= 1 ? C.red : progress >= 0.8 ? C.amber : C.green;

  function openPayModal() {
    if (total === 0) return;
    setApplyToBudget(cycle !== null);
    setPayModalVisible(true);
  }

  function confirmPay() {
    setPayModalVisible(false);
    payAll(applyToBudget);
  }

  function openCycleModal() {
    setCycleInput("");
    setCycleModalVisible(true);
  }

  function saveCycle() {
    const val = parseFloat(cycleInput.replace(/[^0-9.]/g, ""));
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid amount", "Please enter a number greater than 0.");
      return;
    }
    startCycle(val);
    setCycleModalVisible(false);
  }

  function handleEndCycle() {
    if (!cycle) return;
    Alert.alert(
      "End Budget Cycle",
      `End this cycle?\n\nBudget: $${fmt(cycle.budgetAmount)}\nSpent: $${fmt(cycle.cycleSpent)}\nRemaining: $${fmt(remaining > 0 ? remaining : 0)}\n\nThis will be saved to history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Cycle",
          style: "destructive",
          onPress: async () => {
            await endCycle();
            openCycleModal();
          },
        },
      ]
    );
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>TrackExpense</Text>

        {/* Running Total Card */}
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
            onPress={openPayModal}
            disabled={total === 0}
          >
            <Text style={s.payBtnText}>
              {total === 0 ? "Nothing to pay" : `Mark $${fmt(total)} as Paid`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Budget Cycle Card */}
        {cycle ? (
          <View style={s.budgetCard}>
            <View style={s.budgetHeader}>
              <View>
                <Text style={s.budgetLabel}>Budget Cycle</Text>
                <Text style={s.budgetStarted}>Started {fmtDate(cycle.startDate)}</Text>
              </View>
              <TouchableOpacity style={s.endCycleBtn} onPress={handleEndCycle}>
                <Text style={s.endCycleBtnText}>End Cycle</Text>
              </TouchableOpacity>
            </View>

            <View style={s.budgetAmounts}>
              <View>
                <Text style={[s.budgetRemaining, remaining < 0 && { color: C.red }]}>
                  ${fmt(remaining < 0 ? 0 : remaining)}
                </Text>
                <Text style={s.budgetRemainingLabel}>remaining</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.budgetTotal}>${fmt(cycle.budgetAmount)}</Text>
                <Text style={s.budgetTotalLabel}>budget</Text>
              </View>
            </View>

            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  { width: `${Math.round(progress * 100)}%` as any, backgroundColor: progressColor },
                ]}
              />
            </View>
            <Text style={s.budgetSpent}>
              ${fmt(cycle.cycleSpent)} spent of ${fmt(cycle.budgetAmount)}
              {remaining < 0 && "  —  over budget"}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={s.startCycleCard} onPress={openCycleModal}>
            <Text style={s.startCycleTitle}>No Active Budget Cycle</Text>
            <Text style={s.startCycleSub}>Tap to start a new cycle and track spending against a budget</Text>
            <View style={s.startCycleBtn}>
              <Text style={s.startCycleBtnText}>Start Budget Cycle</Text>
            </View>
          </TouchableOpacity>
        )}

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
                      <View style={s.historyMeta}>
                        {record.appliedToBudget && (
                          <View style={s.budgetBadge}>
                            <Text style={s.budgetBadgeText}>Budget</Text>
                          </View>
                        )}
                        <Text style={s.historyChevron}>{expanded ? "▲" : "▼"}</Text>
                      </View>
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

        {/* Cycle History */}
        {cycleHistory.length > 0 && (
          <>
            <Text style={[s.sectionTitle, s.sectionTitleGap]}>Cycle History</Text>
            {cycleHistory.map((c) => {
              const expanded = expandedCycleId === c.id;
              const cycleRemaining = c.budgetAmount - c.cycleSpent;
              const cycleProgress = c.budgetAmount > 0
                ? Math.min(c.cycleSpent / c.budgetAmount, 1)
                : 0;
              const cycleColor = cycleProgress >= 1 ? C.red : cycleProgress >= 0.8 ? C.amber : C.green;
              return (
                <View key={c.id} style={s.cycleHistoryCard}>
                  <TouchableOpacity
                    style={s.historyHeader}
                    onPress={() => setExpandedCycleId(expanded ? null : c.id)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={s.historyDate}>{fmtDate(c.startDate)} — {c.endDate ? fmtDate(c.endDate) : "ongoing"}</Text>
                      <Text style={s.historyCount}>Budget: ${fmt(c.budgetAmount)}</Text>
                    </View>
                    <View style={s.historyRight}>
                      <Text style={[s.historyTotal, { color: cycleRemaining >= 0 ? C.green : C.red }]}>
                        {cycleRemaining >= 0 ? `$${fmt(cycleRemaining)} left` : `$${fmt(-cycleRemaining)} over`}
                      </Text>
                      <Text style={s.historyChevron}>{expanded ? "▲" : "▼"}</Text>
                    </View>
                  </TouchableOpacity>

                  {expanded && (
                    <View style={s.historyItems}>
                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${Math.round(cycleProgress * 100)}%` as any, backgroundColor: cycleColor }]} />
                      </View>
                      <Text style={[s.budgetSpent, { marginTop: 8 }]}>
                        ${fmt(c.cycleSpent)} spent of ${fmt(c.budgetAmount)}
                      </Text>
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

      {/* Pay Modal */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Mark as Paid</Text>
            <Text style={s.modalAmount}>${fmt(total)}</Text>
            <Text style={s.modalSub}>
              {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"} will be cleared.
            </Text>

            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>Apply to budget cycle</Text>
                {!cycle && (
                  <Text style={s.toggleNote}>No active cycle</Text>
                )}
              </View>
              <Switch
                value={applyToBudget && cycle !== null}
                onValueChange={(v) => setApplyToBudget(v)}
                disabled={cycle === null}
                trackColor={{ true: C.blue }}
                thumbColor="#FFF"
              />
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setPayModalVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={confirmPay}>
                <Text style={s.modalSaveText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Start / New Cycle Modal */}
      <Modal
        visible={cycleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCycleModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Budget Cycle</Text>
            <Text style={s.modalSub}>Set the total amount you want to spend this cycle. It decreases each time you mark a payment as applied.</Text>
            <TextInput
              style={s.modalInput}
              value={cycleInput}
              onChangeText={setCycleInput}
              keyboardType="decimal-pad"
              placeholder="e.g. 2000"
              placeholderTextColor={C.textSub}
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setCycleModalVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={saveCycle}>
                <Text style={s.modalSaveText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 16,
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

  budgetCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  budgetLabel: { fontSize: 16, fontWeight: "700", color: C.text },
  budgetStarted: { fontSize: 12, color: C.textSub, marginTop: 2 },
  endCycleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.red,
  },
  endCycleBtnText: { fontSize: 13, fontWeight: "600", color: C.red },
  budgetAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  budgetRemaining: { fontSize: 32, fontWeight: "800", color: C.text, letterSpacing: -1 },
  budgetRemainingLabel: { fontSize: 12, color: C.textSub, marginTop: 2 },
  budgetTotal: { fontSize: 15, fontWeight: "600", color: C.textSub },
  budgetTotalLabel: { fontSize: 12, color: C.textSub, marginTop: 2 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.07)",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  budgetSpent: { fontSize: 12, color: C.textSub },

  startCycleCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
  },
  startCycleTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 6 },
  startCycleSub: { fontSize: 13, color: C.textSub, textAlign: "center", marginBottom: 16, lineHeight: 18 },
  startCycleBtn: {
    backgroundColor: C.blue,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startCycleBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  sectionTitleGap: { marginTop: 24 },

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
  deleteBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: C.red },

  historyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 10,
    overflow: "hidden",
  },
  cycleHistoryCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: C.blue,
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
  historyMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  budgetBadge: {
    backgroundColor: "rgba(58,144,243,0.12)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  budgetBadgeText: { fontSize: 10, fontWeight: "700", color: C.blue },
  historyChevron: { fontSize: 10, color: C.textSub },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 4 },
  modalAmount: { fontSize: 40, fontWeight: "800", color: C.text, letterSpacing: -1, marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.textSub, marginBottom: 20, lineHeight: 18 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: C.text },
  toggleNote: { fontSize: 12, color: C.textSub, marginTop: 2 },
  modalInput: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: C.textSub },
  modalSave: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.blue,
    alignItems: "center",
  },
  modalSaveText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});
