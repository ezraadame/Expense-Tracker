import { CATEGORIES, Category, useExpenses } from "@/context/expenses";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  inputBg: "#111827",
  inputBorder: "rgba(255,255,255,0.1)",
};

export default function AddTransaction() {
  const { addTransaction } = useExpenses();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const merchantRef = useRef<TextInput>(null);

  async function handleSave() {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Enter an amount", "Please enter a valid dollar amount.");
      return;
    }
    if (!merchant.trim()) {
      Alert.alert("Enter a merchant", "Who did you spend this at?");
      return;
    }
    if (!category) {
      Alert.alert("Select a category", "Choose a category for this transaction.");
      return;
    }

    setSaving(true);
    await addTransaction({
      merchant: merchant.trim(),
      category,
      amount: parsed,
      date: new Date().toISOString(),
      note: note.trim() || undefined,
    });
    setSaving(false);
    router.back();
  }

  function handleAmountChange(text: string) {
    // Only allow numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.title}>Log Transaction</Text>
          </View>

          {/* Amount */}
          <View style={s.amountContainer}>
            <Text style={s.currencySymbol}>$</Text>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.15)"
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => merchantRef.current?.focus()}
              autoFocus
            />
          </View>

          {/* Merchant */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Merchant</Text>
            <TextInput
              ref={merchantRef}
              style={s.input}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Whole Foods, Shell, Netflix"
              placeholderTextColor={C.textSub}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>

          {/* Category */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Category</Text>
            <View style={s.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[s.catChip, selected && s.catChipSelected]}
                    onPress={() => setCategory(cat.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.catIcon}>{cat.icon}</Text>
                    <Text style={[s.catLabel, selected && s.catLabelSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Note */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Note <Text style={s.optional}>(optional)</Text></Text>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Weekly grocery run"
              placeholderTextColor={C.textSub}
              returnKeyType="done"
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnText}>{saving ? "Saving…" : "Add to Unpaid"}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  // Header
  header: { marginBottom: 32 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, color: C.blueBright, fontWeight: "500" },
  title: { fontSize: 28, fontWeight: "800", color: C.text, letterSpacing: -0.5 },

  // Amount
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingBottom: 16,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: "300",
    color: C.orange,
    marginRight: 4,
    lineHeight: 56,
  },
  amountInput: {
    flex: 1,
    fontSize: 56,
    fontWeight: "800",
    color: C.orange,
    letterSpacing: -2,
    padding: 0,
  },

  // Fields
  field: { marginBottom: 24 },
  fieldLabel: { fontSize: 13, color: C.textSub, fontWeight: "500", marginBottom: 10, letterSpacing: 0.3, textTransform: "uppercase" },
  optional: { color: C.textSub, fontWeight: "400", textTransform: "none" },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
  },

  // Category grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  catChipSelected: {
    backgroundColor: C.blue + "30",
    borderColor: C.blue,
  },
  catIcon: { fontSize: 16 },
  catLabel: { fontSize: 13, color: C.textSub, fontWeight: "500" },
  catLabelSelected: { color: C.blueBright, fontWeight: "600" },

  // Save button
  saveBtn: {
    backgroundColor: C.blue,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
